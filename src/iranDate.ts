const IRAN_TIME_ZONE = 'Asia/Tehran';
const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: IRAN_TIME_ZONE, year: 'numeric', month: 'long', day: 'numeric' });
const persianDateTime = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: IRAN_TIME_ZONE, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function asDate(value: string | Date): Date | null { const date = value instanceof Date ? value : new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
export function formatIranDate(value: string | Date): string { if (!value) return '—'; const date = asDate(value); return date ? persianDate.format(date) : String(value); }
export function formatIranDateTime(value: string | Date): string { if (!value) return '—'; const date = asDate(value); return date ? persianDateTime.format(date) : String(value); }

const persianTime = new Intl.DateTimeFormat('fa-IR', { timeZone: IRAN_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const persianDateTimeWithSeconds = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: IRAN_TIME_ZONE, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });

/** Format a stored instant using Iran's official wall-clock time, independent of device locale/time zone. */
export function formatIranTime(value: string | Date): string { if (!value) return '—'; const date = asDate(value); return date ? persianTime.format(date) : String(value); }

/** Full Jalali date and Tehran time, including seconds for audit/event details. */
export function formatIranDateTimeWithSeconds(value: string | Date): string { if (!value) return '—'; const date = asDate(value); return date ? persianDateTimeWithSeconds.format(date) : String(value); }

/** Return an ISO instant unchanged in meaning; display conversion must happen only at the UI boundary. */
export function toStoredInstant(value: string | Date): string | null { const date = asDate(value); return date ? date.toISOString() : null; }

const persianCalendar = new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: IRAN_TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric' });

function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));
}

export function jalaliDateToIso(value: string): string {
  const match = normalizeDigits(value.trim()).match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
  if (!match) return '';
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  const firstDayOfYear = (jy: number): Date | null => {
    for (let marchDay = 19; marchDay <= 22; marchDay++) {
      const candidate = new Date(Date.UTC(jy + 621, 2, marchDay, 12));
      const parts = persianCalendar.formatToParts(candidate);
      const part = (key: string) => Number(parts.find(item => item.type === key)?.value);
      if (part('year') === jy && part('month') === 1 && part('day') === 1) return candidate;
    }
    return null;
  };
  const start = firstDayOfYear(year), next = firstDayOfYear(year + 1);
  if (!start || !next) return '';
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, (next.getTime() - start.getTime()) / 86400000 - 336];
  if (day > lengths[month - 1]) return '';
  const offset = lengths.slice(0, month - 1).reduce((sum, length) => sum + length, 0) + day - 1;
  return new Date(start.getTime() + offset * 86400000).toISOString().slice(0, 10);
}

export function formatIranJalaliDateInput(value: string | Date): string {
  const date = asDate(value);
  if (!date) return '';
  const parts = persianCalendar.formatToParts(date);
  const part = (key: string) => parts.find(item => item.type === key)?.value || '';
  return part('year').padStart(4, '0') + '/' + part('month').padStart(2, '0') + '/' + part('day').padStart(2, '0');
}

export function formatIranClockInput(value: string | Date): string {
  const date = asDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', { timeZone: IRAN_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
}

export function iranJalaliDateTimeToIso(dateValue: string, timeValue: string): string | null {
  const date = jalaliDateToIso(dateValue);
  const time = normalizeDigits(timeValue.trim());
  if (!date || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  return new Date(date + 'T' + time + ':00+03:30').toISOString();
}
