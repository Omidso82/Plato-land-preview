import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Activity, AlertTriangle, CheckCircle2, Database, FileText, Gamepad2, Users } from 'lucide-react';

type HealthItem={key:string;label:string;count:number|null;error?:string;icon:any};
export default function OwnerSiteHealth(){
 const [items,setItems]=useState<HealthItem[]>([]);
 const [loading,setLoading]=useState(true);
 const [checkedAt,setCheckedAt]=useState('');
 const [error,setError]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setLoading(false);setError('اتصال پایگاه داده پیکربندی نشده است.');return;}
  setLoading(true);setError('');
  const checks=[
   {key:'tournaments',label:'مسابقات',table:'tournaments',icon:Activity},
   {key:'registrations',label:'درخواست‌های ثبت‌نام',table:'registrations',icon:Users},
   {key:'profiles',label:'پروفایل کاربران',table:'profiles',icon:Users},
   {key:'news',label:'اخبار و اطلاعیه‌ها',table:'site_news',icon:FileText},
   {key:'games',label:'بازی‌های کاتالوگ',table:'site_games',icon:Gamepad2},
   {key:'tasks',label:'وظایف مالک',table:'owner_admin_tasks',icon:CheckCircle2}
  ];
  try{
   const results=await Promise.all(checks.map(async item=>{
    const {count,error:queryError}=await supabase!.from(item.table as any).select('*',{count:'exact',head:true});
    return {...item,count:queryError?null:(count??0),error:queryError?.message};
   }));
   setItems(results);const failed=results.filter(x=>x.error);
   if(failed.length)setError('برخی بررسی‌ها با خطا مواجه شدند؛ جزئیات در کارت مربوطه نمایش داده می‌شود.');
   setCheckedAt(new Date().toISOString());
  }catch(e:any){setError(e?.message||'بررسی سلامت سایت ناموفق بود.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const failed=items.filter(item=>item.error).length;
 return <section className="panel owner-site-health"><div className="admin-toolbar"><div><span className="section-kicker">وضعیت سرویس‌ها</span><h2>سلامت و وضعیت سایت</h2><p>بررسی اتصال و دسترسی خواندن به بخش‌های اصلی پایگاه داده.</p></div><Database size={24}/></div>{loading?<p className="form-footnote">در حال بررسی سرویس‌ها…</p>:<><div className="health-overall"><span className={failed?'health-warning':'health-ok'}>{failed?<AlertTriangle size={18}/>:<CheckCircle2 size={18}/>} {failed?('تعداد '+failed+' بررسی نیازمند پیگیری'):'اتصال و خواندن بخش‌های اصلی موفق است'}</span>{checkedAt&&<small>آخرین بررسی: {new Date(checkedAt).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'})}</small>}</div><div className="health-grid">{items.map(item=>{const Icon=item.icon;return <article className="panel health-card" key={item.key}><div><Icon size={19}/><strong>{item.label}</strong></div>{item.error?<><span className="health-warning"><AlertTriangle size={15}/> خطا</span><small>{item.error}</small></>:<><span className="health-ok"><CheckCircle2 size={15}/> متصل</span><strong className="health-count">{(item.count??0).toLocaleString('fa-IR')}</strong></>}</article>;})}</div><button type="button" className="outline-button" onClick={()=>void load()} disabled={loading}><Activity size={15}/> بررسی دوباره</button></>}{error&&<p className="auth-inline-error" role="alert">{error}</p>}</section>;
}
