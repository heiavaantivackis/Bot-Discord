import { GuildMember } from 'discord.js';

/**
 * Grades autorisés à déclencher une alerte de combat de gang
 * (cf. cahier des charges, Objet I).
 */
const GANG_ALERT_GRADES = new Set(['SOCHO', 'FUKU_SOCHO', 'TAICHO']);

export function canLaunchGangAlert(grade: string | null | undefined): boolean {
  return !!grade && GANG_ALERT_GRADES.has(grade);
}

/**
 * Vérifie qu'un membre a bien le rôle "arbitre" configuré pour le serveur
 * avant de lui permettre de réserver/juger un match.
 */
export function isArbiter(member: GuildMember, arbiterRoleId: string | null): boolean {
  if (!arbiterRoleId) return false;
  return member.roles.cache.has(arbiterRoleId);
}

/**
 * Un chef de gang ne peut attribuer des rôles/grades qu'AU SEIN de son
 * propre gang, et jamais un grade supérieur ou égal au sien.
 * -> Empêche l'élévation de privilège (ex: un capitaine qui se nomme chef).
 */
const GRADE_ORDER = ['KATAGI', 'MEMBER', 'FUKU_TAICHO', 'TAICHO', 'FUKU_SOCHO', 'SOCHO'];

export function canAssignGrade(assignerGrade: string, targetGrade: string): boolean {
  const assignerRank = GRADE_ORDER.indexOf(assignerGrade);
  const targetRank = GRADE_ORDER.indexOf(targetGrade);
  if (assignerRank === -1 || targetRank === -1) return false;
  return targetRank < assignerRank;
}
