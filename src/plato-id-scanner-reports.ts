export const SCANNER_TIME_ZONE = "Asia/Tehran";
export const WEEKDAY_NAMES_FA = ["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه"] as const;

export interface ScannerReportSource {
  id: string;
  created_at: string;
  status: string;
  ocr_result: { ids?: unknown } | null;
}
export interface DailyScannerReport {
  jalaliDate: string;
  ids: string[];
  imageCount: number;
}
export interface WeeklyScannerReport {
  weekStartJalali: string;
  weekEndJalali: string;
  rows: Array<{ id: string; activeDays: boolean[] }>;
  imageCount: number;
}
const gregorianParts = new Intl.DateTimeFormat("en-US", {
  timeZone: SCANNER_TIME_ZONE, calendar: "gregory", numberingSystem: "latn",
  year: "numeric", month: "2-digit", day: "2-digit",
});
const jalaliParts = new Intl.DateTimeFormat("en-US", {
  timeZone: SCANNER_TIME_ZONE, calendar: "persian", numberingSystem: "latn",
  year: "numeric", month: "2-digit", day: "2-digit",
});
const weekdayParts = new Intl.DateTimeFormat("en-US", {
  timeZone: SCANNER_TIME_ZONE, calendar: "gregory", weekday: "short",
});
function parts(formatter: Intl.DateTimeFormat, value: Date) {
  return Object.fromEntries(formatter.formatToParts(value).filter(p => p.type !== "literal").map(p => [p.type,p.value]));
}
function validDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid scan timestamp");
  return date;
}
function tehranCalendarDate(value: string) {
  const date = validDate(value), p = parts(gregorianParts,date);
  return {year:Number(p.year),month:Number(p.month),day:Number(p.day),jalali:parts(jalaliParts,date)};
}
export function tehranJalaliDateKey(value: string): string {
  const p=tehranCalendarDate(value).jalali;
  return `${p.year}/${p.month}/${p.day}`;
}
function saturdayWeekStart(value: string) {
  const local=tehranCalendarDate(value);
  const utc=Date.UTC(local.year,local.month-1,local.day);
  const weekday=new Date(utc).getUTCDay();
  const daysSinceSaturday=(weekday+1)%7;
  return new Date(utc-daysSinceSaturday*86400000);
}
function isoAtTehranCalendarDay(date: Date) {
  const iso=`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}-${String(date.getUTCDate()).padStart(2,"0")}T12:00:00+03:30`;
  return iso;
}
function reviewedIds(scan: ScannerReportSource): string[] {
  if(scan.status!=="completed"||!Array.isArray(scan.ocr_result?.ids)) return [];
  return [...new Set(scan.ocr_result!.ids.filter((id):id is string=>typeof id==="string"&&id.trim().length>0).map(id=>id))];
}
export function buildDailyScannerReport(scans: ScannerReportSource[], dateKey: string): DailyScannerReport {
  const dayScans=scans.filter(scan=>tehranJalaliDateKey(scan.created_at)===dateKey);
  const ids=new Set<string>();
  for(const scan of dayScans) for(const id of reviewedIds(scan)) ids.add(id);
  return {jalaliDate:dateKey,ids:[...ids].sort((a,b)=>a.localeCompare(b)),imageCount:dayScans.length};
}
export function buildWeeklyScannerReport(scans: ScannerReportSource[], anyDateInWeek: string): WeeklyScannerReport {
  const start=saturdayWeekStart(anyDateInWeek);
  const dayKeys=Array.from({length:7},(_,i)=>tehranJalaliDateKey(isoAtTehranCalendarDay(new Date(start.getTime()+i*86400000))));
  const ids=new Map<string,Set<number>>();
  const weekScans=scans.filter(scan=>{
    const key=tehranJalaliDateKey(scan.created_at);
    return dayKeys.includes(key);
  });
  for(const scan of weekScans){
    const dayIndex=dayKeys.indexOf(tehranJalaliDateKey(scan.created_at));
    if(dayIndex<0)continue;
    for(const id of reviewedIds(scan)){
      if(!ids.has(id))ids.set(id,new Set<number>());
      ids.get(id)!.add(dayIndex);
    }
  }
  const jalaliStart=dayKeys[0],jalaliEnd=dayKeys[6];
  return {
    weekStartJalali:jalaliStart,weekEndJalali:jalaliEnd,imageCount:weekScans.length,
    rows:[...ids.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([id,days])=>({id,activeDays:Array.from({length:7},(_,i)=>days.has(i))})),
  };
}
export function formatDailyTelegramMessages(report: DailyScannerReport, maxChars=3500): string[] {
  const header=`گزارش روزانه PLATO ID\nتاریخ: ${report.jalaliDate}\nتعداد تصاویر: ${report.imageCount}\nتعداد ID یکتا: ${report.ids.length}\n\n`;
  return splitTelegramText(header,report.ids.map((id,i)=>`${i+1}. ${id}`),maxChars);
}
export function formatWeeklyTelegramMessages(report: WeeklyScannerReport, maxChars=3500): string[] {
  const header=`جدول فعالیت هفتگی PLATO ID\nاز ${report.weekStartJalali} تا ${report.weekEndJalali}\n\nID | ش | ی | د | س | چ | پ | ج\n`;
  const rows=report.rows.map(row=>`${row.id} | ${row.activeDays.map(active=>active?"★":"·").join(" | ")}`);
  return splitTelegramText(header,rows,maxChars);
}
function splitTelegramText(header: string, rows: string[], maxChars: number): string[] {
  if(maxChars<200||maxChars>4096)throw new Error("Telegram message chunk size must be between 200 and 4096 characters");
  const chunks:string[]=[];let current=header;
  for(const row of rows){
    const addition=(current===header?"":"\n")+row;
    if(current.length+addition.length>maxChars&&current!==header){chunks.push(current);current=header+row;}
    else if(current.length+addition.length>maxChars){throw new Error("A single report row exceeds the Telegram message limit");}
    else current+=addition;
  }
  if(current.length||!chunks.length)chunks.push(current);
  return chunks;
}

