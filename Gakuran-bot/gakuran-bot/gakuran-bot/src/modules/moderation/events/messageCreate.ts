import { Events, Message } from 'discord.js';
import { GakuranClient } from '../../../client';
import { isMessageFlood } from '../../../security/rateLimiter';
import { extractUrls, isUrlDangerous } from '../../../security/linkSafety';
import { logger } from '../../../logger';

/**
 * Auto-modération (cahier des charges > Modération) :
 *  - anti-spam (flood de messages)
 *  - mots interdits (liste stockée en DB, modifiable par les modérateurs)
 *  - liens dangereux (Google Safe Browsing)
 *
 * NOTE : la modération d'image (NSFW/gore) doit passer par un service
 * externe spécialisé (ex: Sightengine, AWS Rekognition, Google Vision
 * SafeSearch) — jamais de détection "maison" fiable pour ce type de
 * contenu. Brancher l'appel API dans handleImageAttachments() ci-dessous.
 */
export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message, client: GakuranClient) {
    if (message.author.bot || !message.guild) return;

    // 1. Anti-flood
    if (isMessageFlood(message.author.id)) {
      await safeDelete(message);
      await warnUser(message, 'Merci de ne pas spammer le chat.');
      return;
    }

    // 2. Mots interdits (liste en base, gérable via une commande /modword)
    const badWords = await client.prisma.badWord.findMany();
    const lowerContent = message.content.toLowerCase();
    const matched = badWords.find((bw) => lowerContent.includes(bw.word.toLowerCase()));
    if (matched) {
      await safeDelete(message);
      await warnUser(message, 'Message supprimé : contenu non autorisé.');
      return;
    }

    // 3. Liens dangereux
    const urls = extractUrls(message.content);
    for (const url of urls) {
      if (await isUrlDangerous(url)) {
        await safeDelete(message);
        await warnUser(message, '⚠️ Lien potentiellement dangereux supprimé.');
        logger.warn({ url, userId: message.author.id }, 'Lien dangereux détecté et supprimé');
        return;
      }
    }

    // 4. TODO: modération d'image (voir note ci-dessus)
    // if (message.attachments.size > 0) await handleImageAttachments(message);
  },
};

async function safeDelete(message: Message) {
  try {
    await message.delete();
  } catch (err) {
    logger.error({ err }, 'Impossible de supprimer le message (permissions ?)');
  }
}

async function warnUser(message: Message, text: string) {
  try {
    const warning = await message.channel.send(`${message.author}, ${text}`);
    setTimeout(() => warning.delete().catch(() => {}), 5000);
  } catch (err) {
    logger.error({ err }, "Impossible d'envoyer l'avertissement");
  }
}
