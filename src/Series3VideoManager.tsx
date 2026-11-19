import React,{useEffect,useState} from 'react';
import {supabase} from './supabase';
import {series3RulesVideoUrl,uploadSeries3RulesVideo} from './series3RulesVideoClient';

const PATH='plato-land/backgammon/series-3/videos/important-rules.mp4';
const LIMIT=100*1024*1024;

export function Series3VideoManager(){
 const [current,setCurrent]=useState('');
 const [file,setFile]=useState<File|null>(null);
 const [active,setActive]=useState(false);
 const [busy,setBusy]=useState(false);

 const [message,setMessage]=useState('');
 const [analytics,setAnalytics]=useState<{modal_opens:number}|null>(null);
 const [analyticsError,setAnalyticsError]=useState('');
 async function refreshAnalytics(){
  if(!supabase)return;
  const {data,error}=await supabase.from('plato_land_series3_video_analytics').select('*').maybeSingle();
  if(error){setAnalyticsError('خواندن آمار ناموفق بود: '+error.message);return;}
  setAnalytics(data as typeof analytics);setAnalyticsError('');
 }

 async function refresh(){
  if(!supabase)return;
  const [{data:settings,error:settingsError},mediaResponse]=await Promise.all([
   supabase.from('plato_land_series3_video_settings').select('storage_path,is_active').eq('id',1).maybeSingle(),
   fetch(series3RulesVideoUrl(),{method:'HEAD',cache:'no-store'})
  ]);
  if(settingsError){setMessage('خواندن وضعیت ویدیو ناموفق بود: '+settingsError.message);return;}
  setActive(Boolean(settings?.is_active));
  setCurrent(mediaResponse.ok?series3RulesVideoUrl():'');
 }
 useEffect(()=>{void refresh();void refreshAnalytics()},[]);
 async function upload(){
  if(!supabase||!file)return;
  if(file.type!=='video/mp4'||file.size>LIMIT){setMessage('فقط فایل MP4 با حجم حداکثر ۱۰۰ مگابایت مجاز است.');return;}
  setBusy(true);setMessage('در حال بارگذاری ویدیو…');
  let r2Saved=false;
  try{
   await uploadSeries3RulesVideo(file);
   r2Saved=true;
   const {data:{user}}=await supabase.auth.getUser();
   const {error:saveError}=await supabase.from('plato_land_series3_video_settings').upsert({id:1,storage_path:PATH,is_active:active,updated_at:new Date().toISOString(),updated_by:user?.id||null});
   if(saveError)throw saveError;
   setFile(null);await refresh();setMessage('ویدیو در R2 ذخیره و با بررسی HEAD تأیید شد.');
  }catch(e){setMessage((r2Saved?'فایل در R2 ذخیره شده، اما ثبت مرجع آن در تنظیمات کامل نشد؛ موفقیت نهایی تأیید نمی‌شود: ':'بارگذاری ناموفق بود: ')+(e instanceof Error?e.message:'خطای ناشناخته'));}
  finally{setBusy(false);}
 }
 async function toggle(){
  if(!supabase)return;
  setBusy(true);
  try{
   const {data:{user}}=await supabase.auth.getUser();
   const {error}=await supabase.from('plato_land_series3_video_settings').upsert({id:1,storage_path:PATH,is_active:!active,updated_at:new Date().toISOString(),updated_by:user?.id||null});
   if(error)throw error;
   setActive(!active);setMessage(!active?'نمایش ویدیو در صفحه اول فعال شد.':'نمایش ویدیو در صفحه اول غیرفعال شد.');
  }catch(e){setMessage('تغییر وضعیت ناموفق بود: '+(e instanceof Error?e.message:'خطای ناشناخته'));}
  finally{setBusy(false);}
 }
 return <section dir="rtl" style={{marginTop:18,padding:16,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#211b12,#111214)'}}>
  <h3 style={{color:'#f6e8c5',fontSize:18,margin:'0 0 8px'}}>مدیریت ویدیوی «قوانین مهم سری سوم»</h3>
  <p style={{color:'#c9c0ad',fontSize:13,lineHeight:1.9}}>ویدیوی MP4 را اینجا بارگذاری یا جایگزین کن. پس از فعال‌سازی، دکمه «قوانین مهم سری سوم» زیر دکمه ثبت‌نام در صفحه اول نمایش داده می‌شود و ویدیو فقط پس از کلیک کاربر در پنجره پخش خواهد شد.</p>
  <div style={{color:active?'#9ed6a3':'#d1b98b',fontSize:13,marginBottom:10}}>وضعیت نمایش عمومی: {active?'فعال':'غیرفعال'}</div>
  {current&&<video src={current} controls playsInline style={{width:'100%',maxHeight:260,background:'#000',borderRadius:8,marginBottom:12}}/>}
  <label style={{display:'block',color:'#e8dfcd',fontSize:13}}>انتخاب فایل ویدیو (MP4 · حداکثر ۱۰۰ مگابایت)
   <input type="file" accept="video/mp4,.mp4" onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:'block',width:'100%',marginTop:8,color:'#ddd'}}/>
  </label>
  {file&&<p style={{fontSize:12,color:'#c9c0ad'}}>فایل انتخاب‌شده: {file.name} · {(file.size/1024/1024).toFixed(1)} MB</p>}
  <button type="button" disabled={!file||busy} onClick={()=>void upload()} style={{width:'100%',marginTop:8,padding:11,border:0,borderRadius:9,background:'#c49b4b',color:'#17120a',fontWeight:800,cursor:'pointer'}}>{busy?'در حال انجام…':current?'بارگذاری و جایگزینی ویدیو':'بارگذاری ویدیو'}</button>
  <button type="button" disabled={!current||busy} onClick={()=>void toggle()} style={{width:'100%',marginTop:8,padding:11,border:'1px solid #8c6a34',borderRadius:9,background:'#211b12',color:'#f0d99f',fontWeight:800,cursor:'pointer'}}>{active?'غیرفعال کردن نمایش در صفحه اول':'فعال کردن نمایش در صفحه اول'}</button>

  <section style={{marginTop:18,padding:14,border:'1px solid #8c6a34',borderRadius:11,background:'#151515'}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
    <h4 style={{margin:0,color:'#f0d99f',fontSize:16}}>آمار تماشای ویدیو</h4>
    <button type="button" disabled={busy} onClick={()=>void refreshAnalytics()} style={{padding:'7px 11px',border:'1px solid #8c6a34',borderRadius:8,background:'#211b12',color:'#f0d99f'}}>به‌روزرسانی آمار</button>
   </div>
   {analyticsError&&<p role="alert" style={{color:'#ff9b91',fontSize:12}}>{analyticsError}</p>}
   {analytics&&<div style={{marginTop:12,padding:16,border:'1px solid #51452d',borderRadius:9,background:'#101113',textAlign:'center'}}>
    <div style={{fontSize:12,color:'#c9c0ad',marginBottom:6}}>تعداد دفعات باز شدن ویدیو</div>
    <strong style={{fontSize:30,color:'#f0d99f'}}>{analytics.modal_opens}</strong>
   </div>}
   <p style={{fontSize:11,color:'#a9a08e',lineHeight:1.8,marginBottom:0}}>فقط تعداد دفعات باز شدن پنجره ویدیو ثبت می‌شود؛ هیچ شناسه ماندگار یا اطلاعات هویتی بازدیدکنندگان ذخیره نمی‌شود.</p>
  </section>
  {message&&<p role="status" style={{fontSize:13,color:'#f0d99f',marginBottom:0}}>{message}</p>}
 </section>;
}
