# Existing temporary manager — isolated build candidate v0.1
Date: 2026-11-23
Status: source-only, NOT built or deployed

## Added on feature branch
- manager-only.html
- src/manager-only.tsx
- vite.manager.config.ts

The manager entry renders the EXISTING Series2SlidesManager component (including its Series 3 tools). No new page or public route is requested. The opt-in Vite config outputs to dist-manager, with a nested series2-slides-manager/index.html and route-scoped assets in series2-slides-manager/assets. It does not modify the default vite.config.ts or existing build/deploy workflow.

## Local verification command
npm ci
npx vite build --config vite.manager.config.ts
Then inspect dist-manager/series2-slides-manager/index.html and its asset references. Verify that only manager-route files are present and the default dist/ was not touched. This command has NOT been run yet.

## Critical release blocker
The existing deployment is a shared GitHub Pages site. Uploading a partial manager-only artifact through the existing whole-site Pages deployment could delete or replace unrelated files. DO NOT publish dist-manager with the current Pages deployment workflow. First identify a proven route-level upload/merge mechanism that preserves every other file and its deployed version, or use a separately configured deployment with verified routing to the same existing manager URL. Neither has been verified.

## Additional cautions
- A route-scoped bundle can still depend on Supabase, remote media services, and shared authorization roles. Verify authenticated owner access and readback.
- Existing route must not be changed or moved.
- No new hosting, cost, preview site, or Main Website change is authorized.
- No tournament result or draw was mutated by this change.
