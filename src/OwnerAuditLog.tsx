import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime } from './iranDate';
import { Activity, RefreshCw, ShieldCheck } from 'lucide-react';

type LogRow={id:number;actor_id:string|null;action:string;entity_type:string;entity_id:string|null;details:Record<string,any>;created_at:string;actor_name?:string;actor_plato_id?:string};
const entityNames:Record<string,string>={tournaments:'مسابقه',registrations:'ثبت‌نام',tournament_results:'نتیجه',site_news:'خبر',site_pages:'صفحه سایت',site_games:'بازی',site_maintenance:'تنظیمات تعمیرات'};
const actionNames:Record<string,string>={insert:'ایجاد',update:'ویرایش',delete:'حذف'};
export default function OwnerAuditLog(){
 const [rows,setRows]=useState<LogRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [filter,setFilter]=useState('all');
 const load=useCallback(async()=>{
  if(!supabase){setLoading(false);setError('اتصال به پایگاه داده برقرار نیست.');return;}
  setLoading(true);setError('');
  try{
   let query=supabase.from('audit_logs').select('id,actor_id,action,entity_type,entity_id,details,created_at').order('created_at',{ascending:false}).limit(150);
   if(filter!=='all')query=query.eq('entity_type',filter);
   const {data,error:loadError}=await query;if(loadError)throw loadError;
   const ids=[...new Set((data||[]).map(x=>x.actor_id).filter(Boolean))] as string[];
   const {data:profiles,error:profileError}=ids.length?await supabase.from('profiles').select('id,display_name,plato_id').in('id',ids):{data:[],error:null};
   if(profileError)throw profileError;
   const map=new Map((profiles||[]).map(x=>[x.id,x]));
   setRows((data||[]).map(x=>({...x,actor_name:map.get(x.actor_id||'')?.display_name||'سیستم',actor_plato_id:map.get(x.actor_id||'')?.plato_id||''})) as LogRow[]);
  }catch(e:any){setError(e?.message||'دریافت رویدادهای مدیریتی ناموفق بود.');}
  finally{setLoading(false);}
 },[filter]);
 useEffect(()=>{void load();},[load]);
 return <section className="panel owner-audit-log"><div className="admin-toolbar"><div><span className="section-kicker">شفافیت و پیگیری</span><h2>گزارش رویدادهای مدیریتی</h2><p>آخرین ۱۵۰ رویداد ثبت‌شده؛ مدیر مسابقه فقط رویدادهای مسابقات اختصاص‌یافته به خود را می‌بیند.</p></div><Activity size={24}/></div><div className="audit-toolbar"><label>نوع رویداد<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">همه رویدادها</option>{Object.entries(entityNames).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label><button type="button" className="outline-button" onClick={()=>void load()} disabled={loading}><RefreshCw size={15}/> بروزرسانی</button></div>{error&&<p className="auth-inline-error" role="alert">{error}</p>}{loading?<div className="empty-state">در حال دریافت گزارش…</div>:rows.length===0?<div className="empty-state"><ShieldCheck size={26}/><strong>هنوز رویدادی ثبت نشده است.</strong><span>با انجام تغییرات مدیریتی، رویدادها به‌صورت خودکار ثبت می‌شوند.</span></div>:<div className="audit-log-list">{rows.map(row=><article className="audit-log-row" key={row.id}><div className="audit-log-icon"><Activity size={16}/></div><div className="audit-log-copy"><strong>{actionNames[row.action]||row.action} {entityNames[row.entity_type]||row.entity_type}</strong><span>{row.actor_name}{row.actor_plato_id?' · '+row.actor_plato_id:''}</span>{row.details?.status_before||row.details?.status_after?<small>وضعیت: {row.details?.status_before||'—'} ← {row.details?.status_after||'—'}</small>:null}<small>{row.entity_id?'شناسه: '+row.entity_id:''}</small></div><time>{formatIranDateTime(row.created_at)}</time></article>)}</div>}</section>;
}
