/**
 * Validation stricte des variables d'environnement au démarrage.
 * -> Le bot refuse de démarrer si une variable requise est absente/invalide.
 *    C'est une protection basique mais essentielle : on ne veut jamais
 *    qu'un bot parte en prod avec un token vide ou une config cassée.
 */
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN manquant'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID manquant'),
  DISCORD_GUILD_ID_DEV: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL manquant'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.string().default('info'),
  GOOGLE_SAFE_BROWSING_API_KEY: z.string().optional(),
  IMAGE_MODERATION_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // On log les erreurs de manière lisible puis on arrête le process.
  // Ne jamais afficher les valeurs elles-mêmes (risque de fuite de secrets dans les logs).
  console.error('❌ Configuration invalide :');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
