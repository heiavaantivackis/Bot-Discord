/**
 * Implémentation du système ELO tel que défini dans le cahier des charges.
 * Nouveau Elo = Ancien Elo + K x (Score réel - Score attendu)
 */

export type MatchResult = 'WIN' | 'DRAW' | 'LOSS';

function realScore(result: MatchResult): number {
  if (result === 'WIN') return 1;
  if (result === 'DRAW') return 0.5;
  return 0;
}

/** Probabilité de victoire de A face à B, selon l'écart d'ELO. */
export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + 10 ** ((eloB - eloA) / 400));
}

export interface EloUpdateInput {
  elo: number;
  opponentElo: number;
  result: MatchResult;
  kFactor: number;
}

export function computeNewElo({ elo, opponentElo, result, kFactor }: EloUpdateInput): number {
  const expected = expectedScore(elo, opponentElo);
  const actual = realScore(result);
  const newElo = elo + kFactor * (actual - expected);
  return Math.round(newElo);
}

/**
 * K-factor recommandé selon l'expérience du joueur/gang.
 * (débutant = ajustement rapide, confirmé = classement stable)
 */
export function suggestedKFactor(gamesPlayed: number): number {
  if (gamesPlayed < 20) return 40;
  if (gamesPlayed < 100) return 20;
  return 10;
}
