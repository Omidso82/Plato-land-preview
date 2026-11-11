# PLATO ID Scanner — At-sign Identification Rule

**Document version:** 0.2  
**Date:** 2026-11-11  
**Project:** PLATO LAND – Temporary Projects  
**Status:** User-approved rule; concatenated-ID handling added

## 1. Source workflow

Members of the Telegram active-users group post their Plato IDs as messages. Screenshots of those messages are uploaded to the Scanner in the temporary management panel. The Scanner extracts IDs from screenshots; it does not connect to Plato or query Plato accounts.

## 2. Approved input convention

Members should put an \`@\` character at the beginning of every Plato ID. IDs may be posted on separate lines, separated by spaces on one line, or concatenated directly together.

## 3. Extraction rule

- Every \`@\` starts a new candidate ID.
- The candidate continues until the next \`@\`, whitespace, or line break.
- Therefore \`@First@Second@Third\` produces three candidates.
- \`@First @Second @Third\` also produces three candidates.
- One ID per line is supported.
- Text before the first \`@\` is ignored.
- Preserve exact raw spelling, capitalization and underscores.
- Do not autocorrect lookalike characters or punctuation and do not fuzzy-merge similar candidates.
- Candidates remain provisional until owner/operator review.
- Exact duplicate removal is allowed only under the already approved exact-deduplication rule.

## 4. Daily and weekly handling

The previously approved daily and weekly rules remain unchanged:
- One exact canonical ID appears at most once in a given Tehran/Jalali day.
- Weekly activity gives at most one star per ID per day, even if it appears in multiple screenshots that day.
- Corrections create new immutable review revisions and dependent reports are recalculated.
- Approved reports are delivered only through the separately authorized server-side workflow to the fixed test Telegram group.

## 5. Implementation and tests

The extraction helper and Deno tests cover:
- one ID per line;
- multiple IDs separated by spaces;
- directly concatenated IDs;
- mixed spaces, lines and concatenation;
- ignoring text before an at-sign;
- exact duplicate handling without fuzzy matching;
- preserving source text positions.

## 6. Implementation boundary

The parser and tests are source-only. OCR engine execution, database migrations, Telegram delivery, production deployment, and paid infrastructure remain separate tasks and are not activated by this rule.
