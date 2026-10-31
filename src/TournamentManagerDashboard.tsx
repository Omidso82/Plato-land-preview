import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { ClipboardList, ExternalLink, RefreshCw } from 'lucide-react';

type Row = {
  id: string; tournament_id: string; status: string; registration_type: string;
  is_reserve: boolean; reserve_position: number | null; slot_count: number; display_name: string | null;
  plato_id: string | null; team_name: string | null; created_at: string;
  evidenceUrl?: string; members?: { display_name: string; plato_id: string; is_captain: boolean }[];
};

export default function TournamentManagerDashboard({ owner = false }: { owner?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [tournaments, setTournaments] = useState<Record<string,{title:string;capacity:number|null;capacityUnit:string}>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    if (!supabase) return;
    setLoading(true); setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('برای مشاهده پنل، وارد حساب مدیر شوید.');
      let ids: string[] = [];
      if (owner) {
        const { data: tsAll, error: tsAllError } = await supabase.from('tournaments').select('id,title,capacity,platform_settings');
        if (tsAllError) throw tsAllError;
        ids = (tsAll || []).map((x: any) => x.id);
      } else {
        const { data: assigned, error: assignedError } = await supabase
          .from('tournament_manager_access').select('tournament_id').eq('user_id', user.id);
        if (assignedError) throw assignedError;
        ids = (assigned || []).map((x: any) => x.tournament_id);
      }
      if (!ids.length) { setRows([]); setTournaments({}); return; }
      const [{ data: ts, error: tsError }, { data: regs, error: regsError }] = await Promise.all([
        supabase.from('tournaments').select('id,title,capacity,platform_settings').in('id', ids),
        supabase.from('registrations').select('id,tournament_id,status,registration_type,is_reserve,reserve_position,slot_count,display_name,plato_id,team_name,created_at').in('tournament_id', ids).order('created_at', { ascending: true })
      ]);
      if (tsError) throw tsError;
      if (regsError) throw regsError;
      setTournaments(Object.fromEntries((ts || []).map((t: any) => [t.id, {title:t.title,capacity:t.capacity,capacityUnit:t.platform_settings?.capacity_unit || 'players'}])));
      const [{ data: evidence, error: evidenceError }, { data: members, error: membersError }] = await Promise.all([
        supabase.from('registration_evidence').select('registration_id,storage_path').in('registration_id', (regs || []).map((r: any) => r.id)),
        supabase.from('registration_members').select('registration_id,display_name,plato_id,is_captain').in('registration_id', (regs || []).map((r: any) => r.id))
      ]);
      if (evidenceError) throw evidenceError;
      if (membersError) throw membersError;
      const evidenceMap = new Map((evidence || []).map((e: any) => [e.registration_id, e.storage_path]));
      const membersMap = new Map<string, any[]>();
      (members || []).forEach((m: any) => membersMap.set(m.registration_id, [...(membersMap.get(m.registration_id) || []), m]));
      const hydrated = await Promise.all((regs || []).map(async (r: any) => {
        const path = evidenceMap.get(r.id);
        let evidenceUrl = '';
        if (path) {
          const { data, error } = await supabase.storage.from('registration-evidence').createSignedUrl(path, 900);
          if (!error) evidenceUrl = data?.signedUrl || '';
        }
        return { ...r, evidenceUrl, members: membersMap.get(r.id) || [] };
      }));
      setRows(hydrated);
    } catch (e: any) { setError(e?.message || 'بارگذاری پنل مدیر ناموفق بود.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [owner]);

  async function review(id: string, approved: boolean) {
    if (!supabase) return;
    setBusy(id); setError('');
    try {
      const { error } = await supabase.rpc('review_tournament_registration', {
        p_registration_id: id, p_approved: approved
      });
      if (error) throw error;
      await load();
    } catch (e: any) { setError(e?.message || 'ثبت نتیجه بررسی ناموفق بود.'); }
    finally { setBusy(''); }
  }

  const assignedIds = Object.keys(tournaments);
  return <section className="panel admin-panel manager-dashboard">
    <div className="admin-toolbar">
      <div><span className="section-kicker">{owner ? 'پنل مالک سایت' : 'پنل مدیر مسابقه'}</span><h2>{owner ? 'درخواست‌های ثبت‌نام همه مسابقات' : 'مسابقات واگذارشده به من'}</h2>
      <p>{owner ? 'مدیریت درخواست‌ها و مدارک ثبت‌نام در همه مسابقات.' : 'فقط مسابقاتی را می‌بینید که مالک سایت به شما واگذار کرده است. تنظیمات سراسری و مدیریت کاربران در دسترس نیست.'}</p></div>
      <button type="button" className="outline-button" onClick={() => void load()} disabled={loading}><RefreshCw size={15}/> بروزرسانی</button>
    </div>
    {loading ? <p className="empty-state">در حال دریافت اطلاعات…</p> : error ? <p className="auth-inline-error">{error}</p> :
      !assignedIds.length ? <p className="empty-state">هنوز مسابقه‌ای به حساب شما واگذار نشده است.</p> :
      assignedIds.map(id => {
        const list = rows.filter(r => r.tournament_id === id);
        const used = list.filter(r => !r.is_reserve && ['pending','approved','registered'].includes(r.status)).reduce((n,r) => n + (r.slot_count || 1), 0);
        const meta = tournaments[id];
        return <section className="settings-section" key={id}>
          <h3>{meta?.title}</h3><p>{list.length} درخواست ثبت‌نام · {list.filter(r => r.is_reserve).length} در صف ذخیره · ظرفیت: {meta?.capacity ? used + ' از ' + meta.capacity + (meta.capacityUnit === 'teams' ? ' تیم' : ' بازیکن') : 'نامحدود'}</p>
          {!list.length ? <p className="empty-state">درخواستی ثبت نشده است.</p> : list.map(r =>
            <div className="registration-row" key={r.id}>
              <div className="player-data">
                <strong>{r.registration_type === 'team' ? 'تیم: ' + (r.team_name || 'بدون نام') : r.display_name || 'بازیکن'}</strong>
                <span>Plato ID: {r.plato_id || '—'} · {r.status}</span>
                {r.registration_type === 'team' && r.members?.map((m, index) => <small key={m.plato_id}>عضو {index + 1}: {m.display_name} · {m.plato_id}{m.is_captain ? ' (سرگروه)' : ''}</small>)}
                {r.is_reserve && <small>صف ذخیره · نوبت {r.reserve_position || '—'}</small>}
                {r.evidenceUrl && <a href={r.evidenceUrl} target="_blank" rel="noreferrer"><ExternalLink size={13}/> مشاهده تصویر خصوصی</a>}
              </div>
              {r.status === 'pending' && <div className="registration-actions">
                {!r.is_reserve && <button type="button" disabled={busy === r.id} onClick={() => void review(r.id, true)}>تأیید</button>}
                <button type="button" className="reject-button" disabled={busy === r.id} onClick={() => void review(r.id, false)}>رد</button>
              </div>}
            </div>
          )}
        </section>;
      })
    }
    <div className="form-footnote"><ClipboardList size={14}/> دسترسی و بررسی درخواست‌ها در سمت دیتابیس نیز به همین مسابقات محدود شده است.</div>
  </section>;
}