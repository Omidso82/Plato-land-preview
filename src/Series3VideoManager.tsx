import React,{useEffect,useState} from 'react';
import {supabase} from './supabase';

const BUCKET='series3-video';
const PATH='rules/series3-important-rules.mp4';
const LIMIT=100*1024*1024;

function validateVideoFile(file:File):string{
 const hasMp4Extension=/\.mp4$/i.test(file.name);
 if(!hasMp4Extension||file.type!=='video/mp4')return 'فرمت فایل معتبر نیست. لطفاً فقط ویدیوی MP4 انتخاب کن.';
 if(file.size>LIMIT)return 'حجم فایل بیشتر از ۱۰۰ مگابایت است. لطفاً ویدیوی کم‌حجم‌تری انتخاب کن.';
 if(file.size===0)return 'فایل انتخاب‌شده خالی است. لطفاً فایل دیگری انتخاب کن.';
 return '';
}

export function Series3VideoManager(){
 const [current,setCurrent]=useState('');
 const [file,setFile]=useState<File|null>(null);
 const [fileError,setFileError]=useState('');
 const [active,setActive]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 async function refresh(){
  if(!supabase)return;
  const [{data:settings,error:settingsError},{data:objects,error:listError}]=await Promise.all([
   supabase.from('plato_land_series3_video_settings').select('storage_path,is_active').eq('id',1).maybeSingle(),
   supabase.storage.from(BUCKET).list('rules',{limit:20})
  ]);
  if(settingsError||listError){setMessage('خواندن وضعیت ویدیو ناموفق بود: '+(settingsError?.message||listError?.message));return;}
  const item=(objects||[]).find(x=>x.name==='series3-important-rules.mp4');
  setActive(Boolean(settings?.is_active));
  setCurrent(item?supabase.storage.from(BUCKET).getPublicUrl(PATH).data.publicUrl+'?v='+encodeURIComponent(item.updated_at||item.created_at||''):'');
 }
 useEffect(()=>{void refresh()},[]);
 function handleFileChange(e:React.ChangeEvent<HTMLInputElement>){
  const selected=e.target.files?.[0]||null;
  setMessage('');
  if(!selected){setFile(null);setFileError('');return;}
  const error=validateVideoFile(selected);
  if(error){
   setFile(null);
   setFileError(error);
   e.target.value='';
   return;
  }
  setFile(selected);
  setFileError('');
 }
 async function upload(){
  if(!supabase||!file||busy)return;
  const validationError=validateVideoFile(file);
  if(validationError){setFileError(validationError);setMessage(validationError);return;}
  setBusy(true);setMessage('در حال بارگذاری ویدیو…');
  try{
   const {error}=await supabase.storage.from(BUCKET).upload(PATH,file,{upsert:true,contentType:'video/mp4',cacheControl:'0'});
   if(error)throw error;
   const {data:{user}}=await supabase.auth.getUser();
   const {error:saveError}=await supabase.from('plato_land_series3_video_settings').upsert({id:1,storage_path:PATH,is_active:active,updated_at:new Date().toISOString(),updated_by:user?.id||null});
   if(saveError)throw saveError;
   setFile(null);setFileError('');await refresh();setMessage('ویدیو با موفقیت بارگذاری و جایگزین شد.');
  }catch(e){setMessage('بارگذاری ناموفق بود: '+(e instanceof Error?e.message:'خطای ناشناخته'));}
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
   <input type="file" accept="video/mp4,.mp4" onChange={handleFileChange} style={{display:'block',width:'100%',marginTop:8,color:'#ddd'}}/>
  </label>
  {file&&<p style={{fontSize:12,color:'#c9c0ad'}}>فایل انتخاب‌شده: {file.name} · {(file.size/1024/1024).toFixed(1)} MB</p>}
  {fileError&&<p role="alert" style={{fontSize:13,color:'#ff9b91',marginBottom:0}}>{fileError}</p>}
  <button type="button" disabled={!file||busy||Boolean(fileError)} onClick={()=>void upload()} style={{width:'100%',marginTop:8,padding:11,border:0,borderRadius:9,background:!file||busy||fileError?'#6f6248':'#c49b4b',color:'#17120a',fontWeight:800,cursor:!file||busy||fileError?'not-allowed':'pointer'}}>{busy?'در حال انجام…':current?'بارگذاری و جایگزینی ویدیو':'بارگذاری ویدیو'}</button>
  <button type="button" disabled={!current||busy} onClick={()=>void toggle()} style={{width:'100%',marginTop:8,padding:11,border:'1px solid #8c6a34',borderRadius:9,background:'#211b12',color:'#f0d99f',fontWeight:800,cursor:'pointer'}}>{active?'غیرفعال کردن نمایش در صفحه اول':'فعال کردن نمایش در صفحه اول'}</button>
  {message&&<p role="status" style={{fontSize:13,color:'#f0d99f',marginBottom:0}}>{message}</p>}
 </section>;
}
