import React, { useMemo, useState } from "react";
import {
  formatDailyTelegramMessages,
  formatWeeklyTelegramMessages,
  WEEKDAY_NAMES_FA,
  type DailyScannerReport,
  type WeeklyScannerReport,
} from "./plato-id-scanner-reports";
import {
  appendScannerReportVersion,
  loadDailyScannerReport,
  loadScannerReportVersions,
  loadWeeklyScannerReport,
  type StoredScannerReportVersion,
} from "./plato-id-scanner-review-store";
import {
  tehranJalaliDayWindow,
  tehranSaturdayWeekWindow,
} from "./plato-id-scanner-date-window";

type Props = { client: any; creatorId: string };

function currentTehranJalaliKey(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran", calendar: "persian", numberingSystem: "latn",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  return values.year + "/" + values.month + "/" + values.day;
}

function reportPeriodKey(kind: "daily" | "weekly", report: DailyScannerReport | WeeklyScannerReport): string {
  return kind === "daily"
    ? (report as DailyScannerReport).jalaliDate
    : (report as WeeklyScannerReport).weekStartJalali;
}

function reportText(kind: "daily" | "weekly", report: DailyScannerReport | WeeklyScannerReport): string {
  return kind === "daily"
    ? formatDailyTelegramMessages(report as DailyScannerReport).join("\n\n")
    : formatWeeklyTelegramMessages(report as WeeklyScannerReport).join("\n\n");
}

