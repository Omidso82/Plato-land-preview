import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildScannerExcelWorkbook } from "./plato-id-scanner-xlsx.ts";

Deno.test("Excel export is a valid ZIP-based XLSX package with daily sheets and exact IDs", () => {
  const workbook = buildScannerExcelWorkbook([{
    date_key: "2026-11-12",
    jalali_date: "۲۱ آبان ۱۴۰۵",
    weekday: "پنجشنبه",
    scan_count: 2,
    reviewed_images: 2,
    ids: ["Player_01", "A@B"],
    duplicates: [],
  }]);
  assertEquals(String.fromCharCode(...workbook.slice(0, 4)), "PK\u0003\u0004");
  const xml = new TextDecoder().decode(workbook);
  for (const expected of ["خلاصه", "2026-11-12", "Player_01", "A@B", "۲۱ آبان ۱۴۰۵"]) {
    if (!xml.includes(expected)) throw new Error("Workbook is missing " + expected);
  }
});
