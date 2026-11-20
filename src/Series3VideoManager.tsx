import React,{useEffect,useState} from 'react';
import {supabase} from './supabase';
import {isSeries3RulesVideoKey,series3RulesVideoUrl,uploadSeries3RulesVideo} from './series3RulesVideoClient';
import {deleteR2Media} from './r2MediaDeleteClient';

const LIMIT=100*1024*1024;

export function Series3VideoManager(){
 const [current,setCurrent]=useState('');
 const [currentKey,setCurrentKey]=useState('');
 const [file,setFile]=useState<File|null>(null);
 const [active,setActive]=useState(false);
 const [busy,setBusy]=useState(false);
 const [deleteConfirm,setDeleteConfirm]=useState(false);
 const [deleteBusy,setDeleteBusy]=useState(false);

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
  const {data:settings,error:settingsError}=await supabase.from('plato_land_series3_video_settings').select('storage_path,is_active').eq('id',1).maybeSingle();
  if(settingsError){setMessage('خواندن وضعیت ویدیو ناموفق بود: '+settingsError.message);return;}
  setActive(Boolean(settings?.is_active));
  const key=typeof settings?.storage_path==='string'?settings.storage_path:'';
  if(!isSeries3RulesVideoKey(key)){setCurrent('');setCurrentKey('');return;}
  try{
   const url=series3RulesVideoUrl(key);
   const mediaResponse=await fetch(url,{method:'HEAD',mode:'cors',cache:'no-store'});
   const storedSize=Number(mediaResponse.headers.get('Content-Length')||'0');
   const storedType=(mediaResponse.headers.get('Content-Type')||'').split(';')[0].trim().toLowerCase();
   const valid=mediaResponse.ok&&storedSize>0&&storedType==='video/mp4';
   setCurrent(valid?url:'');setCurrentKey(valid?key:'');
  }catch(e){setCurrent('');setMessage(e instanceof Error?e.message:'مسیر سرویس رسانه R2 در دسترس نیست.');}
 }
 useEffect(()=>{void refresh();void refreshAnalytics()},[]);
 async function upload(){
  if(!supabase||!file)return;
  if(file.type!=='video/mp4'||file.size<=0||file.size>LIMIT){setMessage('فقط فایل MP4 با حجم حداکثر ۱۰۰ مگابایت مجاز است.');return;}
  setBusy(true);setMessage('در حال بارگذاری ویدیو…');
  let r2Saved=false;
  try{
   const uploadedKey=await uploadSeries3RulesVideo(file);
   r2Saved=true;
   const {data:{user}}=await supabase.auth.getUser();
   const {error:saveError}=await supabase.from('plato_land_series3_video_settings').upsert({id:1,storage_path:uploadedKey,is_active:active,updated_at:new Date().toISOString(),updated_by:user?.id||null});
   if(saveError)throw saveError;
   setCurrentKey(uploadedKey);setCurrent(series3RulesVideoUrl(uploadedKey));setFile(null);await refresh();setMessage('ویدیو در R2 ذخیره و با بررسی HEAD تأیید شد.');
  }catch(e){setMessage((r2Saved?'فایل در R2 ذخیره شده، اما ثبت مرجع آن در تنظیمات کامل نشد؛ موفقیت نهایی تأیید نمی‌شود: ':'بارگذاری ناموفق بود: ')+(e instanceof Error?e.message:'خطای ناشناخته'));}
  finally{setBusy(false);}
 }
 async function deleteVideo(){
  if(!supabase||!isSeries3RulesVideoKey(currentKey))return;
  setDeleteBusy(true);setMessage('در حال آماده‌سازی حذف ویدیو…');
  let previousKey=currentKey;
  let previousActive=active;
  let metadataCleared=false;
  try{
   const {data:{user},error:userError}=await supabase.auth.getUser();
   if(userError)throw userError;
   if(!user)throw new Error('نشست معتبر مالک پیدا نشد.');
   const {data:row,error:readError}=await supabase.from('plato_land_series3_video_settings')
    .select('storage_path,is_active').eq('id',1).maybeSingle();
   if(readError)throw readError;
   if(!row||row.storage_path!==currentKey)throw new Error('مرجع ویدیو با فایل انتخاب‌شده یکسان نیست؛ برای جلوگیری از حذف فایل اشتباه عملیات متوقف شد.');
   previousKey=row.storage_path;previousActive=Boolean(row.is_active);
   const {error:clearError}=await supabase.from('plato_land_series3_video_settings')
    .update({storage_path:'',is_active:false,updated_at:new Date().toISOString(),updated_by:user.id}).eq('id',1);
   if(clearError)throw clearError;
   metadataCleared=true;
   const {data:session,error:sessionError}=await supabase.auth.getSession();
   if(sessionError)throw sessionError;
   const token=session.session?.access_token;
   if(!token)throw new Error('نشست معتبر مالک پیدا نشد.');
   const result=await deleteR2Media('rules',token,currentKey);
   setCurrent('');setCurrentKey('');setActive(false);setFile(null);setDeleteConfirm(false);
   setMessage(result.alreadyMissing?'مرجع ویدیو پاک شد؛ فایل در R2 از قبل موجود نبود.':'ویدیوی قوانین از R2 حذف، مرجع آن از Supabase پاک و نبودن فایل تأیید شد.');
  }catch(e){
   let rollbackMessage='';
   if(metadataCleared&&supabase){
    const {error:rollbackError}=await supabase.from('plato_land_series3_video_settings')
     .update({storage_path:previousKey,is_active:previousActive,updated_at:new Date().toISOString()}).eq('id',1);
    if(rollbackError)rollbackMessage=' بازگردانی مرجع قبلی در Supabase هم ناموفق بود: '+rollbackError.message;
   }
   setMessage('حذف ویدیو کامل نشد: '+(e instanceof Error?e.message:'خطای ناشناخته')+rollbackMessage);
  }finally{setDeleteBusy(false);}
 }
 async function toggle(){
  if(!supabase)return;
  setBusy(true);
  try{
   if(!isSeries3RulesVideoKey(currentKey))throw new Error('کلید نسخه‌دار ویدیوی معتبر پیدا نشد.');
   const {data:{user}}=await supabase.auth.getUser();
   const {error}=await supabase.from('plato_land_series3_video_settings').upsert({id:1,storage_path:currentKey,is_active:!active,updated_at:new Date().toISOString(),updated_by:user?.id||null});
   if(error)throw error;
   setActive(!active);setMessage(!active?'نمایش ویدیو در صفحه اول فعال شد.':'نمایش ویدیو در صفحه اول غیرفعال شد.');
  }catch(e){setMessage('تغییر وضعیت ناموفق بود: '+(e instanceof Error?e.message:'خطای ناشناخته'));}
  finally{setBusy(false);}
 }
 return <details dir="rtl" style={{marginTop:18,padding:0,border:'1px solid #b18b45',borderRadius:14,background:'linear-gradient(145deg,#211b12,#111214)',color:'#f6e8c5'}}>
  <summary style={{cursor:'pointer',padding:'16px',fontSize:18,fontWeight:800}}>مدیریت ویدیوی «قوانین مهم سری سوم»</summary>
  <div style={{padding:'0 16px 16px'}}>
  <p style={{color:'#c9c0ad',fontSize:13,lineHeight:1.9}}>ویدیوی MP4 را اینجا بارگذاری یا جایگزین کن. پس از فعال‌سازی، دکمه «قوانین مهم سری سوم» زیر دکمه ثبت‌نام در صفحه اول نمایش داده می‌شود و ویدیو فقط پس از کلیک کاربر در پنجره پخش خواهد شد.</p>
  <div style={{color:active?'#9ed6a3':'#d1b98b',fontSize:13,marginBottom:10}}>وضعیت نمایش عمومی: {active?'فعال':'غیرفعال'}</div>
  {current&&<video src={current} crossOrigin="anonymous" controls playsInline style={{width:'100%',maxHeight:260,background:'#000',borderRadius:8,marginBottom:12}}/>}
  <label style={{display:'block',color:'#e8dfcd',fontSize:13}}>انتخاب فایل ویدیو (MP4 · حداکثر ۱۰۰ مگابایت)
   <input type="file" accept="video/mp4,.mp4" onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:'block',width:'100%',marginTop:8,color:'#ddd'}}/>
  </label>
  {file&&<p style={{fontSize:12,color:'#c9c0ad'}}>فایل انتخاب‌شده: {file.name} · {(file.size/1024/1024).toFixed(1)} MB</p>}
  <button type="button" disabled={!file||busy} onClick={()=>void upload()} style={{width:'100%',marginTop:8,padding:11,border:0,borderRadius:9,background:'#c49b4b',color:'#17120a',fontWeight:800,cursor:'pointer'}}>{busy?'در حال انجام…':current?'بارگذاری و جایگزینی ویدیو':'بارگذاری ویدیو'}</button>
  <button type="button" disabled={!current||busy} onClick={()=>void toggle()} style={{width:'100%',marginTop:8,padding:11,border:'1px solid #8c6a34',borderRadius:9,background:'#211b12',color:'#f0d99f',fontWeight:800,cursor:'pointer'}}>{active?'غیرفعال کردن نمایش در صفحه اول':'فعال کردن نمایش در صفحه اول'}</button>
  {current&&<div style={{marginTop:9}}>
   {!deleteConfirm
    ? <button type="button" disabled={busy||deleteBusy} onClick={()=>setDeleteConfirm(true)} style={{width:'100%',padding:11,border:'1px solid #8d4540',borderRadius:9,background:'#211514',color:'#ffd0c9',fontWeight:800}}>حذف دائمی ویدیو از R2</button>
    : <div style={{padding:10,border:'1px solid #8d4540',borderRadius:9,background:'#1b1111'}}>
       <p style={{fontSize:12,lineHeight:1.8,color:'#ffb2a8',margin:'0 0 8px'}}>فایل ویدیوی قوانین از R2 حذف و مرجع آن از Supabase پاک می‌شود؛ نمایش ویدیو نیز غیرفعال خواهد شد. این حذف دائمی است.</p>
       <div style={{display:'flex',gap:8}}>
        <button type="button" disabled={deleteBusy} onClick={()=>setDeleteConfirm(false)} style={{flex:1,padding:10,border:'1px solid #555',borderRadius:8,background:'#252525',color:'#ddd'}}>انصراف</button>
        <button type="button" disabled={deleteBusy} onClick={()=>void deleteVideo()} style={{flex:1,padding:10,border:0,borderRadius:8,background:'#9f3932',color:'#fff',fontWeight:800}}>{deleteBusy?'در حال حذف…':'تأیید حذف دائمی'}</button>
       </div>
      </div>}
  </div>}

  <details style={{marginTop:18,padding:12,border:'1px solid #8c6a34',borderRadius:11,background:'#151515'}}>
   <summary style={{cursor:'pointer',color:'#f0d99f',fontSize:16,fontWeight:800}}>آمار تماشای ویدیو</summary>
   <div style={{marginTop:10}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>

    <button type="button" disabled={busy} onClick={()=>void refreshAnalytics()} style={{padding:'7px 11px',border:'1px solid #8c6a34',borderRadius:8,background:'#211b12',color:'#f0d99f'}}>به‌روزرسانی آمار</button>
   </div>
   {analyticsError&&<p role="alert" style={{color:'#ff9b91',fontSize:12}}>{analyticsError}</p>}
   {analytics&&<div style={{marginTop:12,padding:16,border:'1px solid #51452d',borderRadius:9,background:'#101113',textAlign:'center'}}>
    <div style={{fontSize:12,color:'#c9c0ad',marginBottom:6}}>تعداد دفعات باز شدن ویدیو</div>
    <strong style={{fontSize:30,color:'#f0d99f'}}>{analytics.modal_opens}</strong>
   </div>}
   <p style={{fontSize:11,color:'#a9a08e',lineHeight:1.8,marginBottom:0}}>فقط تعداد دفعات باز شدن پنجره ویدیو ثبت می‌شود؛ هیچ شناسه ماندگار یا اطلاعات هویتی بازدیدکنندگان ذخیره نمی‌شود.</p>
   </div>
  </details>
  {message&&<p role="status" style={{fontSize:13,color:'#f0d99f',marginBottom:0}}>{message}</p>}
  </div>
 </details>;
}
