/**
 * Anti-spam / anti-abus pour les commandes et le chat.
 * En dev : mémoire locale. En prod avec plusieurs instances/shards,
 * remplacer la Map par Redis (ioredis) pour un état partagé.
 */
const buckets = new Map<string, number>();

/**
 * @returns true si l'action est autorisée, false si l'utilisateur doit attendre.
 */
export function isRateLimited(key: string, cooldownSeconds: number): boolean {
  const now = Date.now();
  const last = buckets.get(key);
  if (last && now - last < cooldownSeconds * 1000) {
    return true; // limité
  }
  buckets.set(key, now);
  return false;
}

/**
 * Détection de flood de messages (protection anti-spam du module modération).
 * Fenêtre glissante simple : X messages en moins de Y secondes -> spam.
 */
const messageWindows = new Map<string, number[]>();

export function isMessageFlood(userId: string, maxMessages = 5, windowMs = 7000): boolean {
  const now = Date.now();
  const timestamps = (messageWindows.get(userId) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  messageWindows.set(userId, timestamps);
  return timestamps.length > maxMessages;
}
