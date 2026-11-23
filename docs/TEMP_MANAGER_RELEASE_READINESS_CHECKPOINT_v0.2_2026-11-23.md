# Series 3 temporary manager — release readiness checkpoint v0.2
Date: 2026-11-23
Status: isolated build verified; production release BLOCKED

## Verified
- GitHub workflow 'Validate isolated temporary manager build' run 45253215132: SUCCESS.
- Isolated artifact 'temporary-manager-only' exists (210764 bytes, not expired).
- Build/typecheck run 45253215138: SUCCESS.
- Website deployment workflow run 45253215193: build SUCCESS; deploy SKIPPED. This is not a deployment.
- Isolated build excludes shared public directory and contains only series2-slides-manager route files.

## Hosting safety finding
The website workflow invokes actions/configure-pages@v5 and actions/upload-pages-artifact@v3. This is a GitHub Pages whole-artifact release model, not a verified route-level file updater. Releasing the isolated artifact through it would risk replacing unrelated site content. Do not run Pages deployment with manager-only artifact.

## Remaining pre-release checks
1. Confirm exact production host/routing and current deployed Pages artifact/version.
2. Establish a proven mechanism to replace only the existing /series2-slides-manager/ route and its route-scoped assets without changing other URLs or shared files. No new preview site, hosting purchase, or database.
3. Compare before/after file manifests, hashes, and route responses; ensure unrelated files are identical.
4. Authenticate as actual authorized owner and perform non-destructive Series 3 preflight. Do not finalize knockout draw without owner's explicit confirmation.
5. Only then request approval for any operation that touches the shared live hosting.

## No mutations
No production site deploy, no Supabase data change, no official tournament draw update.
