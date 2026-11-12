import type { ScannerDailyGroup } from "./plato-id-scanner-daily-report.ts";

const encoder = new TextEncoder();
const xmlEscape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const bytes = (value: string) => encoder.encode(value);
function concat(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(value: number): Uint8Array {
  const out = new Uint8Array(2); new DataView(out.buffer).setUint16(0, value, true); return out;
}
function u32(value: number): Uint8Array {
  const out = new Uint8Array(4); new DataView(out.buffer).setUint32(0, value >>> 0, true); return out;
}

/** Minimal standards-compliant uncompressed ZIP container for an Office Open XML workbook. */
function zipStored(entries: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = bytes(entry.name), crc = crc32(entry.data), size = entry.data.length;
    const header = concat([
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(name.length), u16(0), name,
    ]);
    local.push(header, entry.data);
    const directory = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name,
    ]);
    central.push(directory);
    offset += header.length + size;
  }
  const centralBytes = concat(central);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
    u32(centralBytes.length), u32(offset), u16(0),
  ]);
  return concat([...local, centralBytes, end]);
}
function columnName(index: number): string {
  let value = index + 1, name = "";
  while (value > 0) { const rem = (value - 1) % 26; name = String.fromCharCode(65 + rem) + name; value = Math.floor((value - 1) / 26); }
  return name;
}
function worksheet(rows: string[][]): string {
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  const widths = Array.from({ length: columnCount }, (_, columnIndex) => {
    const maxLength = Math.max(0, ...rows.map((row) => [...(row[columnIndex] ?? "")].length));
    return Math.min(30, Math.max(columnIndex === 0 ? 18 : 9, maxLength + 3));
  });
  const cols = widths.map((width, index) =>
    `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
  ).join("");
  const body = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const ref = columnName(columnIndex) + (rowIndex + 1);
      const style = rowIndex === 0 ? 1 : value === "★" ? 2 : 0;
      return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}" ht="${rowIndex === 0 ? 25 : 22}" customHeight="1">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"/></sheetViews><sheetFormatPr defaultRowHeight="22"/><cols>${cols}</cols><sheetData>${body}</sheetData></worksheet>`;
}

/** Builds a real .xlsx workbook: one summary sheet and one sheet per Tehran upload day. */
const tehranGregorian = new Intl.DateTimeFormat("en-CA-u-ca-gregory-nu-latn", {
  timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit",
});
const tehranPersian = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran", year: "numeric", month: "long", day: "numeric", weekday: "long",
});
const weekdayOrder = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekdayFa: Record<string, string> = {
  Saturday: "شنبه", Sunday: "یکشنبه", Monday: "دوشنبه", Tuesday: "سه‌شنبه",
  Wednesday: "چهارشنبه", Thursday: "پنجشنبه", Friday: "جمعه",
};
function parts(formatter: Intl.DateTimeFormat, date: Date): Record<string, string> {
  return Object.fromEntries(formatter.formatToParts(date)
    .filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}
function keyFor(date: Date): string {
  const p = parts(tehranGregorian, date);
  return p.year + "-" + p.month + "-" + p.day;
}
function dateFromKey(key: string): Date { return new Date(key + "T12:00:00Z"); }
function addDays(key: string, amount: number): string {
  const date = dateFromKey(key); date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
function persianParts(key: string) { return parts(tehranPersian, dateFromKey(key)); }
function dayKey(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid report date.");
  return keyFor(date);
}
function asciiDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}
function monthIdentity(key: string) {
  const p = persianParts(key);
  return { year: p.year, month: p.month, monthKey: p.year + "-" + p.month, day: Number(asciiDigits(p.day)) };
}
function daysInPersianMonth(anyDay: string): string[] {
  const identity = monthIdentity(anyDay), center = dateFromKey(anyDay), candidates: string[] = [];
  for (let offset = -35; offset <= 35; offset++) {
    const date = new Date(center); date.setUTCDate(date.getUTCDate() + offset);
    const key = date.toISOString().slice(0, 10);
    if (monthIdentity(key).monthKey === identity.monthKey) candidates.push(key);
  }
  return candidates.sort();
}
function weeklySheet(days: ScannerDailyGroup[], weekStart: string) {
  const weekKeys = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const activity = new Map<string, Set<string>>();
  const weekKeySet = new Set(weekKeys);
  for (const day of days) if (weekKeySet.has(day.date_key)) for (const id of day.ids) {
    const active = activity.get(id) ?? new Set<string>(); active.add(day.date_key); activity.set(id, active);
  }
  const rows = [
    ["Plato ID", ...weekKeys.map((key, index) => weekdayFa[weekdayOrder[index]] + " " + persianParts(key).day)],
    ...[...activity.keys()].sort((a, b) => a.localeCompare(b)).map((id) => [
      id, ...weekKeys.map((key) => activity.get(id)!.has(key) ? "★" : ""),
    ]),
  ];
  const start = persianParts(weekKeys[0]);
  const end = persianParts(weekKeys[6]);
  const weekLabel = "هفته " + start.day + " تا " + end.day + " " + end.month + " " + end.year;
  return { name: weekLabel.slice(0, 31), rows };
}
function monthlySheet(days: ScannerDailyGroup[], anyDay: string) {
  const monthDays = daysInPersianMonth(anyDay), identity = monthIdentity(anyDay), daySet = new Set(monthDays);
  const activity = new Map<string, Set<string>>();
  for (const day of days) if (daySet.has(day.date_key)) for (const id of day.ids) {
    const active = activity.get(id) ?? new Set<string>(); active.add(day.date_key); activity.set(id, active);
  }
  const rows = [
    ["Plato ID", ...monthDays.map((key) => String(persianParts(key).day))],
    ...[...activity.keys()].sort((a, b) => a.localeCompare(b)).map((id) => [
      id, ...monthDays.map((key) => activity.get(id)!.has(key) ? "★" : ""),
    ]),
  ];
  return { name: ("ماه " + identity.year + " " + identity.month).slice(0, 31), rows };
}

/** One Saturday–Friday activity matrix per week and one complete Jalali-month matrix per month. */
export function buildScannerExcelWorkbook(days: ScannerDailyGroup[], periodStart: string, periodEnd: string): Uint8Array {
  const startKey = dayKey(periodStart), endKey = dayKey(periodEnd);
  if (startKey > endKey) throw new Error("Excel report period is invalid.");
  const reportDays = [...new Map(days.map((day) => [day.date_key, day])).values()];
  const summary = {
    name: "خلاصه",
    rows: [
      ["گزارش فعالیت Plato ID", "از", startKey, "تا", endKey],
      ["روزهای دارای گزارش", String(reportDays.length), "تعداد آیدی‌های یکتا", String(new Set(reportDays.flatMap((day) => day.ids)).size)],
      ["ساختار", "هر هفته یک جدول شنبه تا جمعه؛ هر ماه شمسی یک جدول کامل روزانه"],
    ],
  };
  const weeks: Array<{ name: string; rows: string[][] }> = [];
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", weekday: "long" });
  const firstWeekday = weekdayFormatter.format(dateFromKey(startKey));
  const firstOffset = weekdayOrder.indexOf(firstWeekday);
  if (firstOffset < 0) throw new Error("Could not determine report weekday.");
  let cursor = addDays(startKey, -firstOffset);
  while (cursor <= endKey) { weeks.push(weeklySheet(reportDays, cursor)); cursor = addDays(cursor, 7); }
  const monthStarts = new Map<string, string>();
  for (let key = startKey; key <= endKey; key = addDays(key, 1)) {
    const identity = monthIdentity(key);
    if (!monthStarts.has(identity.monthKey)) monthStarts.set(identity.monthKey, key);
  }
  const months = [...monthStarts.values()].map((key) => monthlySheet(reportDays, key));
  const sheets = [summary, ...weeks, ...months];
  const workbookSheets = sheets.map((sheet, index) =>
    '<sheet name="' + xmlEscape(sheet.name.slice(0, 31)) + '" sheetId="' + (index + 1) + '" r:id="rId' + (index + 1) + '"/>'
  ).join("");
  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    sheets.map((_, index) => '<Override PartName="/xl/worksheets/sheet' + (index + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("") + '</Types>';
  const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  const workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + workbookSheets + '</sheets></workbook>';
  const workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    sheets.map((_, index) => '<Relationship Id="rId' + (index + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (index + 1) + '.xml"/>').join("") +
    '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="3"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FF3A2B12"/><name val="Aptos Display"/></font><font><b/><sz val="15"/><color rgb="FFFFC000"/><name val="Aptos Display"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE8A3"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left style="medium"><color rgb="FF777777"/></left><right style="medium"><color rgb="FF777777"/></right><top style="medium"><color rgb="FF777777"/></top><bottom style="medium"><color rgb="FF777777"/></bottom><diagonal/></border><border><left style="medium"><color rgb="FF777777"/></left><right style="medium"><color rgb="FF777777"/></right><top style="medium"><color rgb="FF777777"/></top><bottom style="medium"><color rgb="FF777777"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" alignment="1"/></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  const entries = [
    { name: "[Content_Types].xml", data: bytes(contentTypes) },
    { name: "_rels/.rels", data: bytes(rootRels) },
    { name: "xl/workbook.xml", data: bytes(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: bytes(workbookRels) },
    { name: "xl/styles.xml", data: bytes(styles) },
    ...sheets.map((sheet, index) => ({ name: "xl/worksheets/sheet" + (index + 1) + ".xml", data: bytes(worksheet(sheet.rows)) })),
  ];
  return zipStored(entries);
}
