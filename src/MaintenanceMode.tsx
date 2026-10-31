import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime } from './iranDate';
import { AlertTriangle, CheckCircle2, Eye, Save, ShieldCheck, Wrench } from 'lucide-react';

type MaintenanceRow={singleton:boolean;enabled:boolean;message:string;updated_at:string|null};

function MaintenanceScreen({message,preview=false}:{message:string;preview?:boolean}){
 return <section className={'maintenance-screen'+(preview?' maintenance-preview':'')} role="status"><div className="maintenance-emblem"><Wrench size={34}/></div><span className="section-kicker">PLATO LAND</span><h1>در حال به‌روزرسانی</h1><p>{message}</p><small>از شکیبایی شما سپاسگزاریم.</small>{preview&&<span className="maintenance-preview-label">پیش‌نمایش مالک — سایت برای کاربران غیرفعال نشده است</span>}</section>;
}

export function MaintenanceGate({owner=false}:{owner?:boolean}){
 const [row,setRow]=useState<MaintenanceRow|null>(null);
 useEffect(()=>{
  if(!supabase)return;
  let alive=true;
  const load=async()=>{const {data,error}=await supabase.from('site_maintenance').select('singleton,enabled,message,updated_at').eq('singleton',true).maybeSingle();if(alive&&!error)setRow(data as MaintenanceRow|null);};
  void load();
  const channel=supabase.channel('site-maintenance-gate').on('postgres_changes',{event:'*',schema:'public',table:'site_maintenance'},()=>void load()).subscribe();
  return ()=>{alive=false;void supabase?.removeChannel(channel);};
 },[]);
 if(owner||!row?.enabled)return null;
 return <div className="maintenance-gate"><MaintenanceScreen message={row.message}/></div>;
}

export function MaintenanceManager(){
 const [enabled,setEnabled]=useState(false);
 const [message,setMessage]=useState('سایت در حال به‌روزرسانی است. لطفاً کمی بعد دوباره مراجعه کنید.');
 const [updatedAt,setUpdatedAt]=useState<string|null>(null);
 const [preview,setPreview]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [saved,setSaved]=useState(false);
 const load=useCallback(async()=>{
  if(!supabase){setLoading(false);setError('اتصال به پایگاه داده برقرار نیست.');return;}
  setLoading(true);setError('');
  try{const {data,error:loadError}=await supabase.from('site_maintenance').select('singleton,enabled,message,updated_at').eq('singleton',true).maybeSingle();if(loadError)throw loadError;if(data){setEnabled(data.enabled);setMessage(data.message);setUpdatedAt(data.updated_at);}else{setEnabled(false);setUpdatedAt(null);}}
  catch(e:any){setError(e?.message||'دریافت تنظیمات حالت تعمیرات ناموفق بود.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 async function save(){
  if(!supabase)return;setBusy(true);setError('');setSaved(false);
  try{const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user)throw new Error('نشست مالک معتبر نیست.');
   const {error:saveError}=await supabase.from('site_maintenance').upsert({singleton:true,enabled,message:message.trim()||'سایت در حال به‌روزرسانی است. لطفاً کمی بعد دوباره مراجعه کنید.',updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'singleton'});
   if(saveError)throw saveError;setSaved(true);await load();
  }catch(e:any){setError(e?.message||'ذخیره تنظیمات تعمیرات ناموفق بود.');}
  finally{setBusy(false);}
 }
 return <section className="panel maintenance-manager"><div className="admin-toolbar"><div><span className="section-kicker">کنترل دسترسی عمومی</span><h2>حالت تعمیرات سایت</h2><p>در این حالت، بازدیدکنندگان پیام تعمیرات را می‌بینند؛ مالک همچنان به پنل و سایت دسترسی دارد.</p></div><Wrench size={24}/></div>
  {loading?<p className="form-footnote">در حال دریافت تنظیمات…</p>:<><label className="check-row"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/><span>فعال‌سازی حالت تعمیرات برای بازدیدکنندگان</span></label><label>پیام عمومی<textarea rows={3} maxLength={500} value={message} onChange={e=>setMessage(e.target.value)}/></label><div className="maintenance-manager-actions"><button type="button" className="outline-button" onClick={()=>setPreview(v=>!v)}><Eye size={15}/>{preview?'بستن پیش‌نمایش':'پیش‌نمایش پیام'}</button><button type="button" className="gold-button" onClick={()=>void save()} disabled={busy}><Save size={15}/>{busy?'در حال ذخیره…':'ذخیره تنظیمات'}</button></div>{updatedAt&&<small className="form-footnote">آخرین تغییر: {formatIranDateTime(updatedAt)}</small>}{saved&&<p className="form-footnote"><CheckCircle2 size={15}/> تنظیمات ذخیره شد.</p>}{error&&<p className="auth-inline-error" role="alert"><AlertTriangle size={15}/> {error}</p>}{preview&&<div className="maintenance-preview-wrap"><MaintenanceScreen message={message} preview/></div>}</>}
  <p className="form-footnote"><ShieldCheck size={14}/> مالک از این حالت مستثناست و می‌تواند تنظیمات را تغییر دهد یا غیرفعال کند.</p>
 </section>;
}
