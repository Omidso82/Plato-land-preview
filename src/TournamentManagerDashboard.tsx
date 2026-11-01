import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime } from './iranDate';
import { ClipboardList, ExternalLink, RefreshCw, Trash2, ShieldCheck } from 'lucide-react';
import CompetitionVisuals from './CompetitionVisuals';

const registrationStatusLabel:Record<string,string>={pending:'در انتظار بررسی',approved:'تأیید شده',registered:'تأیید شده',rejected:'رد شده',withdrawn:'انصراف داده'};
const allManagerSections=['registrations','groups','schedule','results'];

type Row = {
  id: string; tournament_id: string; status: string; registration_type: string;
  is_reserve: boolean; reserve_position: number | null; slot_count: number; display_name: string | null;
  plato_id: string | null; team_name: string | null; created_at: string;
  evidenceUrl?: string; evidencePath?: string; members?: { display_name: string; plato_id: string; is_captain: boolean }[];
};

export default function TournamentManagerDashboard({ owner = false }: { owner?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [tournaments, setTournaments] = useState<Record<string,{title:string;capacity:number|null;capacityUnit:string}>>({});
  const [permissionsByTournament,setPermissionsByTournament]=useState<Record<string,string[]>>({});
  const [competitionTournaments,setCompetitionTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    if (!supabase) { setLoading(false); setError('اتصال پایگاه داده برقرار نیست.'); return; }
    setLoading(true); setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('برای مشاهده پنل، وارد حساب مدیر شوید.');

      let ids: string[] = [];
      const permissionMap:Record<string,string[]>={};
      if (owner) {
        const { data: tsAll, error: tsAllError } = await supabase.from('tournaments').select('id,title,capacity,platform_settings,game_type,series_name,status,registration_open');
        if (tsAllError) throw tsAllError;
        ids = (tsAll || []).map((x: any) => x.id);
        ids.forEach(id=>permissionMap[id]=allManagerSections);
      } else {
        const { data: assigned, error: assignedError } = await supabase
          .from('tournament_manager_access').select('tournament_id,permissions_configured').eq('user_id', user.id);
        if (assignedError) throw assignedError;
        ids = (assigned || []).map((x: any) => x.tournament_id);
        const configuredIds=(assigned||[]).filter((x:any)=>x.permissions_configured).map((x:any)=>x.tournament_id);
        let permissionRows:any[]=[];
        if(configuredIds.length){
          const {data,error:permissionError}=await supabase.from('tournament_manager_section_permissions').select('tournament_id,permission_key').eq('user_id',user.id).in('tournament_id',configuredIds);
          if(permissionError)throw permissionError;
          permissionRows=data||[];
        }
        (assigned||[]).forEach((item:any)=>{
          permissionMap[item.tournament_id]=item.permissions_configured
            ? permissionRows.filter(p=>p.tournament_id===item.tournament_id).map(p=>p.permission_key)
            : allManagerSections;
        });
      }
      setPermissionsByTournament(permissionMap);
      if (!ids.length) { setRows([]); setTournaments({}); setCompetitionTournaments([]); return; }

      const { data: ts, error: tsError } = await supabase.from('tournaments')
        .select('id,title,capacity,platform_settings,game_type,series_name,status,registration_open')
        .in('id', ids);
      if (tsError) throw tsError;

      const registrationIds=ids.filter(id=>permissionMap[id]?.includes('registrations'));
      let regs:any[]=[];
      if(registrationIds.length){
        const {data,error:regsError}=await supabase.from('registrations')
          .select('id,tournament_id,status,registration_type,is_reserve,reserve_position,slot_count,display_name,plato_id,team_name,created_at')
          .in('tournament_id',registrationIds).order('created_at',{ascending:true});
        if(regsError)throw regsError;
        regs=regs||[];
        regs= data||[];
      }
      const {data:evidence,error:evidenceError}=regs.length
        ? await supabase.from('registration_evidence').select('registration_id,storage_path').in('registration_id',regs.map((r:any)=>r.id))
        : {data:[],error:null};
      if(evidenceError)throw evidenceError;
      const {data:members,error:membersError}=regs.length
        ? await supabase.from('registration_members').select('registration_id,display_name,plato_id,is_captain').in('registration_id',regs.map((r:any)=>r.id))
        : {data:[],error:null};
      if(membersError)throw membersError;

      setTournaments(Object.fromEntries((ts||[]).map((t:any)=>[t.id,{title:t.title,capacity:t.capacity,capacityUnit:t.platform_settings?.capacity_unit||'players'}])));
      setCompetitionTournaments((ts||[]).filter((t:any)=>permissionMap[t.id]?.includes('groups')).map((t:any)=>({
        id:t.id,title:t.title,game:t.game_type||'تخته‌نرد',progression:t.platform_settings?.progression||'groups_knockout',
        seedingMetric:t.platform_settings?.seedingMetric||'wins',seedingOrder:t.platform_settings?.seedingOrder||'desc',
        qualifiersPerGroup:String(t.platform_settings?.qualifiersPerGroup||'2'),
        publicSeeding:t.platform_settings?.publicSeeding!==false,publicDraw:t.platform_settings?.publicDraw!==false,
        publicTables:t.platform_settings?.publicTables!==false,publicBracket:t.platform_settings?.publicBracket!==false,
        status:t.status==='draft'?'پیش‌نویس':t.registration_open?'در حال ثبت‌نام':'بسته'
      })));

      const evidenceMap = new Map((evidence || []).map((e: any) => [e.registration_id, e.storage_path]));
      const membersMap = new Map<string, any[]>();
      (members || []).forEach((m: any) => membersMap.set(m.registration_id, [...(membersMap.get(m.registration_id) || []), m]));
      const hydrated = await Promise.all(regs.map(async (r: any) => {
        const path = evidenceMap.get(r.id);
        let evidenceUrl = '';
        if (path) {
          const { data, error } = await supabase.storage.from('registration-evidence').createSignedUrl(path, 900);
          if (!error) evidenceUrl = data?.signedUrl || '';
        }
        return { ...r, evidenceUrl, evidencePath: path || '', members: membersMap.get(r.id) || [] };
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

  async function removeRegistration(row: Row) {
    if (!supabase) return;
    const label = row.registration_type === 'team'
      ? 'تیم «' + (row.team_name || 'بدون نام') + '»'
      : 'بازیکن «' + (row.display_name || row.plato_id || 'بدون نام') + '»';
    if (!window.confirm(label + ' از این مسابقه حذف شود؟ این کار ثبت‌نام و اعضای تیم را از مسابقه حذف می‌کند و ظرفیت آزادشده به نفر ذخیره بعدی می‌رسد.')) return;
    setBusy(row.id); setError('');
    try {
      const { data: storagePath, error: removeError } = await supabase.rpc('remove_tournament_registration', {
        p_registration_id: row.id
      });
      if (removeError) throw removeError;
      let cleanupWarning='';
      if (storagePath) {
        const { error: storageError } = await supabase.storage.from('registration-evidence').remove([storagePath]);
        if (storageError) cleanupWarning='ثبت‌نام حذف شد، اما پاک‌سازی فایل خصوصی تصویر با خطا روبه‌رو شد: ' + storageError.message;
      }
      await load();
      if(cleanupWarning)setError(cleanupWarning);
    } catch (e: any) { setError(e?.message || 'حذف ثبت‌نام از مسابقه ناموفق بود.'); }
    finally { setBusy(''); }
  }

  const assignedIds = Object.keys(tournaments);
  return <section className="panel admin-panel manager-dashboard">
    <div className="admin-toolbar">
      <div><span className="section-kicker">{owner ? 'پنل مالک سایت' : 'پنل مدیر مسابقه'}</span><h2>{owner ? 'درخواست‌های ثبت‌نام همه مسابقات' : 'مسابقات واگذارشده به من'}</h2>
      <p>{owner ? 'مدیریت درخواست‌ها، گروه‌بندی و نتایج در همه مسابقات.' : 'فقط بخش‌هایی نمایش داده می‌شوند که مالک برای هر مسابقه به شما واگذار کرده است.'}</p></div>
      <button type="button" className="outline-button" onClick={() => void load()} disabled={loading}><RefreshCw size={15}/> بروزرسانی</button>
    </div>
    {loading ? <p className="empty-state">در حال دریافت اطلاعات…</p> : error ? <p className="auth-inline-error">{error}</p> :
      !assignedIds.length ? <p className="empty-state">هنوز مسابقه‌ای به حساب شما واگذار نشده است.</p> :
      assignedIds.map(id => {
        const list = rows.filter(r => r.tournament_id === id);
        const allowed=permissionsByTournament[id]||[];
        const canManageRegistrations=owner||allowed.includes('registrations');
        const canManageGroups=owner||allowed.includes('groups');
        const used = list.filter(r => !r.is_reserve && ['pending','approved','registered'].includes(r.status)).reduce((n,r) => n + (r.slot_count || 1), 0);
        const meta = tournaments[id];
        return <section className="settings-section" key={id}>
          <h3>{meta?.title}</h3>
          {canManageRegistrations
            ? <><p>{list.length} درخواست ثبت‌نام · {list.filter(r => r.is_reserve).length} در صف ذخیره · ظرفیت: {meta?.capacity ? used + ' از ' + meta.capacity + (meta.capacityUnit === 'teams' ? ' تیم' : ' بازیکن') : 'نامحدود'}</p>
              {!list.length ? <p className="empty-state">درخواستی ثبت نشده است.</p> : list.map(r =>
                <div className="registration-row" key={r.id}>
                  <div className="player-data">
                    <strong>{r.registration_type === 'team' ? 'تیم: ' + (r.team_name || 'بدون نام') : r.display_name || 'بازیکن'}</strong>
                    <span>Plato ID: {r.plato_id || '—'} · {registrationStatusLabel[r.status]||'وضعیت نامشخص'}</span>
                    <small>زمان ثبت درخواست: {formatIranDateTime(r.created_at)}</small>
                    {r.registration_type === 'team' && r.members?.map((m, index) => <small key={m.plato_id}>عضو {index + 1}: {m.display_name} · {m.plato_id}{m.is_captain ? ' (سرگروه)' : ''}</small>)}
                    {r.is_reserve && <small>صف ذخیره · نوبت {r.reserve_position || '—'}</small>}
                    {r.evidenceUrl && <a href={r.evidenceUrl} target="_blank" rel="noreferrer"><ExternalLink size={13}/> مشاهده تصویر خصوصی</a>}
                  </div>
                  <div className="registration-actions">
                    {r.status === 'pending' && <>
                      {!r.is_reserve && <button type="button" disabled={busy === r.id} onClick={() => void review(r.id, true)}>تأیید</button>}
                      <button type="button" className="reject-button" disabled={busy === r.id} onClick={() => void review(r.id, false)}>رد</button>
                    </>}
                    <button type="button" className="reject-button" disabled={busy === r.id} onClick={() => void removeRegistration(r)}><Trash2 size={13}/> حذف از مسابقه</button>
                  </div>
                </div>
              )}</>
            : <p className="info-note"><ShieldCheck size={15}/> دسترسی مدیریت ثبت‌نام و مشاهده مدارک برای این مسابقه به حساب شما واگذار نشده است.</p>}
          {!canManageGroups&&<p className="info-note"><ShieldCheck size={15}/> دسترسی گروه‌بندی و قرعه‌کشی برای این مسابقه به حساب شما واگذار نشده است.</p>}
        </section>;
      })
    }
    {competitionTournaments.length>0&&<div className="manager-competition-tools"><CompetitionVisuals tournaments={competitionTournaments}/></div>}
    <div className="form-footnote"><ClipboardList size={14}/> مجوزهای ثبت‌نام، گروه‌بندی، زمان‌بندی و نتایج برای هر مسابقه جداگانه در دیتابیس کنترل می‌شوند.</div>
  </section>;
}