export function formatScanTelegramMessages(scanLabel: string, ids: string[], maxChars=3500): string[] {
  const uniqueIds=[...new Set(ids.filter(id=>typeof id==="string"&&id.trim().length>0).map(id=>id))];
  const header=`فهرست Plato ID استخراج‌شده\nتصویر: ${scanLabel}\nتعداد ID یکتا: ${uniqueIds.length}\n\n`;
  return splitTelegramText(header,uniqueIds.map((id,i)=>`${i+1}. ${id}`),maxChars);
}


/** Append-only review rows; the greatest revision number is the current approved list. */
export interface ScannerApprovedRevisionSource {
  scan_id: string;
  revision: number;
  status: string;
  canonical_ids: unknown;
}

function latestApprovedIdsByScan(
  revisions: ScannerApprovedRevisionSource[],
): Map<string, string[]> {
  const latest = new Map<string, ScannerApprovedRevisionSource>();
  for (const row of revisions) {
    if (row.status !== "approved" || !Number.isInteger(row.revision) || row.revision < 1) continue;
    const previous = latest.get(row.scan_id);
    if (!previous || row.revision > previous.revision) latest.set(row.scan_id, row);
  }
  return new Map([...latest.entries()].map(([scanId, row]) => [
    scanId,
    Array.isArray(row.canonical_ids)
      ? [...new Set(row.canonical_ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0))]
      : [],
  ]));
}

/**
 * Report builders based on the immutable approved review history, not the
 * original OCR payload. A later correction replaces the earlier list for that
 * image; it is never unioned with the old revision.
 */
export function buildDailyScannerReportFromRevisions(
  scans: ScannerReportSource[],
  revisions: ScannerApprovedRevisionSource[],
  dateKey: string,
): DailyScannerReport {
  const latest = latestApprovedIdsByScan(revisions);
  const sources = scans.map(scan => ({
    ...scan,
    status: latest.has(scan.id) ? "completed" : "needs_review",
    ocr_result: { ids: latest.get(scan.id) ?? [] },
  }));
  return buildDailyScannerReport(sources, dateKey);
}

export function buildWeeklyScannerReportFromRevisions(
  scans: ScannerReportSource[],
  revisions: ScannerApprovedRevisionSource[],
  anyDateInWeek: string,
): WeeklyScannerReport {
  const latest = latestApprovedIdsByScan(revisions);
  const sources = scans.map(scan => ({
    ...scan,
    status: latest.has(scan.id) ? "completed" : "needs_review",
    ocr_result: { ids: latest.get(scan.id) ?? [] },
  }));
  return buildWeeklyScannerReport(sources, anyDateInWeek);
}
