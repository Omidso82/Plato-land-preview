const IRAN_TIME_ZONE = 'Asia/Tehran';
const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: IRAN_TIME_ZONE, year: 'numeric', month: 'long', day: 'numeric' });
const persianDateTime = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: IRAN_TIME_ZONE, year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function asDate(value: string | Date): Date | null { const date = value instanceof Date ? value : new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
export function formatIranDate(value: string | Date): string { if (!value) return '—'; const date = asDate(value); return date ? persianDate.format(date) : String(value); }
export function formatIranDateTime(value: string | Date): string { if (!value) return '—'; const date = asDate(value); return date ? persianDateTime.format(date) : String(value); }
