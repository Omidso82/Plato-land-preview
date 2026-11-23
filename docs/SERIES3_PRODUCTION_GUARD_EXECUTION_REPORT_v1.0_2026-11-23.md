# Series 3 production guard — execution report v1.0
Date: 2026-11-23
Project: PLATO LAND – Temporary Projects / Series 3
Status: Applied to existing production Supabase project dfrppbapaaydbjeflozw after explicit owner approval.

## Change
Created public.series3_guard_third_place_resolution() and BEFORE UPDATE trigger series3_guard_third_place_resolution_trg on public.plato_land_series3_knockout_draws.

For the transition from eight unresolved third-place tokens to zero unresolved tokens, the trigger:
- locks public.plato_land_series3_knockout_match_results in SHARE MODE;
- rejects if any Series 3 knockout result exists;
- rejects changes to the sixteen Round-of-32 match IDs or non-third entrant tokens;
- rejects changing third-place slot source type.
The existing replace_series3_knockout_draw RPC continues to enforce owner authentication, cardinality, token uniqueness, and same-group exclusion.

## Verification
- PostgreSQL pg_trigger reports the new trigger enabled (tgenabled='O').
- A deliberately invalid attempted transition was rejected inside a PL/pgSQL exception subtransaction.
- Official draw fingerprint remained 798df9fa4dec8449aceab58f0efe3361da194da94642c4e5f7bd81daac5ac206.
- No Series 3 knockout results were present at the prior read.
- No official third-place qualifier placement was committed.
- No frontend merge or publication performed.

## Limitations / follow-up
- This is a transition guard, not a server-side verification of the identity and official rank of each of the eight third-place qualifiers. The frontend currently computes these.
- The trigger does not implement a client-provided expected-fingerprint compare-and-swap parameter; the frontend still performs the preflight fingerprint check.
- Concurrent result writers may require a consistent lock ordering to avoid deadlock; a deadlock aborts the operation safely.
- Run full integration tests before enabling owner action in production.
- Do not merge the shared Vite bundle into the main website merely to publish a temporary management-panel feature.
