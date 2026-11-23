import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
type SeriesRow={series_number:number;series_name:string;lifecycle_status:string;registration_status:string;has_hold:boolean};
export default function TemporaryLifecycleOwnerPanel(){
 const [rows,setRows]=useState<SeriesRow[]>([]);
 const [reason,setReason]=useState<Record<number,string>>({});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const refresh=useCallback(async()=>{
  if(!supabase)return;
  const {data,error:e}=await supabase.rpc('plato_temp_owner_lifecycle_overview');
  if(e){setError(e.message);return;}
  setRows(Array.isArray(data)?data as SeriesRow:[]);
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
  <button type="button" onClick={()=>void refresh()} disabled={busy}>به‌روزرسانی وضعیت</button>
  {error&&<p role="alert" style={{color:'#ffaaa4'}}>{error}</p>}
  {notice&&<p role="status">{notice}</p>}
  {rows.map(s=><div key={s.series_number} style={{padding:'12px 0',borderBottom:'1px solid #574a32'}}>
   <strong>{s.series_name}</strong>
   <p style={{margin:'6px 0',fontSize:13}}>وضعیت: {s.lifecycle_status} · ثبت‌نام: {s.registration_status}{s.has_hold?' · توقف آرشیو خودکار':''}</p>
   {s.lifecycle_status==='archived'&&<div style={{display:'grid',gap:8}}>
    <label htmlFor={'restore-reason-'+s.series_number}>دلیل بازگردانی</label>
    <textarea id={'restore-reason-'+s.series_number} rows={2} value={reason[s.series_number]||''} onChange={e=>setReason(v=>({...v,[s.series_number]:e.target.value}))} />
    <button type="button" disabled={busy||(reason[s.series_number]||'').trim().length<5} onClick={()=>void restore(s)}>بازگردانی به Active</button>
   </div>}
  </div>)}
 </section>;
}
