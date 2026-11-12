import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildScannerExcelWorkbook } from "./plato-id-scanner-xlsx.ts";

Deno.test("Excel export contains Saturday-Friday weekly matrices and full Jalali monthly matrix", () => {
  const days = [
    { date_key: "2026-11-14", jalali_date: "۲۳ آبان ۱۴۰۵", weekday: "شنبه", scan_count: 1, reviewed_images: 1, ids: ["Player_01", "A@B"], duplicates: [] },
    { date_key: "2026-11-16", jalali_date: "۲۵ آبان ۱۴۰۵", weekday: "دوشنبه", scan_count: 1, reviewed_images: 1, ids: ["Player_01"], duplicates: [] },
    { date_key: "2026-11-20", jalali_date: "۲۹ آبان ۱۴۰۵", weekday: "جمعه", scan_count: 1, reviewed_images: 1, ids: ["A@B"], duplicates: [] },
  ];
  const workbook = buildScannerExcelWorkbook(days, "2026-11-14T00:00:00.000Z", "2026-11-20T20:30:00.000Z");
  assertEquals(String.fromCharCode(...workbook.slice(0, 4)), "PK\u0003\u0004");
  const xml = new TextDecoder().decode(workbook);
  for (const expected of ["خلاصه", "هفته 2026-11-14", "ماه ۱۴۰۵ آبان", "Player_01", "A@B", "★", "۳۰"]) {
    if (!xml.includes(expected)) throw new Error("Workbook is missing " + expected);
  }
  if (!xml.includes("شنبه ۲۳") || !xml.includes("یکشنبه ۲۴") || !xml.includes("دوشنبه ۲۵") || !xml.includes("جمعه ۲۹")) {
    throw new Error("Weekly weekday/date columns are incomplete.");
  }
});

Deno.test("Monthly sheet retains the same ID across multiple active days", () => {
  const days = [
    { date_key: "2026-11-14", jalali_date: "۲۳ آبان ۱۴۰۵", weekday: "شنبه", scan_count: 1, reviewed_images: 1, ids: ["Repeat_ID"], duplicates: [] },
    { date_key: "2026-11-16", jalali_date: "۲۵ آبان ۱۴۰۵", weekday: "دوشنبه", scan_count: 1, reviewed_images: 1, ids: ["Repeat_ID"], duplicates: [] },
  ];
  const workbook = buildScannerExcelWorkbook(days, "2026-11-14T00:00:00.000Z", "2026-11-16T20:30:00.000Z");
  const xml = new TextDecoder().decode(workbook);
  if (!xml.includes("Repeat_ID")) throw new Error("Monthly activity row is missing.");
});
