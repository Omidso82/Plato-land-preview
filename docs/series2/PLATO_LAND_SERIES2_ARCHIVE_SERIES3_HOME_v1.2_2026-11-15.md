# PLATO LAND – Series 2 Archive & Series 3 Public Home
## Formal Decision Seal and Release Record — v1.2
**Date:** 2026-11-15  
**Project:** PLATO LAND – Temporary Projects  
**Supersedes:** v1.1 for current routing, layout, and release status  
**Repository:** `Omidso82/Plato-land-preview`  
**Production branch:** `main`  
**Sealed main commit:** `66afce643fe3b5c8936448c7580cce08aca5ec75`

## 1. Purpose and authority
This record formalizes the owner's approved decision that Series 2 is closed as an active public competition and retained as an archive, while Series 3 is the current public competition landing page.

This is a documentation seal for the temporary-project routing and presentation decisions recorded below. It is not a transfer of the entire PLATO LAND project and does not authorize unrelated changes.

## 2. Final approved public structure
### Series 3 home
- The root URL `https://platoland.org/` is the public home for Series 3.
- The home page contains the Series 3 public content and a dedicated entry to the Series 2 archive.
- The Series 2 archive is reached through the root query route: `https://platoland.org/?page=series2-archive`.
- The application also recognizes `/series2-archive`; the query route is the verified public link used by the Series 3 home on the static host.
- The Series 3 registration/rules route remains `/series3-registration`.
- The temporary management entry remains `/series2-slides-manager/`.

### Series 2 archive
- The PLATO LAND logo and tagline `بازی، رقابت، قهرمانی` remain at the top.
- Immediately below the brand header and above the Series 2 champion poster, show the right-aligned title `آرشیو رسمی سری دوم`.
- The archive header includes the navigation label `بازگشت به صفحه اصلی`, linking to `/`.
- Do not show the subtitle `این دوره به پایان رسیده و سوابق آن حفظ شده است.`.
- Do not show the `لیگ تخصصی تخته‌نرد` pill label in the archive.
- Do not show the Series 3 promotional entry card or its registration button inside the archive.
- Do not show the redundant bottom `بازگشت` button on the Series 3 home.
- Preserve the Series 2 champion poster, leaderboard, group standings, progression/results, prediction sections and other historical content as sourced by the existing Series 2 page.

## 3. Change history and GitHub evidence
The following pull requests were merged into `main`:

| PR | Purpose | Merge commit |
|---|---|---|
| #182 | Make Series 3 the root public home and add the Series 2 archive route | `0d08cd5809c1723ce90e4f4e02a1df2183d52d71` |
| #185 | Remove redundant Series 3 top banner/title and reposition archive entry below the Series 3 poster | `998e76f4331776d5d175b202de077df877c86b6c` |
| #186 | Remove redundant bottom back button from Series 3 home | `581b848c096ebd217be4257567e9218195ab987c` |
| #187 | Hide the Series 3 promotional card and Series 2 category pill in the archive only | `f25f99de2bc86baf46ff61b464ba0c2e7cf2ba3e` |
| #188 | Remove the archive subtitle | `6b58bbfc67626ec530975c447e9c850082a3041c` |
| #189 | Place the archive title below the PLATO LAND brand header and change navigation to `بازگشت به صفحه اصلی` | `66afce643fe3b5c8936448c7580cce08aca5ec75` |

## 4. Source files in the sealed implementation
- `src/index.tsx`: root/Series 2 archive route selection.
- `src/Series3Home.tsx` and `src/Series3Gallery.tsx`: Series 3 public home and archive entry presentation.
- `src/Series2Archive.tsx`: archive-specific rendering configuration.
- `src/Series2Registration.tsx`: shared Series 2 historical page; archive-only visibility options control the promotional card, category label and archive heading.

The archive-only options are disabled/enabled only for the archive render. The shared Series 2 public page's default behavior is retained elsewhere.

## 5. Verification and release status
### GitHub Actions on production main
For merge commit `66afce643fe3b5c8936448c7580cce08aca5ec75`:
- Build and typecheck run `43764066687`: **SUCCESS**.
- Deploy PLATO LAND website run `43764066673`: **SUCCESS**.

### Live URL inspection
A fresh read of the live pages confirmed:
- `https://platoland.org/` identifies the Series 3 home and provides a Series 2 archive entry.
- `https://platoland.org/?page=series2-archive` displays the PLATO LAND brand, tagline, archive title `آرشیو رسمی سری دوم`, and link `بازگشت به صفحه اصلی`.
- The previously requested archive subtitle is absent from the live page text.
- The archive link resolves to the root URL.

This was a live page-content inspection. It does not constitute a full manual iPhone visual regression test of every archived section; owner visual confirmation remains the final check for detailed spacing/cropping.

## 6. Data, security, and scope boundaries
- No Series 2 or Series 3 database records were changed for these routing and presentation updates.
- No Supabase schema, migration, RPC, Edge Function or Storage object was changed by these updates.
- No prediction or registration state was reopened or altered.
- The existing Series 2 management tools and temporary management entry were retained.
- No PLATO LAND – Main Website source, database, or feature was changed.
- No paid service or additional cost was introduced.

## 7. Outstanding / acceptance notes
- The production build and deployment for the sealed main commit are successful.
- Live content confirms the archive title and return-to-home label, and the subtitle is absent.
- A final owner visual check on iPhone may still identify spacing or image presentation adjustments; such adjustments require a separate change record and must not alter archived data.

## 8. Version history
- **v1.0 — 2026-11-15:** Initial approved transition from Series 2 public home to Series 3 public home, retaining Series 2 as an archive.
- **v1.1 — 2026-11-15:** Static-host compatibility update; verified archive entry through the root query route.
- **v1.2 — 2026-11-15:** Formal seal of the final archive layout, archive-only content visibility, navigation wording, merged PR history, successful main Build/Deploy and live content inspection.
