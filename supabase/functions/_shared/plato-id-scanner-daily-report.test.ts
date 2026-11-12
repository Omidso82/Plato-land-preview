import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildDailyScannerGroups, formatDailyGroupedTelegramMessages } from "./plato-id-scanner-daily-report.ts";

Deno.test("Scanner report groups by Tehran upload date and preserves IDs exactly", () => {
  const days = buildDailyScannerGroups([
    { id: "a", created_at: "2026-11-12T20:29:59.000Z" },
    { id: "b", created_at: "2026-11-12T20:30:00.000Z" },
    { id: "c", created_at: "2026-11-13T10:00:00.000Z" },
  ], [
    { scan_id: "a", revision: 1, status: "approved", canonical_ids: ["Player_01", "A@B"] },
    { scan_id: "b", revision: 1, status: "approved", canonical_ids: ["Player_01"] },
    { scan_id: "c", revision: 1, status: "approved", canonical_ids: ["Player_01"] },
  ]);
  assertEquals(days.length, 2);
  assertEquals(days[0].date_key, "2026-11-12");
  assertEquals(days[0].ids, ["Player_01", "A@B"]);
  assertEquals(days[1].date_key, "2026-11-13");
  assertEquals(days[1].ids, ["Player_01"]);
});

Deno.test("only the latest approved revision is used and same-day exact duplicates are flagged", () => {
  const days = buildDailyScannerGroups([
    { id: "a", created_at: "2026-11-12T08:00:00.000Z" },
    { id: "b", created_at: "2026-11-12T09:00:00.000Z" },
  ], [
    { scan_id: "a", revision: 1, status: "approved", canonical_ids: ["Old"] },
    { scan_id: "a", revision: 2, status: "approved", canonical_ids: ["Exact_ID"] },
    { scan_id: "b", revision: 1, status: "approved", canonical_ids: ["Exact_ID", "exact_id"] },
  ]);
  assertEquals(days[0].ids, ["Exact_ID", "exact_id"]);
  assertEquals(days[0].duplicates, [{ id: "Exact_ID", first_scan_id: "a", duplicate_scan_id: "b" }]);
});

Deno.test("Telegram messages keep day headings and IDs grouped", () => {
  const days = buildDailyScannerGroups([
    { id: "a", created_at: "2026-11-12T08:00:00.000Z" },
  ], [{ scan_id: "a", revision: 1, status: "approved", canonical_ids: ["Plato_1"] }]);
  const messages = formatDailyGroupedTelegramMessages(days, "<b>PLATO LAND</b>");
  assertEquals(messages.length, 1);
  if (!messages[0].includes(days[0].jalali_date) || !messages[0].includes("Plato_1")) {
    throw new Error("Daily heading or Plato ID missing from Telegram output.");
  }
});
