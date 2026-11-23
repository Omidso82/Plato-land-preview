/**
 * Series 3 owner decision validation.
 * This is a pure validation helper, NOT a source of authority.
 * Production decisions must be validated and persisted by an owner-only server RPC.
 */
export const SERIES3_OFFICIAL_OWNER_REASON = 'تساوی کامل در معیارهای رتبه‌بندی و عدم حضور دوطرفه در مسابقه رودررو؛ تعیین رتبه با تصمیم رسمی مدیریت';

export type Series3OwnerThirdDecision = {
  event_key: 'series3';
  group_name: 'C' | 'I';
  selected_registration_id: string;
  rejected_registration_id: string;
  selected_plato_id: string;
  rejected_plato_id: string;
  reason: string;
  decision_version: number;
};
export type Series3TieCandidate = {
  registration_id: string;
  plato_id: string;
  points: number;
  diff: number;
  setsFor: number;
};
export function resolveSeries3OwnerThirdTie(
  group: string,
  third: Series3TieCandidate,
  fourth: Series3TieCandidate,
  headToHeadStatus: string,
  verifiedDecisions: readonly Series3OwnerThirdDecision[],
): Series3TieCandidate | null {
  if (group !== 'C' && group !== 'I') return null;
  if (headToHeadStatus !== 'double_no_show') return null;
  if (third.registration_id === fourth.registration_id) return null;
  if (third.points !== fourth.points || third.diff !== fourth.diff || third.setsFor !== fourth.setsFor) return null;
  const matching = verifiedDecisions.filter(d => d.event_key === 'series3' && d.group_name === group);
  if (matching.length !== 1) return null;
  const decision = matching[0];
  if (decision.reason !== SERIES3_OFFICIAL_OWNER_REASON || !Number.isInteger(decision.decision_version) || decision.decision_version !== 1) return null;
  const exactPair =
    (decision.selected_registration_id === third.registration_id && decision.rejected_registration_id === fourth.registration_id
      && decision.selected_plato_id === third.plato_id && decision.rejected_plato_id === fourth.plato_id) ||
    (decision.selected_registration_id === fourth.registration_id && decision.rejected_registration_id === third.registration_id
      && decision.selected_plato_id === fourth.plato_id && decision.rejected_plato_id === third.plato_id);
  if (!exactPair) return null;
  return decision.selected_registration_id === third.registration_id ? third : fourth;
}
