/** PLATO LAND Temporary Projects — lifecycle evidence gate.
 * Pure logic only. Never changes DB, registration, bracket or results.
 * A trusted server-side workflow must supply verified evidence and perform transitions.
 */
export type CompletionVerdict = 'not_ready' | 'needs_review' | 'verified_complete';
export type LifecycleState = 'planned' | 'started' | 'completed' | 'archived' | 'cancelled';
export type CompletionEvidence = Readonly<{
  seriesNumber: number;
  evaluatedAt: string;
  evidenceVersion: string;
  evidenceRefs: readonly string[];
  requiredStagesResolved: boolean;
  finalResultsConsistent: boolean;
  finalResultsApproved: boolean;
  hasUnresolvedConflict: boolean;
  reasons: readonly string[];
}>;
export type LifecycleAssessment = Readonly<{
  verdict: CompletionVerdict;
  reasons: readonly string[];
  evidenceVersion: string;
}>;
export function assessCompletion(e: CompletionEvidence): LifecycleAssessment {
  const reasons = [...e.reasons];
  if (!Number.isInteger(e.seriesNumber) || e.seriesNumber < 1 ||
      !e.evidenceVersion || !e.evaluatedAt || !e.evidenceRefs.length) {
    return {verdict:'needs_review',reasons:[...reasons,'شواهد قابل ردیابی یا شناسه سری ناقص است.'],evidenceVersion:e.evidenceVersion};
  }
  if (e.hasUnresolvedConflict || !e.finalResultsConsistent) {
    return {verdict:'needs_review',reasons:[...reasons,'نتایج یا مسیر صعود نیازمند بررسی است.'],evidenceVersion:e.evidenceVersion};
  }
  if (!e.requiredStagesResolved) {
    return {verdict:'not_ready',reasons:[...reasons,'تمام مراحل الزامی تعیین تکلیف نشده‌اند.'],evidenceVersion:e.evidenceVersion};
  }
  if (!e.finalResultsApproved) {
    return {verdict:'needs_review',reasons:[...reasons,'تأیید رسمی نتایج نهایی ثبت نشده است.'],evidenceVersion:e.evidenceVersion};
  }
  return {verdict:'verified_complete',reasons,evidenceVersion:e.evidenceVersion};
}
export function canAutoArchive(input: Readonly<{
  lifecycle: LifecycleState;
  assessment: LifecycleAssessment;
  evidenceFresh: boolean;
  managerHold: boolean;
  evidenceVersionOnHold?: string | null;
}>): boolean {
  return input.lifecycle === 'completed' &&
    input.assessment.verdict === 'verified_complete' &&
    input.evidenceFresh &&
    !input.managerHold &&
    input.evidenceVersionOnHold !== input.assessment.evidenceVersion;
}
export function canManagerRestore(input: Readonly<{
  lifecycle: LifecycleState;
  authorized: boolean;
  reason: string;
}>): boolean {
  return input.lifecycle === 'archived' && input.authorized && input.reason.trim().length >= 5;
}
