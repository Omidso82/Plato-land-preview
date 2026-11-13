import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildScannerExcelWorkbook } from "./plato-id-scanner-xlsx.ts";

Deno.test("Excel export contains Saturday-Friday weekly matrices and full Jalali monthly matrix", () => {
  const days = [
    { date_key: "2026-11-14", jalali_date: "۲۳ آبان ۱۴۰۵", weekday: "شنبه", scan_count: 1, reviewed_images: 1, ids: ["Player_01", "A@B"], duplicates: [] },
    { date_key: "2026-11-16", jalali_date: "۲۵ آبان ۱۴۰۵", weekday: "دوشنبه", scan_count: 1, reviewed_images: 1, ids: ["Player_01"], duplicates: [] },
    { date_key: "2026-11-20", jalali_date: "۲۹ آبان ۱۴۰۵", weekday: "جمعه", scan_count: 1, reviewed_images: 1, ids: ["A@B"], duplicates: [] },
  ];
  const workbook = buildScannerExcelWorkbook(days, "2026-11-14T00:00:00.000Z", "2026-11-20T20:30:00.000Z");
  assertEquals(String.fromCharCode(...workbook.slice(0, 4)), "PK\\u0003\\u0004");
  const xml = new TextDecoder().decode(workbook);
  for (const expected of ["خلاصه", "هفته ۲۳ تا ۲۹ آبان ۱۴۰۵", "ماه ۱۴۰۵ آبان", "Player_01", "A@B", "★", "۳۰", "Aptos", "FFFFC000", 's="1"', 'width="26"']) {
    if (!xml.includes(expected)) throw new Error("Workbook is missing " + expected);
  }
  if (xml.includes("NaN")) throw new Error("Monthly Jalali day labels must not contain NaN.");
  if (!xml.includes("۲۳ آبان ۱۴۰۵")) throw new Error("Summary start date must use the Jalali calendar.");
  if (!xml.includes('pane xSplit="1" ySplit="1"')) throw new Error("Mobile sheets must freeze the ID column and header row.");
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

Deno.test("Exclusive report end does not create an empty following weekly sheet", () => {
  const days = [
    { date_key: "2026-11-13", jalali_date: "۲۲ آبان ۱۴۰۵", weekday: "جمعه", scan_count: 1, reviewed_images: 1, ids: ["Long_Player_ID_123456789"], duplicates: [] },
  ];
  const workbook = buildScannerExcelWorkbook(days, "2026-11-12T20:30:00.000Z", "2026-11-13T20:30:00.000Z");
  const xml = new TextDecoder().decode(workbook);
  if (xml.includes("هفته ۲۳ تا ۲۹ آبان ۱۴۰۵")) throw new Error("Exclusive end boundary created an empty next-week sheet.");
  if (!xml.includes("هفته ۱۶ تا ۲۲ آبان ۱۴۰۵")) throw new Error("The included week sheet is missing.");
  if (!xml.includes("Long_Player_ID_123456789")) throw new Error("Long Plato ID was altered or omitted.");
  if (!xml.includes('width="28"')) throw new Error("The ID column is not wide enough for mobile viewing.");
});
