import pino from 'pino';
import { env, isProd } from './config';

/**
 * Logger centralisé. En prod : JSON structuré (pour ingestion par un outil
 * de monitoring). En dev : sortie lisible avec pino-pretty.
 * Ne jamais logger : le token, les mots de passe DB, les tokens de session.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
  redact: ['*.token', '*.password', '*.DISCORD_TOKEN'],
});
