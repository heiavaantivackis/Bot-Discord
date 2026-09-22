import { GakuranClient } from './client';
import { env } from './config';
import { logger } from './logger';
import { loadCommands } from './handlers/commandHandler';
import { loadEvents } from './handlers/eventHandler';
import { Events, ChatInputCommandInteraction } from 'discord.js';
import { isRateLimited } from './security/rateLimiter';

const client = new GakuranClient();

client.once(Events.ClientReady, (c) => {
  logger.info(`✅ Connecté en tant que ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleCommand(interaction as ChatInputCommandInteraction, client);
});

async function handleCommand(interaction: ChatInputCommandInteraction, botClient: GakuranClient) {
  const command = botClient.commands.get(interaction.commandName);
  if (!command) return;

  if (command.cooldown && isRateLimited(`${command.data.name}:${interaction.user.id}`, command.cooldown)) {
    await interaction.reply({ content: '⏳ Merci de patienter avant de réutiliser cette commande.', ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction, botClient);
  } catch (err) {
    // On ne renvoie JAMAIS le détail d'une erreur interne à l'utilisateur
    // (risque de fuite d'infos sur l'infra / la DB). On log côté serveur
    // uniquement et on affiche un message générique.
    logger.error({ err, command: interaction.commandName, user: interaction.user.id }, 'Erreur commande');
    const payload = { content: "❌ Une erreur est survenue. L'équipe a été notifiée.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
}

// Filets de sécurité process-level : on log au lieu de crasher silencieusement.
process.on('unhandledRejection', (reason) => logger.error({ reason }, 'Unhandled Rejection'));
process.on('uncaughtException', (err) => logger.error({ err }, 'Uncaught Exception'));

async function main() {
  await loadCommands(client);
  loadEvents(client);
  await client.login(env.DISCORD_TOKEN);
}

main().catch((err) => {
  logger.fatal({ err }, 'Échec du démarrage du bot');
  process.exit(1);
});
