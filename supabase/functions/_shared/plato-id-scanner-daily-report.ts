export const SCANNER_REPORT_TIME_ZONE = "Asia/Tehran";

export interface ScannerDailyScan {
  id: string;
  created_at: string;
}
export interface ScannerDailyRevision {
  scan_id: string;
  revision: number;
  status: string;
  canonical_ids: unknown;
}
export interface ScannerDailyDuplicate {
  id: string;
  first_scan_id: string;
  duplicate_scan_id: string;
}
export interface ScannerDailyGroup {
  date_key: string;
  jalali_date: string;
  weekday: string;
  scan_count: number;
  reviewed_images: number;
  ids: string[];
  duplicates: ScannerDailyDuplicate[];
}

const gregorianDate = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
  timeZone: SCANNER_REPORT_TIME_ZONE,
  year: "numeric", month: "2-digit", day: "2-digit",
});
const persianDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: SCANNER_REPORT_TIME_ZONE,
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

function dateParts(formatter: Intl.DateTimeFormat, date: Date) {
  return Object.fromEntries(formatter.formatToParts(date)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));
}
function validTimestamp(value: string): Date {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid Scanner upload timestamp.");
  return date;
}
function tehranDateKey(value: string): string {
  const parts = dateParts(gregorianDate, validTimestamp(value));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function tehranPersianDate(value: string) {
  const parts = dateParts(persianDate, validTimestamp(value));
  return {
    jalaliDate: `${parts.day} ${parts.month} ${parts.year}`,
    weekday: parts.weekday,
  };
}

/** Groups the latest human-approved revision for each image by its Tehran upload day. */
export function buildDailyScannerGroups(
  scans: ScannerDailyScan[],
  revisions: ScannerDailyRevision[],
): ScannerDailyGroup[] {
  const latest = new Map<string, ScannerDailyRevision>();
  for (const revision of revisions) {
    if (revision.status !== "approved" || !Number.isInteger(revision.revision) || revision.revision < 1) continue;
    const previous = latest.get(revision.scan_id);
    if (!previous || revision.revision > previous.revision) latest.set(revision.scan_id, revision);
  }

  const ordered = [...scans].sort((a, b) =>
    a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
  );
  const groups = new Map<string, ScannerDailyGroup>();
  for (const scan of ordered) {
    const date_key = tehranDateKey(scan.created_at);
    let group = groups.get(date_key);
    if (!group) {
      const local = tehranPersianDate(scan.created_at);
      group = {
        date_key,
        jalali_date: local.jalaliDate,
        weekday: local.weekday,
        scan_count: 0,
        reviewed_images: 0,
        ids: [],
        duplicates: [],
      };
      groups.set(date_key, group);
    }
    group.scan_count += 1;
    const revision = latest.get(scan.id);
    if (!revision) continue;
    group.reviewed_images += 1;
    if (!Array.isArray(revision.canonical_ids)) continue;
    const seen = new Set(group.ids);
    for (const candidate of revision.canonical_ids) {
      if (typeof candidate !== "string" || candidate.trim().length === 0) continue;
      if (seen.has(candidate)) {
        const first = group.duplicates.find((item) => item.id === candidate)?.first_scan_id
          ?? ordered.find((item) => item.id !== scan.id && tehranDateKey(item.created_at) === date_key
            && latest.get(item.id)?.canonical_ids instanceof Array
            && (latest.get(item.id)!.canonical_ids as unknown[]).includes(candidate))?.id;
        if (first) group.duplicates.push({ id: candidate, first_scan_id: first, duplicate_scan_id: scan.id });
      } else {
        seen.add(candidate);
        group.ids.push(candidate);
      }
    }
  }
  return [...groups.values()].sort((a, b) => a.date_key.localeCompare(b.date_key));
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Formats day-separated Telegram messages while keeping each day's heading with its IDs. */
export function formatDailyGroupedTelegramMessages(
  days: ScannerDailyGroup[],
  header: string,
  maxChars = 3500,
): string[] {
  if (maxChars < 500 || maxChars > 4096) throw new Error("Telegram message chunk size is invalid.");
  const messages: string[] = [];
  let current = header;
  const push = () => { if (current.trim()) messages.push(current); };
  for (const day of days) {
    const heading = `<b>${escapeHtml(day.weekday)} | ${escapeHtml(day.jalali_date)}</b>\n`
      + `تصاویر ثبت‌شده: ${day.scan_count} · تصاویر تأییدشده: ${day.reviewed_images}\n`
      + `ID یکتای این روز: ${day.ids.length}\n`;
    if (current.length + heading.length > maxChars && current !== header) {
      push();
      current = header;
    }
    if (current.length + heading.length > maxChars) throw new Error("A daily report heading exceeds Telegram message limit.");
    current += (current === header ? "\n" : "\n") + heading;
    const rows = day.ids.length
      ? day.ids.map((id, index) => `${index + 1}. ${escapeHtml(id)}`)
      : ["شناسه تأییدشده‌ای برای این روز ثبت نشده است."];
    for (const row of rows) {
      const line = row + "\n";
      if (current.length + line.length > maxChars) {
        push();
        current = header + "\n" + heading + line;
      } else current += line;
    }
  }
  push();
  return messages.length ? messages : [header + "\nدر بازه انتخاب‌شده تصویری ثبت نشده است."];
}
