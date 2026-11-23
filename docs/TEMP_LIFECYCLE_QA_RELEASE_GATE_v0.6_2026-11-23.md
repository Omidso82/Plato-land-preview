# Lifecycle release gate — QA and integration checklist
Version 0.6 | 2026-11-23 | PLATO LAND Temporary Projects only

## Current evidence (read-only)
- Series 3: 72 group outcomes (70 completed, 2 double_no_show), 31 unique expected knockout bracket IDs, zero completed knockout results, zero third-place results.
- Series 4: no group or knockout results. Series 5 planned.
- No approved lifecycle evidence or transition/hold records.
- Branch diverges from main; main changed Series 3 third-place logic and prediction components. Preserve those changes and review before merge.

## QA matrix (not yet executed end-to-end)
1. Anonymous RPC overview/readiness/restore/archive -> denied.
2. Authenticated non-owner overview/readiness/restore -> denied.
3. Owner overview -> correct series states, no private evidence leaked.
4. Owner restore archived -> started, independent registration status unchanged, reason and actor logged, hold active.
5. Owner restore non-archived -> rejected, no writes.
6. Concurrent restore attempts -> at most one transition.
7. Duplicate correlation IDs -> idempotent for same request; reject cross-series reuse.
8. Service archive with series not completed -> no-op.
9. Service archive with no evidence, stale evidence, empty refs, missing final approval -> no-op.
10. Service archive with active manager hold -> no-op.
11. Service archive with verified evidence and completed state -> one atomic transition.
12. Source changes after evidence approval -> invalidate or revalidate evidence before archive.
13. Series 3 knockout and third-place official results must reconcile against bracket IDs and stage keys.
14. Series 4 evidence adapter must use Series 4 sources, never Series 3 or generic main-website tournaments.
15. Typecheck, build and mobile owner-panel UI tests.
16. No automatic registration reopen, result deletion, Series 1 import, or Main Website changes.

## Critical remaining blockers
- No trusted evidence writer, no approved final-result workflow, no scheduler.
- Security advisor flags authenticated-callable SECURITY DEFINER RPCs. Owner check exists but must be exercised with actual JWT role tests.
- Database functions are installed, not proof that UI is released.
- 22 pure contract assertions authored but execution not yet verified.
- No merge/deploy authorized.

## Release decision
HOLD. Continue branch-only development and read-only validation. Obtain separate approval for merge/deploy after QA passes.
