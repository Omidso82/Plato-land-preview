# Series 3 — owner third-place decisions: verified baseline and migration gate
Version: 0.5 | Date: 2026-11-23 | Status: design only — NOT deployed

## Scope
Existing temporary Series 3 manager only. No changes to main website, Series 2, Series 4, or official results.

## Verified from production read-only queries
- Group C head-to-head `S3-C-R2-M1`: `double_no_show`, both scores NULL, version 2.
  - Selected third: `Amin_2717`, registration `deb74db1-0c27-4421-9382-3a6021d2c939`.
  - Fourth: `_Arman1379`, registration `f2293425-22ff-4a5f-b60f-3301c7952fd4`.
- Group I head-to-head `S3-I-R3-M1`: `double_no_show`, both scores NULL, version 2.
  - Selected third: `ivaz1`, registration `7560791f-3c07-4bc1-b5e3-123708a351f9`.
  - Fourth: `I3eni`, registration `a2d403c2-de04-4609-bf5c-5cfa0a07c2b1`.
- Official owner reason (exact): «تساوی کامل در معیارهای رتبه‌بندی و عدم حضور دوطرفه در مسابقه رودررو؛ تعیین رتبه با تصمیم رسمی مدیریت».
- Knockout results count at inspection: 0.
- Active draw fingerprint at inspection: `798df9fa4dec8449aceab58f0efe3361da194da94642c4e5f7bd81daac5ac206`.
- These are a point-in-time baseline, not authorization to overwrite any later data.

## Database migration plan — REQUIRES SEPARATE OWNER APPROVAL
1. Add an append-only, owner-authenticated Series 3 decision table, RLS enabled, with event, group, both registration IDs and Plato IDs, source match ID/version, official reason, actor, timestamp, and revision chain.
2. Add owner-only decision recording RPC: verify `auth.uid()`, `private.has_role`, event/group C/I, registration IDs, current group standings tie, exact head-to-head `double_no_show` with NULL scores and expected version, and no conflicting active decision. Never edit match results.
3. Add read-only RPC for authoritative verified decisions and a server preview. Never treat a client-submitted `serverVerifiedOwnerDecisions` array as trusted.
4. Add separate atomic commit RPC: explicit owner confirmation, lock current draw, compare expected fingerprint, recheck all 72 matches and 8 qualifying third places, require zero knockout results, preserve original slots, archive old draw and audit change. Reject on stale snapshot.
5. Restrict `EXECUTE` grants; verify RLS and owner authorization. Run negative and idempotency tests before deployment.

## GitHub branch status
`work/series3-owner-third-place-override-20261123` contains read-only UI preview, no auto-draw write, fail-closed owner-decision resolver and a test source. The test source is not yet proven by a full build; no Supabase migration is applied.

## Gate
No merge, database write, or deployment until separately approved and verified.
