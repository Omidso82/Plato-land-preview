# Series 3 — server-side bracket safety gate (proposal, NOT applied)
Date: 2026-11-23
Scope: Series 3 only. Main website and other series must remain unchanged.
Status: PROPOSED / requires owner approval before any production database change.

## Verified production facts
- public.replace_series3_knockout_draw is SECURITY DEFINER and checks owner identity, 32 unique tokens, 16 matches, eight third-place entries, and no same-group pairing.
- It currently archives the previous draw before replacing it, but does not check for existing knockout results within the same database transaction.
- On inspection, the Series 3 knockout results count was 0.
- The owner-facing client performs preflight checks, but concurrent writes between preflight and RPC execution remain possible.

## Required atomic safety behavior
Implement a Series 3-specific atomic database operation, preserving existing grants and owner authorization:
1. Acquire a transaction-scoped lock that is also respected by the Series 3 knockout-result writer (a lock on the draw row alone is insufficient unless the result writer also participates).
2. Verify the expected existing draw fingerprint supplied by the client, with a compare-and-swap check under the lock.
3. Reject if any Series 3 knockout result exists at the point of update.
4. Confirm exactly eight unresolved third-place placeholders are being resolved, and that all other entrants, match IDs, slot order, and pairings are unchanged.
5. Recheck the current official top-eight qualifiers and any owner tie decisions against server-side data, rather than trusting arbitrary client-supplied entrant labels.
6. Archive the old snapshot and write the new one atomically.
7. Verify readback and record an audit trail.

## Release gate
- Do not deploy a database migration without explicit approval.
- Do not merge the current PR into main as a substitute for a temporary-panel-only deployment; the repository's Vite bundle is shared with the main website.
- Run CI and verify live behavior before claiming publication.
