# PLATO ID Scanner — Owner Dashboard UI

**Document version:** 1.0  
**Date:** 2026-11-12  
**Project:** PLATO LAND – Temporary Projects / PLATO ID Scanner  
**Status:** Implemented on isolated feature branch; awaiting CI and owner visual review  
**Base commit:** `fa70d211bbd4b60d5d1c568000ae6c2aecc6e3c1`

## 1. Approved user request

The user approved the proposed black-and-gold PLATO LAND Scanner dashboard mockup and asked to implement that visual direction specifically for the Scanner area. The request is limited to the Scanner UI and does not authorize changes to the Series 2 manager's unrelated controls, Main Website, database, Telegram sender, or production deployment.

## 2. UI structure implemented

The owner-facing Scanner view is reorganized into a mobile-first dashboard:

1. **Dashboard header:** PLATO LAND crown identity, ADMIN label, title and owner access status.
2. **Summary cards:** total uploaded images, today's images, uploads waiting for OCR, and images awaiting human review. Values are read from the existing Scanner upload records and Tehran-local day grouping.
3. **Quick navigation:** anchors to image upload, OCR/review queue, final unique ID list, report preview, and Telegram delivery history.
4. **Operator access management:** moved into a collapsed disclosure section so account administration no longer competes visually with the daily Scanner workflow.
5. **Existing Scanner workflow:** upload, archive, image/OCR review, exact duplicate audit, approved global ID list, report preview, manual test-group send, and delivery history retain their existing components and data flow.

## 3. Visual direction

- Dark charcoal/black surfaces with restrained gold accents.
- Clear spacing, section hierarchy, consistent cards and compact status labels.
- Responsive summary grid and navigation; single-column layout on narrow iPhone screens.
- Existing Persian RTL layout and PLATO LAND identity are preserved.

## 4. Functional and safety boundaries

- This is a presentation/layout change only.
- No database schema, records, Storage objects, RLS policies, Edge Functions, secrets, OCR behavior, duplicate rules, review revisions, or Telegram behavior are changed.
- Human review remains mandatory; exact-string duplicate handling remains unchanged.
- Telegram sending remains manual and test-group-only. No message was sent by this UI work.
- Operator-facing authentication and workflow behavior remain unchanged.
- The Series 2 manager continues to embed the Scanner component; no unrelated manager section is intentionally modified.

## 5. Files changed

- `src/PlatoIdScannerApp.tsx`: owner-only dashboard hierarchy, summary cards, quick-navigation anchors, and collapsed operator access section.
- `src/plato-id-scanner.css`: isolated owner-dashboard styles and responsive breakpoints.

## 6. Verification status

- Source edits were fetched back from GitHub and checked for the owner dashboard wrapper, all five navigation anchors, and responsive styling.
- `src/Series2SlidesManager.tsx` was read-only checked and is unchanged.
- Automated build/typecheck and browser/iPhone visual QA are pending.
- No merge, production deployment, database write, or Telegram send occurred.

## 7. Version history

- **1.0 — 2026-11-12:** First implementation record for the approved Scanner owner dashboard visual redesign.
