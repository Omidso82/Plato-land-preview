# Series 3 owner decision — knockout load gate
Version 1.0 | 2026-11-23 | Branch only

## Corrected
- The UI and action handler now block owner decision submissions until knockout state has successfully loaded, and while that state is refreshing.
- Every knockout reload resets the successful-load flag before querying, so an error cannot leave a stale success flag in place.
- GitHub commits: 90f11dd692e8211b237938ed6cfb29812d5bae98 and ff976d8303d3377fc140edab93749eaf69cf9d25.

## Production server read-only inspection
The existing record_series3_owner_third_decision RPC also checks owner role, the approved C/I registration IDs, source match version, full tie, and absence of knockout results. These server guards complement but do not replace client gating.

## Unverified gates
No full repository build/typecheck, authenticated owner write/readback, or iPhone test. No owner decision inserted; no bracket change; no merge or publication. Release requires separate approval.
