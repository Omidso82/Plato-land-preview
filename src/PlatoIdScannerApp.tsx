import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import './plato-id-scanner.css';
type AccessRow={user_id:string;email:string;status:'pending'|'approved'|'rejected'|'disabled';requested_at:string;reviewed_at:string|null};
type ScanRow={id:string;operator_id:string;storage_path:string;file_name:string;content_type:string;file_size:number;status:string;ocr_result:any;created_at:string};
const BUCKET='plato-id-scans', MAX_FILE_SIZE=15*1024*1024, ACCEPTED=['image/jpeg','image/png','image/webp'];
export default function PlatoIdScannerApp(){
 const [user,setUser]=useState<any>(null),[loading,setLoading]=useState(true),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [mode,setMode]=useState<'login'|'register'>('login'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[confirmed,setConfirmed]=useState(false),[owner,setOwner]=useState(false);
 const [access,setAccess]=useState<AccessRow|null>(null),[applications,setApplications]=useState<AccessRow[]>([]),[uploads,setUploads]=useState<ScanRow[]>([]),[file,setFile]=useState<File|null>(null);
 const refresh=useCallback(async(u:any)=>{
  if(!supabase||!u)return;
  const {data:auth}=await supabase.auth.getUser();const verified=!!auth.user?.email_confirmed_at;setConfirmed(verified);
  if(!verified){setAccess(null);setOwner(false);return;}
  const {data:role,error:roleError}=await supabase.rpc('current_user_role');const isOwner=!roleError&&(role==='owner'||role==='مالک کل');setOwner(isOwner);
  if(isOwner){
   const [apps,scans]=await Promise.all([supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').order('requested_at',{ascending:false}),supabase.from('plato_id_scanner_uploads').select('*').order('created_at',{ascending:false}).limit(100)]);
   if(apps.error)setMessage('بارگذاری درخواست‌ها ناموفق بود: '+apps.error.message);else setApplications((apps.data||[]) as AccessRow[]);
   if(scans.error)setMessage('بارگذاری آپلودها ناموفق بود: '+scans.error.message);else setUploads((scans.data||[]) as ScanRow[]);
   setAccess(null);return;
  }
  let {data:row,error}=await supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').eq('user_id',u.id).maybeSingle();
  if(error){setMessage('دریافت وضعیت دسترسی ناموفق بود: '+error.message);return;}
  if(!row){const created=await supabase.from('plato_id_scanner_access').insert({user_id:u.id,email:u.email||''}).select('user_id,email,status,requested_at,reviewed_at').single();if(created.error){setMessage('ثبت درخواست دسترسی ناموفق بود: '+created.error.message);return;}row=created.data;}
  setAccess(row as AccessRow);
  const {data:own,error:ownError}=await supabase.from('plato_id_scanner_uploads').select('*').eq('operator_id',u.id).order('created_at',{ascending:false});
  if(ownError)setMessage('دریافت سوابق آپلود ناموفق بود: '+ownError.message);else setUploads((own||[]) as ScanRow[]);
 },[]);
 useEffect(()=>{
  if(!supabase){setLoading(false);setMessage('اتصال پایگاه داده پیکربندی نشده است.');return;}
  let alive=true;
  supabase.auth.getSession().then(async({data})=>{if(!alive)return;const u=data.session?.user||null;setUser(u);if(u)await refresh(u);if(alive)setLoading(false);});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{const u=session?.user||null;setUser(u);if(u)void refresh(u);else{setOwner(false);setAccess(null);setUploads([]);setApplications([]);setConfirmed(false);}});
  return()=>{alive=false;subscription.unsubscribe();};
 },[refresh]);
 async function authSubmit(e:React.FormEvent){e.preventDefault();if(!supabase||busy)return;setBusy(true);setMessage('');
  try{if(mode==='register'){const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin+'/?page=id-scanner'}});if(error)throw error;if(data.session?.user){setUser(data.session.user);await refresh(data.session.user);setMessage('ثبت‌نام انجام شد. ایمیل را تأیید کنید؛ سپس درخواست شما برای بررسی مالک ثبت می‌شود.');}else setMessage('لینک تأیید به ایمیل شما ارسال شد. پس از تأیید، از همین صفحه وارد شوید.');}
  else{const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;setUser(data.user);await refresh(data.user);}}
  catch(err:any){setMessage(err?.message||'عملیات ورود ناموفق بود.');}finally{setBusy(false);}
 }
 async function signOut(){await supabase?.auth.signOut();setUser(null);setOwner(false);setAccess(null);setUploads([]);setApplications([]);setMessage('از حساب خارج شدید.');}
 async function review(userId:string,status:'approved'|'rejected'|'disabled'){if(!supabase||!owner)return;setBusy(true);setMessage('');const {error}=await supabase.from('plato_id_scanner_access').update({status,reviewed_at:new Date().toISOString(),reviewed_by:user.id}).eq('user_id',userId);if(error)setMessage('ذخیره تصمیم مالک ناموفق بود: '+error.message);else{setMessage('وضعیت درخواست به‌روزرسانی شد.');await refresh(user);}setBusy(false);}
 async function upload(e:React.FormEvent){e.preventDefault();if(!supabase||!user||(!owner&&access?.status!=='approved')||!file||busy)return;if(!ACCEPTED.includes(file.type)){setMessage('فقط تصویر JPG، PNG یا WEBP پذیرفته می‌شود.');return;}if(file.size>MAX_FILE_SIZE){setMessage('حجم هر تصویر حداکثر ۱۵ مگابایت است.');return;}setBusy(true);setMessage('');const id=crypto.randomUUID(),path=user.id+'/'+id+'/'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  try{const stored=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});if(stored.error)throw stored.error;const saved=await supabase.from('plato_id_scanner_uploads').insert({id,operator_id:user.id,storage_path:path,file_name:file.name,content_type:file.type,file_size:file.size,status:'uploaded'}).select('*').single();if(saved.error){await supabase.storage.from(BUCKET).remove([path]);throw saved.error;}setUploads(prev=>[saved.data as ScanRow,...prev]);setFile(null);const input=document.getElementById('plato-scanner-file') as HTMLInputElement|null;if(input)input.value='';setMessage('تصویر ثبت شد. سرویس OCR هنوز فعال نشده است و پردازش در مرحله بعد اضافه می‌شود.');}
  catch(err:any){setMessage(err?.message||'آپلود تصویر ناموفق بود.');}finally{setBusy(false);}
 }
 if(loading)return <main className="plato-scanner-shell" dir="rtl"><div className="plato-scanner-card">در حال بررسی حساب…</div></main>;
 return <main className="plato-scanner-shell" dir="rtl">
  <header className="plato-scanner-header"><div className="plato-scanner-brand"><span>♛</span><div><strong>PLATO LAND</strong><small>PLATO ID SCANNER</small></div></div>{user&&<button className="scanner-ghost" onClick={signOut}>خروج</button>}</header>
  {!user?<section className="plato-scanner-card scanner-auth"><span className="scanner-eyebrow">پنل مستقل اپراتور</span><h1>{mode==='register'?'ساخت حساب اپراتور':'ورود به اسکنر'}</h1><p>دسترسی فقط پس از تأیید ایمیل و تأیید مالک فعال می‌شود.</p><form onSubmit={authSubmit}><label>ایمیل<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>رمز عبور<input type="password" required minLength={8} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="scanner-primary" disabled={busy}>{busy?'لطفاً صبر کنید…':mode==='register'?'ثبت‌نام و ارسال ایمیل تأیید':'ورود امن'}</button></form><button className="scanner-link" onClick={()=>{setMode(mode==='register'?'login':'register');setMessage('');}}>{mode==='register'?'قبلاً حساب ساخته‌اید؟ ورود':'حساب ندارید؟ ثبت‌نام اپراتور'}</button></section>
  :!confirmed?<section className="plato-scanner-card"><h1>تأیید ایمیل لازم است</h1><p>لینک ارسال‌شده به {user.email} را باز کنید؛ سپس دوباره وارد شوید.</p><button className="scanner-primary" onClick={signOut}>بازگشت به ورود</button></section>
  :owner?<section className="scanner-workspace"><div className="scanner-welcome"><div><span className="scanner-eyebrow">دسترسی مالک</span><h1>مدیریت PLATO ID Scanner</h1><p>درخواست اپراتورها و آپلودها</p></div><span className="scanner-status approved">مالک</span></div>
   <div className="scanner-panel"><h2>درخواست‌های اپراتورها</h2>{applications.length===0?<p className="scanner-empty">درخواستی ثبت نشده است.</p>:applications.map(a=><article className="scanner-row" key={a.user_id}><div><strong>{a.email}</strong><small>{new Date(a.requested_at).toLocaleString('fa-IR')}</small><span className={'scanner-status '+a.status}>{a.status==='pending'?'در انتظار بررسی':a.status==='approved'?'تأییدشده':a.status==='rejected'?'ردشده':'غیرفعال'}</span></div><div className="scanner-actions"><button disabled={busy||a.status==='approved'} onClick={()=>void review(a.user_id,'approved')}>تأیید</button><button disabled={busy||a.status==='rejected'} onClick={()=>void review(a.user_id,'rejected')}>رد</button><button disabled={busy||a.status==='disabled'} onClick={()=>void review(a.user_id,'disabled')}>غیرفعال‌سازی</button></div></article>)}</div>
   <div className="scanner-panel"><h2>آخرین آپلودها</h2><UploadList rows={uploads}/></div></section>
  :access?.status!=='approved'?<section className="plato-scanner-card"><span className={'scanner-status '+(access?.status||'pending')}>{access?.status==='rejected'?'درخواست رد شده':access?.status==='disabled'?'دسترسی غیرفعال':'در انتظار تأیید مالک'}</span><h1>{access?.status==='rejected'?'درخواست دسترسی تأیید نشد':access?.status==='disabled'?'دسترسی شما غیرفعال است':'حساب شما در صف بررسی است'}</h1><p>{access?.status==='pending'?'ایمیل شما تأیید شده است. پس از بررسی مالک، امکان آپلود فعال می‌شود.':'برای پیگیری با مالک PLATO LAND تماس بگیرید.'}</p></section>
  :<section className="scanner-workspace"><div className="scanner-welcome"><div><span className="scanner-eyebrow">پنل اپراتور</span><h1>آپلود تصاویر Plato ID</h1><p>هر تصویر جداگانه ذخیره می‌شود و سوابق قبلی حفظ می‌شوند.</p></div><span className="scanner-status approved">دسترسی فعال</span></div><form className="scanner-panel scanner-upload" onSubmit={upload}><h2>ثبت تصویر جدید</h2><label className="scanner-drop">انتخاب تصویر<input id="plato-scanner-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/><small>{file?file.name:'JPG، PNG یا WEBP · حداکثر ۱۵ مگابایت'}</small></label><button className="scanner-primary" disabled={!file||busy}>{busy?'در حال آپلود…':'آپلود تصویر'}</button></form><div className="scanner-panel"><h2>تاریخچه تصاویر من</h2><UploadList rows={uploads}/></div></section>}
  {message&&<p className="scanner-message" role="status">{message}</p>}<footer className="scanner-footer">PLATO LAND · دسترسی محدود و مستقل</footer>
 </main>;
}
function UploadList({rows}:{rows:ScanRow[]}){if(!rows.length)return <p className="scanner-empty">هنوز تصویری ثبت نشده است.</p>;return <div className="scanner-upload-list">{rows.map(row=><article className="scanner-row" key={row.id}><div><strong>{row.file_name}</strong><small>{new Date(row.created_at).toLocaleString('fa-IR')} · {(row.file_size/1024/1024).toFixed(2)} MB</small><span className="scanner-status">{row.status==='uploaded'?'آپلود شده – در انتظار پردازش':row.status}</span>{Array.isArray(row.ocr_result?.ids)&&<p className="scanner-result-ids">{row.ocr_result.ids.join(' · ')}</p>}</div></article>)}</div>;}
