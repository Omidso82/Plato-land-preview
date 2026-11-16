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
  const normalized = value.trim().replace(/[۰-۹٠-٩]/g, digit => { const fa = '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit); return String(fa >= 0 ? fa : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)); });
  const match = /^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})[ T](\d{1,2}):(\d{2})$/.exec(normalized);
  if (!match) throw new Error("تاریخ و ساعت را به شکل ۱۴۰۵/۰۸/۳۰ ۱۸:۰۰ وارد کنید.");
  const [, ys, ms, ds, hs, mins] = match;
  const jy = Number(ys), jm = Number(ms), jd = Number(ds), hour = Number(hs), minute = Number(mins);
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31 || hour > 23 || minute > 59) throw new Error("تاریخ یا ساعت شمسی معتبر نیست.");
  const target = { year: jy, month: jm, day: jd };
  const start = Date.UTC(jy + 621, 2, 17, 12);
  for (let offset = 0; offset < 12; offset++) {
    for (let day = -4; day <= 370; day++) {
      const candidate = new Date(start + (day + offset * 0) * 86400000);
      const parts = Object.fromEntries(persianParts.formatToParts(candidate).map(p => [p.type, p.value]));
      if (Number(parts.year) === target.year && Number(parts.month) === target.month && Number(parts.day) === target.day) {
        const gy = candidate.getUTCFullYear(), gm = String(candidate.getUTCMonth() + 1).padStart(2, "0"), gd = String(candidate.getUTCDate()).padStart(2, "0");
        return new Date(`${gy}-${gm}-${gd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${TEHRAN_OFFSET}`).toISOString();
      }
    }
  }
  throw new Error("تبدیل تاریخ شمسی انجام نشد؛ تاریخ را بررسی کنید.");
}
export function isoToJalaliInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
    timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).map(p => [p.type, p.value]));
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}
