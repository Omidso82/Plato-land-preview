import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { CheckSquare, RefreshCw, ShieldCheck, Users, Trophy, Newspaper, Gamepad2, AlertTriangle, Eye } from 'lucide-react';

type Target = 'tournaments' | 'news' | 'games' | 'users';
type Operation = 'publish' | 'hide' | 'enable' | 'disable';
type Item = { id: string; title: string; subtitle?: string; state: string; enabled?: boolean; publishAt?: string | null };

const targetLabels: Record<Target,string> = {
  tournaments: 'مسابقات',
  news: 'اخبار و اطلاعیه‌ها',
  games: 'بازی‌ها',
  users: 'کاربران'
};

const operationLabels: Record<Operation,string> = {
  publish: 'انتشار گروهی',
  hide: 'مخفی‌سازی گروهی',
  enable: 'فعال‌سازی گروهی',
  disable: 'غیرفعال‌سازی گروهی'
};

export default function OwnerBulkOperations() {
  const [target,setTarget] = useState<Target>('tournaments');
  const [items,setItems] = useState<Record<Target,Item[]>>({tournaments:[],news:[],games:[],users:[]});
  const [selected,setSelected] = useState<Record<Target,string[]>>({tournaments:[],news:[],games:[],users:[]});
  const [operation,setOperation] = useState<Operation>('publish');
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [previewOpen,setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) { setError('اتصال به پایگاه داده برقرار نیست.'); return; }
    setLoading(true); setError('');
    try {
      const [t,n,g,p] = await Promise.all([
        supabase.from('tournaments').select('id,title,game_type,status').order('created_at',{ascending:false}),
        supabase.from('site_news').select('id,title,status,publish_at').order('created_at',{ascending:false}),
        supabase.from('site_games').select('id,name,slug,enabled').order('sort_order').order('name'),
        supabase.from('profiles').select('id,display_name,plato_id').order('created_at',{ascending:false})
      ]);
      if (t.error) throw t.error;
      if (n.error) throw n.error;
      if (g.error) throw g.error;
      if (p.error) throw p.error;
      setSelected({tournaments:[],news:[],games:[],users:[]});
      setPreviewOpen(false);
      setItems({
        tournaments:(t.data||[]).map((x:any)=>({id:x.id,title:x.title||'مسابقه بدون عنوان',subtitle:x.game_type||'',state:x.status||'unknown'})),
        news:(n.data||[]).map((x:any)=>({id:x.id,title:x.title||'خبر بدون عنوان',state:x.status||'draft',publishAt:x.publish_at||null})),
        games:(g.data||[]).map((x:any)=>({id:x.id,title:x.name||x.slug||'بازی بدون نام',state:x.enabled?'فعال':'غیرفعال',enabled:!!x.enabled})),
        users:(p.data||[]).map((x:any)=>({id:x.id,title:x.display_name||'نام ثبت نشده',subtitle:x.plato_id||'بدون Plato ID',state:'حساب کاربری'}))
      });
    } catch (e:any) {
      setError(e?.message||'بارگذاری فهرست عملیات گروهی ناموفق بود.');
    } finally { setLoading(false); }
  },[]);

  useEffect(()=>{ void load(); },[load]);

  const currentItems = items[target];
  const selectedIds = selected[target];
  const allowedOperations = useMemo<Operation[]>(()=>{
    if (target==='tournaments' || target==='news') return ['publish','hide'];
    if (target==='games') return ['enable','disable'];
    return [];
  },[target]);

  useEffect(()=>{
    if (allowedOperations.length && !allowedOperations.includes(operation)) setOperation(allowedOperations[0]);
    setPreviewOpen(false);
  },[target,allowedOperations,operation]);

  const actionable = useMemo(()=>currentItems.filter(item=>selectedIds.includes(item.id)).filter(item=>{
    if (target==='tournaments') return operation==='publish' ? item.state==='draft' : operation==='hide' ? item.state==='published' : false;
    if (target==='news') return operation==='publish' ? item.state==='draft' && (!item.publishAt || new Date(item.publishAt).getTime()<=Date.now()) : operation==='hide' ? item.state==='published' : false;
    if (target==='games') return operation==='enable' ? item.enabled===false : operation==='disable' ? item.enabled===true : false;
    return false;
  }),[currentItems,selectedIds,target,operation]);

  const unchangedCount = selectedIds.length-actionable.length;

  function toggleItem(id:string,checked:boolean) {
    setSelected(old=>({...old,[target]:checked?[...old[target],id]:old[target].filter(x=>x!==id)}));
    setPreviewOpen(false);
    setMessage('');
  }

  function selectAll(checked:boolean) {
    setSelected(old=>({...old,[target]:checked?currentItems.map(x=>x.id):[]}));
    setPreviewOpen(false);
    setMessage('');
  }

  function clearSelection() {
    setSelected(old=>({...old,[target]:[]}));
    setPreviewOpen(false);
  }

  function preview() {
    if (!selectedIds.length) { setError('ابتدا حداقل یک مورد را انتخاب کن.'); return; }
    if (!allowedOperations.length) { setError('برای این دسته هنوز عملیات گروهی امن و تأییدشده تعریف نشده است.'); return; }
    if (!actionable.length) { setError('هیچ‌کدام از موارد انتخاب‌شده نیاز به این تغییر ندارند.'); return; }
    setError(''); setMessage(''); setPreviewOpen(true);
  }

  async function execute() {
    if (!supabase || !previewOpen || !actionable.length) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('نشست مالک معتبر نیست.');
      const ids = actionable.map(x=>x.id);
      let result:any;
      let table = '';
      let actionLabel = '';
      if (target==='tournaments') {
        table='tournaments';
        const nextStatus=operation==='publish'?'published':'draft';
        const expected=operation==='publish'?'draft':'published';
        actionLabel=operationLabels[operation];
        result=await supabase.from(table).update({status:nextStatus,updated_at:new Date().toISOString()}).in('id',ids).eq('status',expected).select('id');
      } else if (target==='news') {
        table='site_news';
        actionLabel=operationLabels[operation];
        const payload=operation==='publish'
          ? {status:'published',published_at:new Date().toISOString(),updated_at:new Date().toISOString()}
          : {status:'draft',updated_at:new Date().toISOString()};
        const expected=operation==='publish'?'draft':'published';
        result=await supabase.from(table).update(payload).in('id',ids).eq('status',expected).select('id');
      } else if (target==='games') {
        table='site_games';
        actionLabel=operationLabels[operation];
        const nextEnabled=operation==='enable';
        result=await supabase.from(table).update({enabled:nextEnabled,updated_at:new Date().toISOString()}).in('id',ids).eq('enabled',!nextEnabled).select('id');
      } else {
        throw new Error('برای حساب‌های کاربری، تغییر گروهی وضعیت یا نقش تا زمان تعریف مسیر امن مدیریت Auth غیرفعال است.');
      }
      if (result.error) throw result.error;
      const affectedIds=(result.data||[]).map((x:any)=>x.id);
      if (!affectedIds.length) throw new Error('هیچ رکوردی تغییر نکرد؛ احتمالاً وضعیت موارد از زمان پیش‌نمایش عوض شده است. فهرست را تازه‌سازی کن.');
      const auditResult=await supabase.from('audit_logs').insert({
        actor_id:user.id,
        action:'bulk_update',
        entity_type:'bulk_operations',
        entity_id:crypto.randomUUID(),
        details:{
          target_table:table,
          operation,
          selected_count:ids.length,
          affected_count:affectedIds.length,
          affected_ids:affectedIds
        }
      });
      await load();
      clearSelection();
      setPreviewOpen(false);
      if (auditResult.error) {
        setMessage(affectedIds.length.toLocaleString('fa-IR')+' مورد تغییر کرد؛ رویدادهای ردیفی ثبت شدند، اما خلاصه عملیات گروهی ذخیره نشد. گزارش خطا: '+auditResult.error.message);
      } else {
        setMessage(operationLabels[operation]+' با موفقیت برای '+affectedIds.length.toLocaleString('fa-IR')+' مورد اجرا و در تاریخچه مدیریتی ثبت شد.');
      }
    } catch (e:any) {
      setError(e?.message||'اجرای عملیات گروهی ناموفق بود.');
    } finally { setBusy(false); }
  }

  return <section className="panel owner-bulk-operations">
    <div className="admin-toolbar">
      <div><span className="section-kicker">ابزارهای مدیریتی مالک</span><h2>مدیریت عملیات گروهی</h2><p>موارد را انتخاب کن، اثر تغییر را ببین و فقط پس از تأیید نهایی اجرا کن.</p></div>
      <CheckSquare size={24}/>
    </div>
    <div className="bulk-safety-note"><ShieldCheck size={17}/><span>این بخش فقط در پنل مالک در دسترس است. هیچ موردی حذف نمی‌شود و تغییرات در پایگاه داده اصلی ثبت می‌شوند.</span></div>
    <div className="bulk-controls">
      <label>نوع اطلاعات<select value={target} onChange={e=>{setTarget(e.target.value as Target);setError('');setMessage('')}}><option value="tournaments">مسابقات</option><option value="news">اخبار و اطلاعیه‌ها</option><option value="games">بازی‌ها</option><option value="users">کاربران</option></select></label>
      {allowedOperations.length>0&&<label>عملیات مشترک<select value={operation} onChange={e=>setOperation(e.target.value as Operation)}>{allowedOperations.map(op=><option key={op} value={op}>{operationLabels[op]}</option>)}</select></label>}
      <button type="button" className="outline-button" onClick={()=>void load()} disabled={loading||busy}><RefreshCw size={15}/> تازه‌سازی</button>
    </div>
    {target==='users'&&<div className="bulk-limitation"><AlertTriangle size={17}/><span>انتخاب کاربران و مشاهده فهرست در دسترس است؛ اما تغییر گروهی نقش یا فعال/غیرفعال‌کردن حساب‌ها فعلاً اجرا نمی‌شود، چون فیلد وضعیت حساب و مسیر امن مدیریت Auth در این نسخه تعریف نشده است. برای جلوگیری از تغییر دسترسی اشتباه، هیچ عملیات حدسی انجام نمی‌شود.</span></div>}
    {error&&<p className="auth-inline-error" role="alert">{error}</p>}
    {message&&<p className="bulk-success" role="status">{message}</p>}
    {loading?<div className="empty-state">در حال دریافت اطلاعات…</div>:currentItems.length===0?<div className="empty-state">موردی برای نمایش وجود ندارد.</div>:<>
      <div className="bulk-list-toolbar"><label className="check-row"><input type="checkbox" checked={currentItems.length>0&&selectedIds.length===currentItems.length} onChange={e=>selectAll(e.target.checked)} disabled={busy}/><span>انتخاب همهٔ موارد ({currentItems.length.toLocaleString('fa-IR')})</span></label><span>انتخاب‌شده: {selectedIds.length.toLocaleString('fa-IR')}</span><button type="button" className="text-link" onClick={clearSelection} disabled={!selectedIds.length}>پاک‌کردن انتخاب</button>{allowedOperations.length>0&&<button type="button" className="gold-button" onClick={preview} disabled={!selectedIds.length||busy}>پیش‌نمایش عملیات</button>}</div>
      <div className="bulk-item-list">{currentItems.map(item=><label className="bulk-item" key={item.id}><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={e=>toggleItem(item.id,e.target.checked)} disabled={busy}/><span className="bulk-item-copy"><strong>{item.title}</strong>{item.subtitle&&<small>{item.subtitle}</small>}</span><span className="bulk-item-state">{item.state}</span></label>)}</div>
    </>}
    {previewOpen&&<section className="bulk-preview" aria-live="polite"><div className="section-heading"><div><span className="section-kicker">پیش‌نمایش قبل از اجرا</span><h3>{operationLabels[operation]}</h3></div><Eye size={20}/></div><p>تعداد انتخاب‌شده: <strong>{selectedIds.length.toLocaleString('fa-IR')}</strong> · تعداد قابل تغییر: <strong>{actionable.length.toLocaleString('fa-IR')}</strong> · بدون تغییر: <strong>{unchangedCount.toLocaleString('fa-IR')}</strong></p><ul>{actionable.map(item=><li key={item.id}>{item.title}</li>)}</ul><p className="form-footnote">این عملیات فقط وضعیت انتشار/فعال‌بودن موارد بالا را تغییر می‌دهد؛ متن، قوانین، نتایج، ثبت‌نام‌ها، نقش‌ها و داده‌های دیگر دست‌نخورده می‌مانند.</p><div className="bulk-preview-actions"><button type="button" className="outline-button" onClick={()=>setPreviewOpen(false)} disabled={busy}>بازگشت و اصلاح انتخاب</button><button type="button" className="gold-button" onClick={()=>void execute()} disabled={busy}>{busy?'در حال اجرا…':'تأیید و اجرای عملیات'}</button></div></section>}
  </section>;
}
