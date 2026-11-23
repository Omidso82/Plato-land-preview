import { assessCompletion, type CompletionEvidence, type LifecycleAssessment } from './temporaryLifecycle';

/** Source-specific, read-only preflight. Never asserts final approval from scores alone.
 * This is a conservative blocker until the official bracket/third-place result
 * validation and owner sign-off workflow are implemented.
 */
export type SeriesPreflightCounts = Readonly<{
 seriesNumber: 3 | 4;
 groupFixtureCount: number;
 unresolvedGroupMatches: number;
 knockoutDrawExists: boolean;
 unresolvedKnockoutMatches: number;
 officialFinalExists: boolean;
 thirdPlaceResolved: boolean;
 conflicts: readonly string[];
 sourceRefs: readonly string[];
 evidenceVersion: string;
 evaluatedAt: string;
}>;
export function assessSeriesPreflight(input: SeriesPreflightCounts): LifecycleAssessment {
 const requiredStagesResolved =
  input.groupFixtureCount > 0 &&
  input.unresolvedGroupMatches === 0 &&
  input.knockoutDrawExists &&
  input.unresolvedKnockoutMatches === 0 &&
  input.officialFinalExists &&
  input.thirdPlaceResolved;
 const evidence: CompletionEvidence = {
  seriesNumber: input.seriesNumber,
  evaluatedAt: input.evaluatedAt,
  evidenceVersion: input.evidenceVersion,
  evidenceRefs: input.sourceRefs,
  requiredStagesResolved,
  finalResultsConsistent: input.conflicts.length === 0,
  // Deliberately false: the owner must separately approve the verified final.
  finalResultsApproved: false,
  hasUnresolvedConflict: input.conflicts.length > 0,
  reasons: input.conflicts
 };
 return assessCompletion(evidence);
}
