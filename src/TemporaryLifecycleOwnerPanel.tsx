import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
type SeriesRow={series_number:number;series_name:string;lifecycle_status:string;registration_status:string;has_hold:boolean};
type Series3StrictPreflight={ready_for_approval:boolean;matched_knockout:number;expected_knockout:number;third_place_completed:number;extra_results:number;reason:string};
type ReadinessRow={series_number:number;group_total:number;group_pending:number;knockout_result_count:number;knockout_expected:number|null;knockout_draw_exists:boolean;third_place_result_count:number|null;ready_for_archive:boolean;reason:string};
export default function TemporaryLifecycleOwnerPanel(){
 const [rows,setRows]=useState<SeriesRow[]>([]);
 const [readiness,setReadiness]=useState<ReadinessRow[]>([]);
 const [series3Strict,setSeries3Strict]=useState<Series3StrictPreflight|null>(null);
 const [reason,setReason]=useState<Record<number,string>>({});
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const refresh=useCallback(async()=>{
  if(!supabase){setError('اتصال دیتابیس در دسترس نیست.');setLoading(false);return;}
  setLoading(true);
  const [overview,preflight,strict]=await Promise.all([supabase.rpc('plato_temp_owner_lifecycle_overview'),supabase.rpc('plato_temp_owner_lifecycle_readiness'),supabase.rpc('plato_temp_owner_series3_completion_preflight')]);
  if(overview.error||preflight.error||strict.error){setError(overview.error?.message||preflight.error?.message||strict.error?.message||'خطا در دریافت اطلاعات');setLoading(false);return;}
  setError('');
  setRows(Array.isArray(overview.data)?overview.data as SeriesRow:[]);
  setReadiness(Array.isArray(preflight.data)?preflight.data as ReadinessRow:[]);
  setSeries3Strict(strict.data && typeof strict.data==='object' && !Array.isArray(strict.data)?strict.data as Series3StrictPreflight:null);
  setLoading(false);
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function restore(series:SeriesRow){
  const why=(reason[series.series_number]||'').trim();
  if(why.length<5){setError('دلیل بازگردانی باید حداقل پنج نویسه باشد.');return;}
  if(!supabase||busy||series.lifecycle_status!=='archived')return;
  if(!window.confirm('آیا بازگردانی '+series.series_name+' به Active را تأیید می‌کنید؟ ثبت‌نام باز نخواهد شد.'))return;
  setBusy(true);setError('');setNotice('');
  const {error:e}=await supabase.rpc('plato_temp_owner_restore_active',{
   p_series_number:series.series_number,p_reason:why,p_correlation_id:crypto.randomUUID()
  });
  if(e)setError(e.message);
  else {setNotice('بازگردانی ثبت شد. ثبت‌نام و نتایج بدون تغییر باقی ماندند.');await refresh();}
  setBusy(false);
 }
 return <section dir="rtl" style={{padding:16,border:'1px solid #b18b45',borderRadius:14,background:'#161513',color:'#f6e8c5'}}>
  <h3 style={{marginTop:0}}>چرخه عمر مسابقات</h3>
  <p style={{fontSize:13,color:'#c9c0ad'}}>وضعیت رسمی هر سری مستقل از باز یا بسته بودن ثبت‌نام است. بازگردانی فقط برای سری‌های آرشیوشده فعال می‌شود.</p>
  <button type="button" onClick={()=>void refresh()} disabled={busy||loading}>به‌روزرسانی وضعیت</button>
  {loading&&<p role="status">در حال دریافت وضعیت معتبر مسابقات…</p>}
  {error&&<p role="alert" style={{color:'#ffaaa4'}}>{error}</p>}
  {notice&&<p role="status">{notice}</p>}
  {!loading&&!error&&rows.length===0&&<p>سری ثبت‌شده‌ای پیدا نشد.</p>}
  {rows.map(s=><div key={s.series_number} style={{padding:'12px 0',borderBottom:'1px solid #574a32'}}>
   <strong>{s.series_name}</strong>
   <p style={{margin:'6px 0',fontSize:13}}>وضعیت: {s.lifecycle_status} · ثبت‌نام: {s.registration_status}{s.has_hold?' · توقف آرشیو خودکار':''}</p>
   {readiness.filter(r=>r.series_number===s.series_number).map(r=><p key={r.series_number} style={{margin:'6px 0',fontSize:12,color:'#c9c0ad'}}>گروهی: {r.group_total} بازی، {r.group_pending} تعیین‌تکلیف‌نشده · براکت: {r.knockout_draw_exists?'ثبت‌شده':'ثبت‌نشده'} · نتایج حذفی: {r.knockout_result_count}{r.knockout_expected===null?'':` از ${r.knockout_expected}`} · رده‌بندی: {r.third_place_result_count??'نیازمند بررسی'} · آرشیو خودکار: غیرفعال تا تأیید نهایی</p>)}
   {s.series_number===3&&series3Strict&&<p style={{margin:'6px 0',fontSize:12,color:'#c9c0ad'}}>تطبیق رسمی براکت و نتایج: {series3Strict.matched_knockout}/{series3Strict.expected_knockout} · رده‌بندی تأییدشده: {series3Strict.third_place_completed} · نتایج خارج از براکت: {series3Strict.extra_results} · آمادگی بررسی نهایی: {series3Strict.ready_for_approval?'آماده بررسی مدیر':'هنوز ناقص'}</p>}
   {s.lifecycle_status==='archived'&&<div style={{display:'grid',gap:8}}>
    <label htmlFor={'restore-reason-'+s.series_number}>دلیل بازگردانی</label>
    <textarea id={'restore-reason-'+s.series_number} rows={2} value={reason[s.series_number]||''} onChange={e=>setReason(v=>({...v,[s.series_number]:e.target.value}))} />
    <button type="button" disabled={busy||(reason[s.series_number]||'').trim().length<5} onClick={()=>void restore(s)}>بازگردانی به Active</button>
   </div>}
  </div>)}
 </section>;
}
