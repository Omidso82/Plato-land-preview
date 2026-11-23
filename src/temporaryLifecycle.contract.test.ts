import { assessCompletion, canAutoArchive, canManagerRestore, type CompletionEvidence } from './temporaryLifecycle';
const base: CompletionEvidence = {
  seriesNumber: 4, evaluatedAt: '2026-11-23T18:00:00Z', evidenceVersion: 'fixture-v1',
  evidenceRefs: ['fixture:series4:final'], requiredStagesResolved: true,
  finalResultsConsistent: true, finalResultsApproved: true,
  hasUnresolvedConflict: false, reasons: []
};
function check(condition: boolean, message: string) { if (!condition) throw new Error(message); }
export function runTemporaryLifecycleContractTests() {
  check(assessCompletion(base).verdict === 'verified_complete', 'complete');
  check(assessCompletion({...base,requiredStagesResolved:false}).verdict === 'not_ready', 'pending stage');
  check(assessCompletion({...base,finalResultsApproved:false}).verdict === 'needs_review', 'missing approval');
  check(assessCompletion({...base,hasUnresolvedConflict:true}).verdict === 'needs_review', 'conflict');
  check(assessCompletion({...base,evidenceRefs:[]}).verdict === 'needs_review', 'missing refs');
  const assessment=assessCompletion(base);
  check(canAutoArchive({lifecycle:'completed',assessment,evidenceFresh:true,managerHold:false}), 'archive allowed');
  check(!canAutoArchive({lifecycle:'started',assessment,evidenceFresh:true,managerHold:false}), 'started blocked');
  check(!canAutoArchive({lifecycle:'completed',assessment,evidenceFresh:false,managerHold:false}), 'stale blocked');
  check(!canAutoArchive({lifecycle:'completed',assessment,evidenceFresh:true,managerHold:true}), 'hold blocked');
  check(!canAutoArchive({lifecycle:'completed',assessment,evidenceFresh:true,managerHold:false,evidenceVersionOnHold:'fixture-v1'}), 'same evidence blocked');
  check(canManagerRestore({lifecycle:'archived',authorized:true,reason:'اشتباه در نتیجه'}), 'restore allowed');
  check(!canManagerRestore({lifecycle:'archived',authorized:false,reason:'اشتباه در نتیجه'}), 'unauthorized blocked');
  check(!canManagerRestore({lifecycle:'archived',authorized:true,reason:'  '}), 'reason required');
  check(assessCompletion({...base,finalResultsConsistent:false}).verdict === 'needs_review', 'inconsistent final');
  check(assessCompletion({...base,evidenceVersion:''}).verdict === 'needs_review', 'missing version');
  check(assessCompletion({...base,seriesNumber:0}).verdict === 'needs_review', 'invalid series');
  check(assessCompletion({...base,requiredStagesResolved:false,finalResultsApproved:false}).verdict === 'not_ready', 'unfinished stages take precedence');
  check(!canAutoArchive({lifecycle:'archived',assessment,evidenceFresh:true,managerHold:false}), 'already archived blocked');
  check(!canAutoArchive({lifecycle:'cancelled',assessment,evidenceFresh:true,managerHold:false}), 'cancelled blocked');
  check(!canAutoArchive({lifecycle:'planned',assessment,evidenceFresh:true,managerHold:false}), 'planned blocked');
  check(!canAutoArchive({lifecycle:'completed',assessment:{...assessment,verdict:'needs_review'},evidenceFresh:true,managerHold:false}), 'review required blocked');
  check(!canManagerRestore({lifecycle:'completed',authorized:true,reason:'دلیل معتبر'}), 'restore only archived');
  return 22;
}
