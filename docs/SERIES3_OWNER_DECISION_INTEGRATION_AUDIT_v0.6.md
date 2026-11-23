# Series 3 owner decision — integration verification report
Version: 0.6 | 2026-11-23 | Work branch only; not released

## Verified
- GitHub manager SHA `2f45eff7079e679bf91b2b044897107767579fbb` includes owner decision RPC calls and readback.
- Automatic `replace_series3_knockout_draw` call is absent from manager source.
- Supabase migration for owner decision table and RPCs returned success; read-only inspection showed RLS enabled, no direct authenticated INSERT grant, no anon EXECUTE grant on record RPC, authenticated EXECUTE allowed (owner role checked inside RPC).
- Series 3 groups C and I: four participants each, three group appearances each, consistent Plato IDs.
- Production decision rows: 0; knockout result rows: 0; draw fingerprint unchanged: `798df9fa4dec8449aceab58f0efe3361da194da94642c4e5f7bd81daac5ac206`.
- Supabase security advisor reports informational `rls_enabled_no_policy` for new table. This is intentional deny-by-default: direct grants are revoked and access is via owner-only RPC. Other advisor findings in unrelated tables are out of scope.

## Not verified / release blockers
- No complete repository TypeScript typecheck or Vite build was run.
- No authenticated owner end-to-end RPC write/readback test was run.
- No browser/iPhone UI test was run.
- No live decisions C/I recorded.
- No main merge, deployment, or draw allocation authorized.

## Next
1. Run complete typecheck and build on isolated branch.
2. Validate owner authenticated RPC with transaction-safe tests, negative cases, and audit.
3. Review and fix any findings; request separate authorization before merge and deployment.
4. Never auto-assign draw or mutate group match results.
