# Series 3 server-side official-qualifier verification — v1.1
Date: 2026-11-23
Scope: Series 3 production Supabase only
Status: Applied and negative-tested; frontend PR still unmerged

## Implementation
Enhanced public.series3_guard_third_place_resolution() (existing enabled BEFORE UPDATE trigger on public.plato_land_series3_knockout_draws).
For the 8-unresolved -> 0-unresolved third-place transition, the function now:
- independently aggregates Series 3 group-match scores (3 points per win; set differential; sets scored);
- ranks group standings and then the third-place candidates;
- compares the top eight expected (registration UUID, exact Plato ID, group) with the supplied eight third-place tokens using symmetric set difference;
- rejects if the 72 group matches are not closed;
- retains the prior transactional knockout-results lock and no-results gate;
- retains unchanged non-third slots and match IDs.
Group C and I unresolved third/fourth ties are below the eighth-place threshold; they cannot change this top-eight result under the currently verified group scores.

## Verified server top eight
H lleiila; E vhidi; F P0uri4; G ZE_IM; L 1M1M; D _z50_; A M4H67; J v86.
The ninth-ranked player is from group B with fewer sets scored than eighth-ranked J.

## Tests and limits
- Executed an intentionally invalid third-place resolution UPDATE inside a caught subtransaction; the trigger rejected it.
- Re-read official draw: eight unresolved third-place slots remain; fingerprint remains 798df9fa4dec8449aceab58f0efe3361da194da94642c4e5f7bd81daac5ac206.
- Positive authenticated owner RPC end-to-end test NOT executed; no official bracket mutation performed.
- Current SQL computes lower C/I standings deterministically but this does not authorize overriding the owner's unresolved official group-rank decisions. If later data change moves those ties to the qualification boundary, the resolver and server guard need re-review.
- This check applies to the specific 8-to-0 transition. It does not yet implement a general-purpose CAS fingerprint API or all bracket lifecycle transitions.
- The shared frontend bundle remains unpublished; do not merge merely to release the temporary panel.
