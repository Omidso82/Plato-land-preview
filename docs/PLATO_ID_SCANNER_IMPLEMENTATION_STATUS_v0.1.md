# PLATO ID Scanner — implementation status
Date: 2026-11-11
Branch: feature/plato-id-scanner-v0-1
Base: main at abb1556b57f9c9b73cdc83ea2486ffd01ffd023a

## Delivered in this branch
- Dedicated ?page=id-scanner entry point, isolated from the existing App lifecycle.
- Email/password self-registration and login through Supabase Auth.
- Email confirmation check before scanner access.
- Owner identification through current_user_role(); scanner operators are never assigned owner or tournament_admin.
- Pending/approved/rejected/disabled access states and owner review UI.
- Private image upload UI with JPG/PNG/WEBP validation and 15 MB cap.
- Operator upload history limited to own records in the interface.
- Draft additive SQL for separate access/upload tables, RLS and private storage bucket.

## Not activated
- SQL is draft only and has NOT been applied to the primary database.
- Auth confirmation and redirect allowlist were not readable via available management tools; live email flow must be verified.
- OCR engine/provider has not been selected. Upload records remain in uploaded state.
- No Telegram delivery, report scheduling, corrections, daily/weekly aggregation or finalization deployed.
- No main merge or production deployment.

## Required activation checks
1. Review private.has_role signature and migration policy semantics, then separately approve production schema application.
2. Confirm Auth email confirmation and allowlist https://platoland.org/?page=id-scanner.
3. Test signup, email confirmation, pending/approval/rejection/disabled, owner and operator isolation.
4. Select and approve OCR engine, privacy terms and cost.
5. Implement audited correction RPC, versioned reports, Asia/Tehran daily/weekly jobs and idempotent Telegram test delivery.
6. Build/typecheck, security tests and mobile Safari QA before merge/deploy.