export default function PlatoIdScannerReportsPanel({ client, creatorId }: Props) {
  const [kind, setKind] = useState<"daily" | "weekly">("daily");
  const [dateKey, setDateKey] = useState(currentTehranJalaliKey);
  const [report, setReport] = useState<DailyScannerReport | WeeklyScannerReport | null>(null);
  const [history, setHistory] = useState<StoredScannerReportVersion[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const periodKey = report ? reportPeriodKey(kind, report) : "";

  const preparedText = useMemo(() => report ? reportText(kind, report) : "", [kind, report]);

  async function loadReport() {
    setBusy(true); setError(""); setNotice(""); setReport(null); setHistory([]);
    try {
      const window = tehranJalaliDayWindow(dateKey);
      const next = kind === "daily"
        ? await loadDailyScannerReport(client, { ...window, jalaliDateKey: dateKey })
        : await loadWeeklyScannerReport(client, {
            ...tehranSaturdayWeekWindow(window.fromInclusive),
            anyDateInWeek: window.fromInclusive,
          });
      setReport(next);
      const key = reportPeriodKey(kind, next);
      const versions = await loadScannerReportVersions(client, kind, key);
      setHistory(versions);
      setNotice("گزارش از آخرین نسخه‌های تأییدشده تصاویر ساخته شد.");
    } catch (e: any) {
      setError(e?.message || "ساخت گزارش ناموفق بود.");
    } finally { setBusy(false); }
  }

  async function saveVersion() {
    if (!report || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const saved = await appendScannerReportVersion(client, {
        reportKind: kind,
        periodKey,
        payload: report as unknown as Record<string, unknown>,
        creatorId,
        note: "نسخه ذخیره‌شده از پنل گزارش PLATO ID",
      });
      setHistory(prev => [...prev, saved]);
      setNotice("نسخه " + saved.version + " گزارش در تاریخچه ذخیره شد.");
    } catch (e: any) {
      setError(e?.message || "ذخیره نسخه گزارش ناموفق بود.");
    } finally { setBusy(false); }
  }

  async function copyPrepared() {
    try {
      await navigator.clipboard.writeText(preparedText);
      setNotice("متن گزارش برای ارسال دستی کپی شد؛ هیچ پیامی به تلگرام ارسال نشده است.");
    } catch {
      setError("کپی خودکار در این مرورگر در دسترس نیست. متن گزارش را دستی انتخاب و کپی کنید.");
    }
  }

  return <section className="scanner-panel scanner-reports-panel">
    <div className="scanner-report-title"><div><span className="scanner-eyebrow">گزارش‌گیری</span><h2>گزارش روزانه و هفتگی</h2></div><span className="scanner-status">Asia/Tehran · تقویم شمسی</span></div>
    <div className="scanner-report-controls">
      <div className="scanner-report-tabs" role="group" aria-label="نوع گزارش">
        <button type="button" className={kind === "daily" ? "active" : ""} onClick={() => { setKind("daily"); setReport(null); setHistory([]); }}>روزانه</button>
        <button type="button" className={kind === "weekly" ? "active" : ""} onClick={() => { setKind("weekly"); setReport(null); setHistory([]); }}>هفتگی (شنبه تا جمعه)</button>
      </div>
      <label>تاریخ شمسی
        <input className="scanner-report-date" dir="ltr" value={dateKey} onChange={e => setDateKey(e.target.value)} placeholder="1405/08/20"/>
      </label>
      <button type="button" className="scanner-primary" disabled={busy || !/^\d{4}\/\d{2}\/\d{2}$/.test(dateKey)} onClick={() => void loadReport()}>{busy ? "در حال پردازش…" : "ساخت پیش‌نمایش گزارش"}</button>
    </div>
    {error && <p className="scanner-review-error" role="alert">{error}</p>}
    {notice && <p className="scanner-report-notice" role="status">{notice}</p>}
    {report && <div className="scanner-report-preview">
      <div className="scanner-report-stats">
        <div><strong>{report.imageCount}</strong><small>تصویر</small></div>
        <div><strong>{kind === "daily" ? (report as DailyScannerReport).ids.length : (report as WeeklyScannerReport).rows.length}</strong><small>{kind === "daily" ? "ID یکتا" : "ID فعال"}</small></div>
      </div>
      {kind === "daily" ? <div className="scanner-report-id-list" dir="ltr">
        {(report as DailyScannerReport).ids.length ? (report as DailyScannerReport).ids.map((id, i) => <div key={id}>{i + 1}. {id}</div>) : <p>برای این تاریخ ID تأییدشده‌ای ثبت نشده است.</p>}
      </div> : <div className="scanner-report-table-wrap"><table className="scanner-report-table" dir="rtl">
        <thead><tr><th>Plato ID</th>{WEEKDAY_NAMES_FA.map(day => <th key={day}>{day.slice(0, 1)}</th>)}</tr></thead>
        <tbody>{(report as WeeklyScannerReport).rows.map(row => <tr key={row.id}><td dir="ltr">{row.id}</td>{row.activeDays.map((active, i) => <td key={i}>{active ? "★" : "·"}</td>)}</tr>)}</tbody>
      </table>{!(report as WeeklyScannerReport).rows.length && <p>برای این هفته فعالیت تأییدشده‌ای ثبت نشده است.</p>}</div>}
      <div className="scanner-report-actions">
        <button type="button" className="scanner-primary" disabled={busy} onClick={() => void saveVersion()}>ذخیره نسخه گزارش</button>
        <button type="button" className="scanner-report-secondary" onClick={() => void copyPrepared()}>کپی متن آماده تلگرام</button>
      </div>
      <p className="scanner-report-disclaimer">این فقط پیش‌نمایش و آماده‌سازی متن است. ارسال تلگرام هنوز فعال نشده است.</p>
      {history.length > 0 && <details className="scanner-review-history" open>
        <summary>تاریخچه نسخه‌های این گزارش ({history.length})</summary>
        {history.map(item => <div className="scanner-history-item" key={item.id}>
          <strong>نسخه {item.version}</strong><small>{new Date(item.created_at).toLocaleString("fa-IR")} · ثبت‌کننده: {item.created_by}</small>
          <p>{item.note || "بدون یادداشت"}</p>
        </div>)}
      </details>}
    </div>}
  </section>;
}
