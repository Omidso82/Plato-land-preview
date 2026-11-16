const TEHRAN_OFFSET = "+03:30";
const persianParts = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  timeZone: "Asia/Tehran", year: "numeric", month: "numeric", day: "numeric",
});

export function formatTehranJalali(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date);
}

export function jalaliInputToIso(value: string): string | null {
  const normalized = value.trim().replace(/[۰-۹٠-٩]/g, digit => {
    const persianIndex = "۰۱۲۳۴۵۶۷۸۹".indexOf(digit);
    return String(persianIndex >= 0 ? persianIndex : "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
  });
  const match = /^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[ T](\d{1,2}):(\d{2})$/.exec(normalized);
  if (!match) throw new Error("تاریخ و ساعت را به شکل ۱۴۰۵/۰۸/۳۰ ۱۸:۰۰ وارد کنید.");

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (year < 1200 || year > 1600 || month < 1 || month > 12 ||
      day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error("تاریخ یا ساعت شمسی معتبر نیست.");
  }

  // Search Gregorian calendar days around the expected Jalali year boundary.
  // Noon UTC is used so the date inspected in Asia/Tehran is unambiguous.
  const approximateStart = Date.UTC(year + 621, 2, 17, 12);
  for (let offset = -5; offset <= 370; offset++) {
    const candidate = new Date(approximateStart + offset * 86_400_000);
    const parts = Object.fromEntries(
      persianParts.formatToParts(candidate).map(part => [part.type, part.value]),
    );
    if (Number(parts.year) !== year || Number(parts.month) !== month || Number(parts.day) !== day) continue;

    const gregorianYear = candidate.getUTCFullYear();
    const gregorianMonth = String(candidate.getUTCMonth() + 1).padStart(2, "0");
    const gregorianDay = String(candidate.getUTCDate()).padStart(2, "0");
    const localDateTime = `${gregorianYear}-${gregorianMonth}-${gregorianDay}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${TEHRAN_OFFSET}`;
    return new Date(localDateTime).toISOString();
  }

  throw new Error("تاریخ شمسی معتبر نیست؛ روز انتخاب‌شده در این ماه وجود ندارد.");
}

export function isoToJalaliInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
    timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}
