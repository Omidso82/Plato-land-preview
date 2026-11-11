export const SCANNER_REPORT_TIME_ZONE = "Asia/Tehran";

type DateParts = { year: number; month: number; day: number };

const gregorianFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SCANNER_REPORT_TIME_ZONE,
  calendar: "gregory",
  numberingSystem: "latn",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const jalaliFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SCANNER_REPORT_TIME_ZONE,
  calendar: "persian",
  numberingSystem: "latn",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function numericParts(formatter: Intl.DateTimeFormat, date: Date): DateParts & { hour?: number; minute?: number; second?: number } {
  const values = Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    ...(values.hour === undefined ? {} : { hour: values.hour }),
    ...(values.minute === undefined ? {} : { minute: values.minute }),
    ...(values.second === undefined ? {} : { second: values.second }),
  };
}

function sameDay(a: DateParts, b: DateParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

function jalaliToGregorianDate(key: string): DateParts {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(key);
  if (!match) throw new Error("Jalali date must use YYYY/MM/DD");
  const target = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  if (target.month < 1 || target.month > 12 || target.day < 1 || target.day > 31) {
    throw new Error("Invalid Jalali calendar date");
  }

  // Intl's Persian calendar is the calendar authority. Search a bounded
  // Gregorian interval around the corresponding year; no arithmetic
  // assumptions about leap years or month lengths are made.
  const from = Date.UTC(target.year + 620, 0, 1);
  const to = Date.UTC(target.year + 624, 0, 1);
  for (let cursor = from; cursor < to; cursor += 86_400_000) {
    const date = new Date(cursor);
    const local = numericParts(gregorianFormatter, date);
    const jalali = numericParts(jalaliFormatter, date);
    if (sameDay(jalali, target)) return { year: local.year, month: local.month, day: local.day };
  }
  throw new Error("Jalali date does not exist");
}

function tehranMidnightUtc(date: DateParts): string {
  const targetWallTime = Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0);
  let candidate = targetWallTime;

  // Solve the timezone offset from Intl at the target instant. This accounts
  // for historical Asia/Tehran offset changes instead of hard-coding +03:30.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const local = numericParts(gregorianFormatter, new Date(candidate));
    const representedWallTime = Date.UTC(
      local.year, local.month - 1, local.day,
      local.hour ?? 0, local.minute ?? 0, local.second ?? 0,
    );
    const correction = targetWallTime - representedWallTime;
    candidate += correction;
    if (correction === 0) break;
  }
  return new Date(candidate).toISOString();
}

function addGregorianDays(date: DateParts, days: number): DateParts {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
}

function tehranGregorianDateFromInstant(instant: string): DateParts {
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date/time");
  const local = numericParts(gregorianFormatter, date);
  return { year: local.year, month: local.month, day: local.day };
}

/** Half-open UTC interval for one Jalali calendar day in Asia/Tehran. */
export function tehranJalaliDayWindow(jalaliDateKey: string): { fromInclusive: string; toExclusive: string } {
  const gregorian = jalaliToGregorianDate(jalaliDateKey);
  return {
    fromInclusive: tehranMidnightUtc(gregorian),
    toExclusive: tehranMidnightUtc(addGregorianDays(gregorian, 1)),
  };
}

/** Half-open UTC interval for the Saturday–Friday week containing an instant. */
export function tehranSaturdayWeekWindow(anyInstantInWeek: string): { fromInclusive: string; toExclusive: string } {
  const localDate = tehranGregorianDateFromInstant(anyInstantInWeek);
  const weekday = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day)).getUTCDay();
  const daysSinceSaturday = (weekday + 1) % 7;
  const saturday = addGregorianDays(localDate, -daysSinceSaturday);
  return {
    fromInclusive: tehranMidnightUtc(saturday),
    toExclusive: tehranMidnightUtc(addGregorianDays(saturday, 7)),
  };
}
