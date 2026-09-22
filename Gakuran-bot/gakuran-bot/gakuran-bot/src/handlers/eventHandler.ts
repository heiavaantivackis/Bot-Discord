import fs from 'node:fs';
import path from 'node:path';
import { GakuranClient } from '../client';
import { logger } from '../logger';

export function loadEvents(client: GakuranClient): void {
  const modulesPath = path.join(__dirname, '..', 'modules');

  for (const moduleName of fs.readdirSync(modulesPath)) {
    const eventsDir = path.join(modulesPath, moduleName, 'events');
    if (!fs.existsSync(eventsDir)) continue;

    for (const file of fs.readdirSync(eventsDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))) {
      const event = require(path.join(eventsDir, file)).default;
      if (event.once) {
        client.once(event.name, (...args: unknown[]) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args: unknown[]) => event.execute(...args, client));
      }
      logger.debug(`Événement chargé : ${moduleName}/${event.name}`);
    }
  }
}
