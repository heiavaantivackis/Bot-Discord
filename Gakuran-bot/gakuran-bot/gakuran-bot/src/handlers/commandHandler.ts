import fs from 'node:fs';
import path from 'node:path';
import { REST, Routes } from 'discord.js';
import { GakuranClient, Command } from '../client';
import { env } from '../config';
import { logger } from '../logger';

/**
 * Charge dynamiquement toutes les commandes dans src/modules/*/commands/*.ts
 * puis les enregistre auprès de l'API Discord.
 */
export async function loadCommands(client: GakuranClient): Promise<void> {
  const modulesPath = path.join(__dirname, '..', 'modules');
  const commandsData: unknown[] = [];

  for (const moduleName of fs.readdirSync(modulesPath)) {
    const commandsDir = path.join(modulesPath, moduleName, 'commands');
    if (!fs.existsSync(commandsDir)) continue;

    for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))) {
      const command: Command = require(path.join(commandsDir, file)).default;
      if (!command?.data?.name) {
        logger.warn(`Commande invalide ignorée : ${moduleName}/${file}`);
        continue;
      }
      client.commands.set(command.data.name, command);
      commandsData.push(command.data.toJSON());
    }
  }

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  // En dev : déploiement instantané sur un serveur de test.
  // En prod : déploiement global (peut prendre jusqu'à 1h à se propager).
  if (env.DISCORD_GUILD_ID_DEV) {
    await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID_DEV), {
      body: commandsData,
    });
    logger.info(`${commandsData.length} commandes déployées (guild de dev)`);
  } else {
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: commandsData });
    logger.info(`${commandsData.length} commandes déployées (global)`);
  }
}
