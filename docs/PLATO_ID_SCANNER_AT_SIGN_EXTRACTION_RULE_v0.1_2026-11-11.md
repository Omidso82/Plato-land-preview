# PLATO ID Scanner — At-sign Identification Rule

**Document version:** 0.1  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Status:** User-approved rule

## 1. Source workflow

Members of the Telegram active-users group post their Plato IDs as messages. The team captures screenshots of those messages and uploads the screenshots to the Scanner in the temporary management panel. The Scanner extracts IDs from the screenshot; it does not connect to Plato or query Plato accounts.

## 2. Approved input convention

The user will ask group members to put an `@` character at the beginning of every Plato ID when posting it. This convention makes candidate identification explicit and reduces confusion with display names and unrelated message text.

## 3. Extraction rule

- Only a whitespace-delimited OCR token whose first character is `@` is an ID candidate.
- A token without a leading `@` is ignored and must not be included as a Plato ID.
- Multiple `@` tokens in one message must be extracted separately.
- Preserve the exact raw token, including case, underscores, and punctuation, for operator review.
- Do not automatically remove or relocate `@`, change case, convert lookalike characters, or merge visually similar strings.
- Exact duplicate candidates may be collapsed in the daily working list only under the already approved exact-deduplication rule. Similar but non-identical strings remain separate until human review.
- OCR candidates are provisional. The operator/owner review and correction flow remains authoritative before approval and reporting.

## 4. Daily and weekly handling

The previously approved daily and weekly rules remain unchanged:
- One exact canonical ID appears at most once in a given Tehran/Jalali day.
- Weekly activity gives at most one star per ID per day, even if it appears in multiple screenshots that day.
- Corrections create new immutable review revisions and cause dependent reports to be recalculated.
- Approved reports are delivered to the fixed test Telegram group only through the separately authorized server-side delivery workflow.

## 5. Example

Input OCR text:
`Ali display name @Plato_123 and plainword @Second_ID`

Candidates:
- `@Plato_123`
- `@Second_ID`

Ignored:
- `Ali`
- `display`
- `name`
- `and`
- `plainword`

## 6. Implementation boundary

The deterministic text-token extraction helper and tests are source-only. OCR engine execution, database migrations, report delivery, Telegram configuration, production deployment, and any paid infrastructure remain separate tasks and are not activated by this rule.
