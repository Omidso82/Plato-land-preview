# PLATO LAND — Documentation Seal: Staging & Preview Connection
**Record ID:** PLATO-DOC-SEAL-2026-11-04-01  
**Version:** 1.0  
**Recorded:** 4 November 2026  
**Repository:** Omidso82/Plato-land-preview  
**Documentation branch:** `docs/staging-preview-doc-seal-2026-11-04` (based on current `main`)  
**Scope:** Record the newly completed isolated Staging rebuild, Preview branch connection, deployment evidence, and remaining readiness gates.

## 1. Purpose and authority
This record supersedes older status statements that said Staging had not yet been created. It records the state evidenced on 4 November 2026. It does not authorize merge to `main`, Production release, Production database changes, DNS changes, or any new database mutation.

## 2. Environment separation — confirmed
- Production Supabase: `dfrppbapaaydbjeflozw`; remains the live operational source of truth.
- Staging Supabase: `vgezfuztgzxbmvkmaoqn` (eu-west-1); isolated test project.
- Production branch: `main`; its `src/supabase.ts` was checked and still points to Production.
- Preview branch: `cloudflare-preview`; its `src/supabase.ts` was changed to the Staging URL and browser-safe publishable key only.
- Preview commit: `d4dde5f608a915505f82a3f1f3b2a8f875ba1aff`.
- Cloudflare Pages check: completed successfully; deployment URL `https://b8205280.plato-land-preview.pages.dev`; deployment ID `b8205280-1c76-4284-b195-21a0e965fbdb`; workflow run `41866856087`.
- Branch alias: `https://plato-land-preview.pages.dev`.
- Owner-provided mobile Safari screenshot confirms the branch alias opens and renders the Preview landing page on an iPhone.
- The screenshot confirms page availability/visual rendering only. It does NOT prove a successful browser-to-Staging database request.

## 3. Staging schema rebuild — recorded evidence
The Staging rebuild report records:
- 29 public application tables, 87 indexes, 44 foreign keys, 19 functions (13 public, 6 private), 1 view, 29 RLS-enabled tables, 102 public policies, 12 trigger objects, 21 Storage policies, 5 buckets, and 2 Realtime tables.
- Application tables are empty; no Production data was copied.
- Four pre-existing Auth users and one pre-existing Storage object in Staging were preserved; they were not copied from Production.
- Four duplicate legacy avatar policies were removed.
- PUBLIC EXECUTE was revoked from the 19 application functions and role-specific grants were applied.
- Anonymous access to profiles is not granted.
- Production remained untouched during this work.
- The migration ledger has 16 new entries, but the repository does not yet contain a complete CLI-compatible source history for all executed migrations. Do not replay already-applied migrations or invent missing SQL.

## 4. Remaining technical readiness gates — NOT COMPLETE
1. Browser-originated read-only request from the deployed Preview to Staging must be tested. The screenshot is not that test.
2. Staging Auth leaked-password protection is currently disabled; enable and verify before public QA.
3. Create synthetic Staging test identities/roles (Owner, Manager, Player); do not copy Production identities.
4. Seven Edge Functions have not yet been deployed to Staging. Review source/dependencies and configure Staging-only secrets before deployment.
5. Review two SECURITY DEFINER findings: `public.admin_list_site_users()` and `public.withdraw_tournament_registration(uuid)`. Existing grants/authorization checks are recorded, but security review remains open.
6. Reconcile the migration source/ledger documentation without replaying applied migrations.
7. Complete role/RLS, Storage privacy/signed URL, Auth, functional, regression, mobile and desktop QA.
8. Owner approval of A/B design is not a substitute for technical QA or Production approval.

## 5. Design and delivery sequence
- UI/UX sections A and B: `OWNER ACCEPTED` in Preview, as separately documented.
- Section C: not yet reviewed or approved; extract its scope and acceptance criteria from UI/UX v10.7 and present to the Owner before implementation.
- Agreed execution order remains: finish Staging readiness and browser connection verification; then implement/test approved functional package A, then package B; review and approve C before its implementation; complete QA before any Production release decision.

## 6. Hard constraints
- No Production database, Storage, Auth, Edge Function, DNS, `main`, or Production deployment changes are authorized by this record.
- Never expose `service_role` or server secrets in browser code.
- Do not copy real Production user data into Staging.
- Do not replay migrations already applied.
- No paid service or plan upgrade without explicit Owner approval.
- Keep the approved dark/gold identity, Persian RTL, mobile-first approach, and Jalali dates.
- Preserve separate temporary Series 2 and prediction data; do not copy them into Staging.

## 7. Current gate
**Staging schema:** rebuilt; structural work recorded.  
**Preview code connection:** committed to `cloudflare-preview`.  
**Cloudflare deploy:** success.  
**Mobile page observation:** confirmed by Owner screenshot.  
**Browser-to-DB request:** NOT YET VERIFIED.  
**Staging operational readiness:** PARTIAL / NOT READY FOR FULL QA.  
**Production:** unchanged; no release authorized.

## 8. Evidence references
- Preview commit: `d4dde5f608a915505f82a3f1f3b2a8f875ba1aff`.
- Cloudflare deployment: `b8205280-1c76-4284-b195-21a0e965fbdb`.
- Cloudflare Pages check: `Deploy successful!`.
- Staging rebuild reports and schema audit were produced during the 4 November execution; they should be committed as source reports in the documentation package if their exact files are available.
- Owner screenshot: Safari mobile showing `plato-land-preview.pages.dev` and the Preview-only notice.

---
End of record.
