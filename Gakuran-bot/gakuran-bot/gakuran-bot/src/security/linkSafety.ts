/**
 * Vérification de sécurité des liens postés dans le chat, via l'API
 * Google Safe Browsing (phishing / malware / logiciels indésirables).
 *
 * Nécessite GOOGLE_SAFE_BROWSING_API_KEY dans .env (voir .env.example).
 * Alternative gratuite/self-hosted : VirusTotal API, urlscan.io.
 */
import { env } from '../config';
import { logger } from '../logger';

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export function extractUrls(content: string): string[] {
  return content.match(URL_REGEX) ?? [];
}

export async function isUrlDangerous(url: string): Promise<boolean> {
  if (!env.GOOGLE_SAFE_BROWSING_API_KEY) {
    logger.warn('GOOGLE_SAFE_BROWSING_API_KEY absent : vérification de lien ignorée');
    return false;
  }

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${env.GOOGLE_SAFE_BROWSING_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'gakuran-bot', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
      },
    );
    const data = (await res.json()) as { matches?: unknown[] };
    return Boolean(data.matches?.length);
  } catch (err) {
    // En cas d'échec de l'API : on ne bloque PAS le message par défaut
    // (fail-open) mais on log l'incident pour investigation.
    logger.error({ err, url }, 'Échec de la vérification de lien');
    return false;
  }
}
