import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { PrismaClient } from '@prisma/client';

export interface Command {
  data: { name: string; toJSON: () => unknown };
  // cooldown en secondes (protection anti-spam / anti-abus, cf security/rateLimiter.ts)
  cooldown?: number;
  execute: (interaction: import('discord.js').ChatInputCommandInteraction, client: GakuranClient) => Promise<void>;
}

export class GakuranClient extends Client {
  public commands = new Collection<string, Command>();
  public prisma = new PrismaClient();

  constructor() {
    super({
      // Principe du moindre privilège : on ne demande QUE les intents
      // réellement nécessaires aux fonctionnalités du bot.
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // bienvenue, captcha, rôle auto
        GatewayIntentBits.GuildMessages, // auto-modération
        GatewayIntentBits.MessageContent, // filtrage de contenu (mots interdits, liens)
        GatewayIntentBits.GuildMessageReactions,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
    });
  }
}
