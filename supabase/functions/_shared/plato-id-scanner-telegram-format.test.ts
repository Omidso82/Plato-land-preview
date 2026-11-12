import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { formatTehranPersianHeader } from "./plato-id-scanner-telegram-format.ts";

Deno.test("Telegram header uses Tehran weekday and Persian calendar date", () => {
  const result = formatTehranPersianHeader(new Date("2026-11-12T12:00:00.000Z"));
  assertEquals(result.weekday, "پنجشنبه");
  assertEquals(result.date, "۲۱ آبان ۱۴۰۵");
});
