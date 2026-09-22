/**
 * Vérification anti-bot des nouveaux arrivants.
 *
 * Flux recommandé (à implémenter avec les boutons/modals discord.js) :
 *  1. `guildMemberAdd` -> le membre reçoit UNIQUEMENT le rôle "non-vérifié"
 *     (aucun accès aux salons tant que le captcha n'est pas résolu).
 *  2. Le bot envoie en MP ou dans un salon dédié un défi simple :
 *     - image générée avec du texte déformé (lib `canvas` + `@napi-rs/canvas`), ou
 *     - simple bouton "Je ne suis pas un robot" avec délai aléatoire anti-clic-auto.
 *  3. À la résolution correcte -> retrait du rôle "non-vérifié",
 *     ajout du rôle "member" (cf. ServerConfig.memberRoleId).
 *  4. Timeout (ex: 10 min) -> kick automatique + log dans le salon de modération.
 *
 * Ce fichier centralise juste la génération/validation du challenge ;
 * le composant image est volontairement laissé en TODO pour rester
 * indépendant de la lib de rendu que tu choisiras.
 */
import crypto from 'node:crypto';

const pendingChallenges = new Map<string, { code: string; expiresAt: number }>();

export function generateChallenge(userId: string): string {
  const code = crypto.randomInt(100000, 999999).toString();
  pendingChallenges.set(userId, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
  return code;
}

export function verifyChallenge(userId: string, attempt: string): boolean {
  const challenge = pendingChallenges.get(userId);
  if (!challenge) return false;
  if (Date.now() > challenge.expiresAt) {
    pendingChallenges.delete(userId);
    return false;
  }
  const valid = challenge.code === attempt.trim();
  if (valid) pendingChallenges.delete(userId);
  return valid;
}
