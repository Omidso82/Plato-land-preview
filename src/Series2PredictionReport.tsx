import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Clock3, Lock, RefreshCw, Users } from 'lucide-react';
import { supabase } from './supabase';
import './Series2PredictionReport.css';

type PredictionVote = {
  voter_plato_id: string;
  selected_plato_id: string;
  created_at: string;
};

type PredictionReport = {
  total_votes: number;
  votes: PredictionVote[];
  is_open: boolean;
  group_stage_complete: boolean;
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'زمان نامعتبر';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    numberingSystem: 'arab',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(date);
}

export default function Series2PredictionReport() {
  const [report, setReport] = useState<PredictionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const inFlight = useRef(false);

  const loadReport = useCallback(async (silent = false) => {
    if (inFlight.current) return;
    if (!supabase) {
      setError('اتصال پایگاه داده در دسترس نیست.');
      setLoading(false);
      return;
    }

    inFlight.current = true;
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error('نشست ورود معتبر نیست؛ دوباره وارد پنل مالک شو.');

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/plato-land-series2-prediction?action=report`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            apikey: supabase.supabaseKey,
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 403) throw new Error('این گزارش فقط برای حساب دارای نقش مالک کل قابل مشاهده است.');
        if (response.status === 401) throw new Error('نشست ورود منقضی شده است؛ دوباره وارد پنل مالک شو.');
        throw new Error(payload?.error || 'دریافت گزارش رأی‌ها ناموفق بود.');
      }

      setReport({
        total_votes: Number(payload.total_votes) || 0,
        votes: Array.isArray(payload.votes) ? payload.votes : [],
        is_open: payload.is_open === true,
        group_stage_complete: payload.group_stage_complete === true,
      });
      setLastUpdated(new Date().toISOString());
      setError('');
    } catch (err: any) {
      setError(err?.message || 'خطای نامشخص هنگام دریافت گزارش رأی‌ها.');
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadReport(false);
    const timer = window.setInterval(() => void loadReport(true), 10000);
    return () => window.clearInterval(timer);
  }, [loadReport]);

  const votes = [...(report?.votes || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <section className="panel admin-panel series2-prediction-report">
      <div className="admin-toolbar series2-prediction-report-toolbar">
        <div>
          <span className="section-kicker">PLATO LAND · SERIES 2</span>
          <h2>گزارش پیش‌بینی قهرمان</h2>
          <p>فهرست خصوصی رأی‌ها؛ فقط مالک کل می‌تواند اطلاعات رأی‌دهندگان را مشاهده کند.</p>
        </div>
        <button
          type="button"
          className="outline-button"
          onClick={() => void loadReport(false)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'series2-report-spin' : ''} />
          بروزرسانی
        </button>
      </div>

      <div className="series2-report-summary">
        <article>
          <Users size={19} />
          <span>تعداد کل رأی‌ها</span>
          <strong>{report ? report.total_votes.toLocaleString('fa-IR') : '—'}</strong>
        </article>
        <article className={report?.is_open ? 'is-open' : 'is-closed'}>
          <Lock size={18} />
          <span>وضعیت پیش‌بینی</span>
          <strong>{report ? (report.is_open ? 'باز' : 'بسته') : '—'}</strong>
        </article>
        <article>
          <Clock3 size={18} />
          <span>آخرین بروزرسانی</span>
          <strong className="series2-report-updated">{lastUpdated ? formatTimestamp(lastUpdated) : '—'}</strong>
        </article>
      </div>

      {error && (
        <div className="series2-report-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && !report ? (
        <div className="empty-state">در حال دریافت گزارش خصوصی رأی‌ها…</div>
      ) : votes.length ? (
        <div className="series2-report-table-wrap">
          <table className="series2-report-table">
            <thead>
              <tr>
                <th>ردیف</th>
                <th>Plato ID رأی‌دهنده</th>
                <th>Plato ID قهرمان انتخاب‌شده</th>
                <th>زمان ثبت رأی</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((vote, index) => (
                <tr key={`${vote.voter_plato_id}-${vote.created_at}`}>
                  <td>{(index + 1).toLocaleString('fa-IR')}</td>
                  <td dir="ltr" className="series2-report-id">{vote.voter_plato_id}</td>
                  <td dir="ltr" className="series2-report-id">{vote.selected_plato_id}</td>
                  <td><time dateTime={vote.created_at}>{formatTimestamp(vote.created_at)}</time></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error ? (
        <div className="empty-state">هنوز رأیی برای پیش‌بینی قهرمان سری دوم ثبت نشده است.</div>
      ) : null}

      <p className="series2-report-footnote">
        بروزرسانی خودکار هر ۱۰ ثانیه انجام می‌شود. زمان‌ها بر اساس منطقهٔ زمانی دستگاهی که پنل را باز کرده نمایش داده می‌شوند.
      </p>
    </section>
  );
}
