declare const Deno: { test(name: string, fn: () => void | Promise<void>): void };

import {
  tehranJalaliDayWindow,
  tehranSaturdayWeekWindow,
} from "./plato-id-scanner-date-window";

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
  }
}

Deno.test("Jalali daily window maps Tehran midnight to a half-open UTC interval", () => {
  assertEquals(tehranJalaliDayWindow("1405/08/20"), {
    fromInclusive: "2026-11-10T20:30:00.000Z",
    toExclusive: "2026-11-11T20:30:00.000Z",
  });
});

Deno.test("weekly report window is Saturday through the following Saturday in Tehran", () => {
  assertEquals(tehranSaturdayWeekWindow("2026-11-11T12:00:00+03:30"), {
    fromInclusive: "2026-11-06T20:30:00.000Z",
    toExclusive: "2026-11-13T20:30:00.000Z",
  });
});

Deno.test("invalid Jalali dates and invalid instants are rejected", () => {
  let invalidJalali = false;
  let invalidInstant = false;
  try { tehranJalaliDayWindow("1405/12/30"); } catch { invalidJalali = true; }
  try { tehranSaturdayWeekWindow("not-a-date"); } catch { invalidInstant = true; }
  if (!invalidJalali || !invalidInstant) throw new Error("Invalid date input was accepted");
});
