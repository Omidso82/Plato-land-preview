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
