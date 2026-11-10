# PLATO ID Scanner — RLS Isolation Test Plan v0.1

**Date:** 2026-11-11  
**Scope:** Scanner-only access isolation and Storage ownership checks  
**Status:** Test plan prepared; NOT executed against any Supabase database.

## Safety boundary

- Do not apply the Scanner migration to the primary Supabase project.
- Do not use the second Supabase project as an assumed staging environment.
- Execute these tests only in a disposable local Supabase stack or a separately authorized isolated test environment.
- Use two synthetic operator identities (A and B) and one owner identity. Never use real player IDs, production uploads, or production credentials.
- No OCR worker, queue, Telegram destination, production bucket, or paid service is part of this test plan.

## Preconditions

1. A disposable Supabase environment is explicitly selected and confirmed as non-production.
2. The existing owner-role helper is represented in the test environment with the same behavior expected by the migration.
3. The Scanner migration is applied only to that disposable environment.
4. Synthetic users A and B are created; both have Scanner access rows. A is approved; B is pending. The owner has the existing owner role.
5. All Storage objects used by tests are disposable fixtures.

## RLS test matrix

| ID | Actor | Operation | Fixture / condition | Expected result |
|---|---|---|---|---|
| RLS-01 | Operator A (approved) | SELECT access row | A's own row | Allowed |
| RLS-02 | Operator A (approved) | SELECT access row | B's row | No row visible |
| RLS-03 | Operator B (pending) | SELECT uploads | Any upload history | No upload rows visible |
| RLS-04 | Operator A (approved) | SELECT uploads | A's own upload | Allowed |
| RLS-05 | Operator A (approved) | SELECT uploads | B's upload | No row visible |
| RLS-06 | Operator A (approved) | INSERT upload row | operator_id=A, path starts A UUID, status uploaded, empty OCR result | Allowed |
| RLS-07 | Operator A (approved) | INSERT upload row | operator_id=B or path starts B UUID | Denied |
| RLS-08 | Operator B (pending) | INSERT upload row | Otherwise valid own row | Denied |
| RLS-09 | Operator A (approved) | UPDATE/DELETE upload row | Any upload row | Denied (no grant/policy) |
| RLS-10 | Operator A (approved) | SELECT Storage object | A's object | Allowed |
| RLS-11 | Operator A (approved) | SELECT Storage object | B's object | Denied |
| RLS-12 | Operator A (approved) | INSERT Storage object | Path starts A UUID | Allowed |
| RLS-13 | Operator A (approved) | INSERT Storage object | Path starts B UUID | Denied |
| RLS-14 | Operator B (pending) | INSERT/SELECT Storage object | Own path | Denied |
| RLS-15 | Operator A (approved) | DELETE Storage object | Own orphan with no upload row | Allowed |
| RLS-16 | Operator A (approved) | DELETE Storage object | Own object referenced by upload row | Denied |
| RLS-17 | Owner | SELECT access/uploads and Storage | All Scanner records | Allowed |
| RLS-18 | Owner | UPDATE access row | Approve/reject synthetic operator | Allowed |

## Additional negative tests

- Anonymous role cannot read or write Scanner tables or private Storage objects.
- An operator cannot change their own access status to approved, rejected, or disabled.
- An operator cannot insert an upload row with a non-empty OCR result or a status other than uploaded.
- An operator cannot write a Storage object into another user's UUID folder.
- A pre-existing bucket with public=true, wrong size limit, wrong MIME allowlist, or wrong name must cause the migration to stop with a clear exception. It must not be silently overwritten.
- Re-running the SQL file manually is not an approved test: table/index statements are guarded, but CREATE POLICY statements are intentionally a one-time migration operation and are not idempotent. Use the migration ledger in the disposable environment; do not manually replay an already-applied migration.

## Evidence to capture

For each test, record actor, role, operation, object/table, observed result, expected result, and pass/fail. Do not include passwords, JWTs, service-role keys, or production identifiers in the report.

## Exit criteria

- All RLS-01 through RLS-18 pass in the disposable environment.
- All negative tests pass.
- No test touches the primary database.
- Any failure is documented and fixed on the isolated feature branch before a production activation proposal is prepared.

## Current result

**Not run.** This document defines the test plan only. No live RLS tests, database writes, or Storage operations were performed.
