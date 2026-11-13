import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from './supabase';
import './plato-id-scanner.css';
import { parseScannerReviewDraft } from './plato-id-scanner-review';
import { auditScannerBatchDuplicates } from './plato-id-scanner-duplicate-audit';
import { appendScannerReviewRevision, loadScannerReviewRevisions, scannerReviewText } from './plato-id-scanner-review-store';

type AccessRow={user_id:string;email:string;status:'pending'|'approved'|'rejected'|'disabled';requested_at:string;reviewed_at:string|null};
type ScanRow={id:string;operator_id:string;storage_path:string;file_name:string;content_type:string;file_size:number;status:string;ocr_result:any;created_at:string};
const BUCKET='plato-id-scans', MAX_FILE_SIZE=15*1024*1024, ACCEPTED=['image/jpeg','image/png','image/webp'];

async function loadScannerUploads(client:any):Promise<{data:ScanRow[]|null;error:any}>{
  const rows:ScanRow[]=[];
  const pageSize=500;
  for(let offset=0;;offset+=pageSize){
    const {data,error}=await client.from('plato_id_scanner_uploads').select('*')
      .order('created_at',{ascending:false}).range(offset,offset+pageSize-1);
    if(error)return {data:null,error};
    const page=(data||[]) as ScanRow[];
    rows.push(...page);
    if(page.length<pageSize)return {data:rows,error:null};
  }
}

async function validateImage(file:File){
  if(!ACCEPTED.includes(file.type))throw new Error('فقط تصویر JPG، PNG یا WEBP پذیرفته می‌شود.');
  if(file.size<=0||file.size>MAX_FILE_SIZE)throw new Error('حجم هر تصویر باید بیشتر از صفر و حداکثر ۱۵ مگابایت باشد.');
  const header=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const isPng=header.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>header[i]===v);
  const isJpeg=header.length>=3&&header[0]===255&&header[1]===216&&header[2]===255;
  const isWebp=header.length>=12&&String.fromCharCode(...header.slice(0,4))==='RIFF'&&String.fromCharCode(...header.slice(8,12))==='WEBP';
  const detected=isPng?'image/png':isJpeg?'image/jpeg':isWebp?'image/webp':'';
  if(!detected||detected!==file.type)throw new Error('ساختار واقعی فایل با فرمت اعلام‌شده مطابقت ندارد.');
  const url=URL.createObjectURL(file);
  try{
    const dimensions=await new Promise<{width:number;height:number}>((resolve,reject)=>{
      const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});
      image.onerror=()=>reject(new Error('فایل تصویر قابل رمزگشایی نیست.'));image.src=url;
    });
    if(!dimensions.width||!dimensions.height)throw new Error('ابعاد تصویر معتبر نیست.');
  }finally{URL.revokeObjectURL(url);}
}

export default function PlatoIdScannerApp({ownerMode=false,embedded=false}:{ownerMode?:boolean;embedded?:boolean}){
 const [user,setUser]=useState<any>(null),[loading,setLoading]=useState(true),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [mode,setMode]=useState<'login'|'register'>('login'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[confirmed,setConfirmed]=useState(false),[owner,setOwner]=useState(false);
 const [access,setAccess]=useState<AccessRow|null>(null),[applications,setApplications]=useState<AccessRow[]>([]),[uploads,setUploads]=useState<ScanRow[]>([]),[files,setFiles]=useState<File[]>([]),[fileChecking,setFileChecking]=useState(false),[uploadSuccessRows,setUploadSuccessRows]=useState<ScanRow[]>([]);
 const refreshGeneration=useRef(0);
 const [scannerView,setScannerView]=useState<'new'|'archive'>('new');
 const [scannerSection,setScannerSection]=useState<'home'|'upload'|'ocr'|'archive'|'ids'|'report'|'history'|'operators'>('home');
 useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'instant' as ScrollBehavior});},[scannerSection]);
 const [scannerOpen,setScannerOpen]=useState(false);
 const [archiveDate,setArchiveDate]=useState('all');
 const [approvedArchiveIds,setApprovedArchiveIds]=useState<Set<string>>(new Set());
 const dateKey=(value:string)=>{
  const parts=new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
  const part=(type:string)=>parts.find(x=>x.type===type)?.value||'';
  return part('year')+'/'+part('month')+'/'+part('day');
 };
 const [todayKey,setTodayKey]=useState(()=>dateKey(new Date().toISOString()));
 useEffect(()=>{const timer=window.setInterval(()=>setTodayKey(dateKey(new Date().toISOString())),30_000);return()=>window.clearInterval(timer);},[]);
 const todayLabel=todayKey.replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
 const todayRows=uploads.filter(x=>dateKey(x.created_at)===todayKey);
 useEffect(()=>{
  let alive=true;
  if(!supabase||!uploads.length){setApprovedArchiveIds(new Set());return()=>{alive=false;};}
  const ids=uploads.map(row=>row.id);
  supabase.from('plato_id_scanner_review_revisions').select('scan_id,status').in('scan_id',ids).eq('status','approved')
   .then(({data,error}:any)=>{if(!alive)return;if(error){setMessage('دریافت وضعیت آرشیو ناموفق بود: '+error.message);return;}setApprovedArchiveIds(new Set((data||[]).map((row:any)=>row.scan_id)));});
  return()=>{alive=false;};
 },[uploads.map(row=>row.id+':'+row.status).join('|')]);
 const archiveRows=uploads.filter(row=>dateKey(row.created_at)!==todayKey||approvedArchiveIds.has(row.id));
 const archiveDays=Array.from(new Set(archiveRows.map(x=>dateKey(x.created_at)))).sort((a,b)=>b.localeCompare(a));
 const visibleArchiveRows=archiveRows.filter(row=>archiveDate==='all'||dateKey(row.created_at)===archiveDate);

 const Root:React.ElementType=embedded?'div':'main';
 const refresh=useCallback(async(u:any)=>{
  if(!supabase||!u)return;
  const generation=++refreshGeneration.current;
  setLoading(true);setConfirmed(false);setOwner(false);setAccess(null);setApplications([]);setUploads([]);
  try{
   const {data:auth}=await supabase.auth.getUser();if(generation!==refreshGeneration.current)return;const verified=!!auth.user?.email_confirmed_at;setConfirmed(verified);
   if(!verified){setAccess(null);setOwner(false);return;}
   const {data:role,error:roleError}=await supabase.rpc('current_user_role');if(generation!==refreshGeneration.current)return;const isOwner=!roleError&&(role==='owner'||role==='مالک کل');setOwner(isOwner);
   if(ownerMode&&!isOwner){setMessage('نشست مالک تأیید نشد؛ بخش اسکنر برای این حساب باز نمی‌شود.');return;}
   if(isOwner){
    const [apps,scans]=await Promise.all([supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').order('requested_at',{ascending:false}),loadScannerUploads(supabase)]);
    if(generation!==refreshGeneration.current)return;
    if(apps.error)setMessage('بارگذاری درخواست‌ها ناموفق بود: '+apps.error.message);else setApplications((apps.data||[]) as AccessRow[]);
    if(scans.error)setMessage('بارگذاری آپلودها ناموفق بود: '+scans.error.message);else setUploads(scans.data||[]);
    setAccess(null);return;
   }
   let {data:row,error}=await supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').eq('user_id',u.id).maybeSingle();
   if(generation!==refreshGeneration.current)return;
   if(error){setMessage('دریافت وضعیت دسترسی ناموفق بود: '+error.message);return;}
   if(!row){const created=await supabase.from('plato_id_scanner_access').insert({user_id:u.id,email:u.email||''}).select('user_id,email,status,requested_at,reviewed_at').single();if(generation!==refreshGeneration.current)return;if(created.error){setMessage('ثبت درخواست دسترسی ناموفق بود: '+created.error.message);return;}row=created.data;}
   setAccess(row as AccessRow);
   if(row.status!=='approved'){setUploads([]);return;}
   const {data:own,error:ownError}=await loadScannerUploads(supabase);
   if(generation!==refreshGeneration.current)return;
   if(ownError)setMessage('دریافت سوابق آپلود ناموفق بود: '+ownError.message);else setUploads(own||[]);
  }finally{if(generation===refreshGeneration.current)setLoading(false);}
 },[]);
 useEffect(()=>{
  if(!supabase){setLoading(false);setMessage('اتصال پایگاه داده پیکربندی نشده است.');return;}
  let alive=true;
  supabase.auth.getSession().then(async({data})=>{if(!alive)return;const u=data.session?.user||null;setUser(u);if(u)await refresh(u);if(alive)setLoading(false);});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{const u=session?.user||null;setUser(u);if(u){Promise.resolve().then(()=>refresh(u));}else{refreshGeneration.current++;setLoading(false);setOwner(false);setAccess(null);setUploads([]);setApplications([]);setConfirmed(false);}});
  return()=>{alive=false;subscription.unsubscribe();};
 },[refresh]);
 async function authSubmit(e:React.FormEvent){
  e.preventDefault();if(!supabase||busy)return;setBusy(true);setMessage('');
  try{
   if(mode==='register'){const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin+'/?page=id-scanner'}});if(error)throw error;if(data.session?.user){setUser(data.session.user);await refresh(data.session.user);setMessage('ثبت‌نام انجام شد. ایمیل را تأیید کنید؛ سپس درخواست شما برای بررسی مالک ثبت می‌شود.');}else setMessage('لینک تأیید به ایمیل شما ارسال شد. پس از تأیید، از همین صفحه وارد شوید.');}
   else{const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;setUser(data.user);await refresh(data.user);}
  }catch(err:any){setMessage(err?.message||'عملیات ورود ناموفق بود.');}finally{setBusy(false);}
 }
 async function signOut(){if(ownerMode)return;await supabase?.auth.signOut();setUser(null);setOwner(false);setAccess(null);setUploads([]);setApplications([]);setFiles([]);setMessage('از حساب خارج شدید.');}
 async function review(userId:string,status:'approved'|'rejected'|'disabled'){
  if(!supabase||!owner)return;setBusy(true);setMessage('');
  const {error}=await supabase.from('plato_id_scanner_access').update({status,reviewed_at:new Date().toISOString(),reviewed_by:user.id}).eq('user_id',userId);
  if(error)setMessage('ذخیره تصمیم مالک ناموفق بود: '+error.message);else{setMessage('وضعیت درخواست به‌روزرسانی شد.');await refresh(user);}setBusy(false);
 }
 async function selectFiles(list:FileList|null){
  setFiles([]);setUploadSuccessRows([]);setMessage('');if(!list||!list.length)return;setFileChecking(true);
  try{
   if(list.length!==1){setMessage('هر بار فقط یک تصویر انتخاب کن تا پس از آپلود، همان تصویر را اسکن و نتیجه‌اش را بررسی کنی.');return;}
   const selected=[list[0]];const valid:File[]=[];const errors:string[]=[];
   for(const f of selected){try{await validateImage(f);valid.push(f);}catch(err:any){errors.push(f.name+': '+(err?.message||'فایل نامعتبر'))}}
   setFiles(valid);
   if(errors.length)setMessage(errors.join(' | ')+(valid.length?' — تصاویر معتبر برای آپلود نگه داشته شدند.':''));
   else setMessage(valid.length+' تصویر بررسی شد و آماده آپلود است.');
  }finally{setFileChecking(false);}
 }
 async function deleteScan(row:ScanRow){
  if(!supabase||!user||busy||(!owner&&access?.status!=='approved'))return;
  if(!window.confirm('این تصویر و تمام اطلاعات وابسته به آن، شامل نتیجه OCR، سوابق بازبینی و تاریخچه پردازش، برای همیشه حذف شود؟ این کار قابل بازگشت نیست.'))return;
  setBusy(true);setMessage('');
  try{
   const stored=await supabase.storage.from(BUCKET).remove([row.storage_path]);
   if(stored.error)throw new Error('حذف فایل تصویر ناموفق بود: '+stored.error.message);
   const {error}=await supabase.rpc('delete_plato_id_scanner_upload',{p_scan_id:row.id});
   if(error)throw new Error('فایل تصویر حذف شد، اما پاک‌سازی سوابق دیتابیس کامل نشد. شناسه تصویر: '+row.id+' · '+error.message);
   setUploads(prev=>prev.filter(item=>item.id!==row.id));
   setMessage('تصویر و تمام سوابق وابسته به آن حذف شدند.');
  }catch(err:any){setMessage(err?.message||'حذف تصویر ناموفق بود.');}
  finally{setBusy(false);}
 }
 async function upload(e:React.FormEvent){
  e.preventDefault();if(!supabase||!user||(!owner&&access?.status!=='approved')||!files.length||busy||fileChecking)return;
  setBusy(true);setUploadSuccessRows([]);setMessage('');const completed:ScanRow[]=[];const failures:string[]=[];
  for(const file of files){
   const id=crypto.randomUUID(),safeBase=(file.name.replace(/[^a-zA-Z0-9_-]/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'').slice(0,100)||'upload'),extension=file.type==='image/jpeg'?'.jpg':file.type==='image/png'?'.png':'.webp',path=user.id+'/'+id+'/'+safeBase+extension;
   try{
    const stored=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});if(stored.error)throw stored.error;
    const saved=await supabase.from('plato_id_scanner_uploads').insert({id,operator_id:user.id,storage_path:path,file_name:file.name,content_type:file.type,file_size:file.size,status:'uploaded'}).select('*').single();
    if(saved.error){await supabase.storage.from(BUCKET).remove([path]);throw saved.error;}
    completed.push(saved.data as ScanRow);
   }catch(err:any){failures.push(file.name+': '+(err?.message||'خطا در آپلود'));}
  }
  if(completed.length){setUploads(prev=>[...completed,...prev]);setUploadSuccessRows(completed);}
  setFiles([]);const input=document.getElementById('plato-scanner-files') as HTMLInputElement|null;if(input)input.value='';
  setMessage(failures.length?'ذخیره بعضی تصاویر ناموفق بود: '+failures.join(' | '):'');
  setBusy(false);
 }
 if(loading)return <Root className={"plato-scanner-shell"+(embedded?" scanner-embedded":"")} dir="rtl"><div className="plato-scanner-card">در حال بررسی حساب…</div></Root>;
 return <Root className={"plato-scanner-shell"+(embedded?" scanner-embedded":"")} dir="rtl">
  <header className="plato-scanner-header"><div className="plato-scanner-brand"><span>♛</span><div><strong>PLATO LAND</strong><small>PLATO ID SCANNER</small></div></div>{user&&!ownerMode&&<button className="scanner-ghost" onClick={signOut}>خروج</button>}</header>
  {!user?<section className="plato-scanner-card scanner-auth"><span className="scanner-eyebrow">پنل مستقل اپراتور</span><h1>{mode==='register'?'ساخت حساب اپراتور':'ورود به اسکنر'}</h1><p>دسترسی فقط پس از تأیید ایمیل و تأیید مالک فعال می‌شود.</p><form onSubmit={authSubmit}><label>ایمیل<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>رمز عبور<input type="password" required minLength={8} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="scanner-primary" disabled={busy}>{busy?'لطفاً صبر کنید…':mode==='register'?'ثبت‌نام و ارسال ایمیل تأیید':'ورود امن'}</button></form><button className="scanner-link" onClick={()=>{setMode(mode==='register'?'login':'register');setMessage('');}}>{mode==='register'?'قبلاً حساب ساخته‌اید؟ ورود':'حساب ندارید؟ ثبت‌نام اپراتور'}</button></section>
  :!confirmed?<section className="plato-scanner-card"><h1>تأیید ایمیل لازم است</h1><p>لینک ارسال‌شده به {user.email} را باز کنید؛ سپس دوباره وارد شوید.</p><button className="scanner-primary" onClick={signOut}>بازگشت به ورود</button></section>
  :owner?<section className="scanner-workspace scanner-admin-dashboard">
    {scannerSection==='home'?<>
    <div className="scanner-admin-hero">
      <div className="scanner-admin-brandline"><span className="scanner-admin-crown">♛</span><span>PLATO LAND</span><i>ADMIN</i></div>
      <div className="scanner-admin-heading"><div><span className="scanner-eyebrow">مرکز مدیریت اختصاصی</span><h1>مدیریت آیدی‌های فعال</h1><p>آپلود تصاویر، بررسی نتایج و آماده‌سازی گزارش‌های PLATO ID</p></div><span className="scanner-status approved">دسترسی مالک</span></div>
    </div>
    <div className="scanner-admin-stats" aria-label="خلاصه وضعیت اسکنر">
      <div className="scanner-admin-stat"><span>کل تصاویر ثبت‌شده</span><strong>{uploads.length}</strong><small>تمام سوابق محفوظ</small></div>
      <div className="scanner-admin-stat"><span>تصاویر امروز</span><strong>{todayRows.length}</strong><small>بر اساس تاریخ تهران</small></div>
      <div className="scanner-admin-stat"><span>در انتظار پردازش OCR</span><strong>{uploads.filter(x=>x.status==='uploaded').length}</strong><small>نیازمند شروع پردازش</small></div>
      <div className="scanner-admin-stat"><span>در انتظار بازبینی</span><strong>{uploads.filter(x=>x.status==='needs_review').length}</strong><small>تأیید انسانی لازم است</small></div>
    </div>
<div className="scanner-home-grid" aria-label="بخش‌های مدیریت اسکنر">
<button type="button" onClick={()=>{setUploadSuccessRows([]);setScannerSection('upload');}}><b>↑</b><strong>تصاویر و آپلود</strong><small>افزودن تصویر جدید</small></button>
<button type="button" onClick={()=>setScannerSection('ocr')}><b>⌕</b><strong>استخراج و بررسی</strong><small>پردازش و بازبینی OCR</small></button>
<button type="button" onClick={()=>setScannerSection('archive')}><b>▤</b><strong>آرشیو تصاویر</strong><small>{uploads.length} تصویر ثبت‌شده</small></button>
<button type="button" onClick={()=>setScannerSection('ids')}><b>✓</b><strong>فهرست نهایی آیدی‌ها</strong><small>شناسه‌های یکتا و تکراری‌ها</small></button>
<button type="button" onClick={()=>setScannerSection('report')}><b>↗</b><strong>گزارش تلگرام</strong><small>پیش‌نمایش و ارسال دستی</small></button>
<button type="button" onClick={()=>setScannerSection('history')}><b>◷</b><strong>تاریخچه ارسال</strong><small>سوابق تحویل تلگرام</small></button>
<button type="button" className="scanner-home-wide" onClick={()=>setScannerSection('operators')}><b>♙</b><strong>مدیریت دسترسی اپراتورها</strong><small>{applications.filter(a=>a.status==='pending').length} درخواست در انتظار بررسی · {applications.length} حساب ثبت‌شده</small></button>
</div>
</>:<div className="scanner-admin-workspace">
<div className="scanner-workspace-toolbar"><button type="button" className="scanner-back-button" onClick={()=>setScannerSection('home')}>← بازگشت به داشبورد</button><strong>{{upload:'تصاویر و آپلود',ocr:'استخراج و بررسی',archive:'آرشیو تصاویر',ids:'فهرست نهایی آیدی‌ها',report:'گزارش تلگرام',history:'تاریخچه ارسال',operators:'مدیریت دسترسی اپراتورها'}[scannerSection]}</strong></div>
{scannerSection==='operators'?<div className="scanner-panel scanner-access-panel"><h2>درخواست‌های اپراتورها</h2>{applications.length===0?<p className="scanner-empty">درخواستی ثبت نشده است.</p>:applications.map(a=><article className="scanner-row" key={a.user_id}><div><strong>{a.email}</strong><small>{new Date(a.requested_at).toLocaleString('fa-IR')}</small><span className={'scanner-status '+a.status}>{a.status==='pending'?'در انتظار بررسی':a.status==='approved'?'تأییدشده':a.status==='rejected'?'ردشده':'غیرفعال'}</span></div><div className="scanner-actions"><button disabled={busy||a.status==='approved'} onClick={()=>void review(a.user_id,'approved')}>تأیید</button><button disabled={busy||a.status==='rejected'} onClick={()=>void review(a.user_id,'rejected')}>رد</button><button disabled={busy||a.status==='disabled'} onClick={()=>void review(a.user_id,'disabled')}>غیرفعال‌سازی</button></div></article>)}</div>
:scannerSection==='ids'||scannerSection==='report'||scannerSection==='history'?<GlobalUniqueIdsPanel uploads={uploads} mode={scannerSection}/>
:<ScannerWorkspaceView view={scannerView} setView={setScannerView} sectionMode={scannerSection} archiveDate={archiveDate} setArchiveDate={setArchiveDate} archiveDays={archiveDays} archiveRows={visibleArchiveRows} todayRows={todayRows} onReviewApproved={(id:string)=>setApprovedArchiveIds(prev=>new Set([...prev,id]))} todayLabel={todayLabel} uploads={uploads} onDelete={deleteScan} onScanUpdated={(updated:ScanRow)=>setUploads(prev=>prev.map(item=>item.id===updated.id?updated:item))} setFiles={setFiles} setMessage={setMessage} files={files} fileChecking={fileChecking} busy={busy} selectFiles={selectFiles} upload={upload} uploadSuccessRows={uploadSuccessRows} onContinueToOcr={()=>{setUploadSuccessRows([]);setScannerSection('ocr');}} client={supabase} reviewerId={user.id}/>}
</div>}
   </section>
   :access?.status!=='approved'?<section className="plato-scanner-card"><span className={'scanner-status '+(access?.status||'pending')}>{access?.status==='rejected'?'درخواست رد شده':access?.status==='disabled'?'دسترسی غیرفعال':'در انتظار تأیید مالک'}</span><h1>{access?.status==='rejected'?'درخواست دسترسی تأیید نشد':access?.status==='disabled'?'دسترسی شما غیرفعال است':'حساب شما در صف بررسی است'}</h1><p>{access?.status==='pending'?'ایمیل شما تأیید شده است. پس از بررسی مالک، امکان آپلود فعال می‌شود.':'برای پیگیری با مالک PLATO LAND تماس بگیرید.'}</p></section>
  :<section className="scanner-workspace scanner-admin-dashboard">
    {scannerSection==='home'?<>
      <div className="scanner-admin-hero">
        <div className="scanner-admin-brandline"><span className="scanner-admin-crown">♛</span><span>PLATO LAND</span><i>ADMIN</i></div>
        <div className="scanner-admin-heading"><div><span className="scanner-eyebrow">مرکز مدیریت اختصاصی</span><h1>مدیریت آیدی‌های فعال</h1><p>آپلود تصاویر، بررسی نتایج و آماده‌سازی گزارش‌های PLATO ID</p></div><span className="scanner-status approved">دسترسی اپراتور</span></div>
      </div>
      <div className="scanner-admin-stats" aria-label="خلاصه وضعیت اسکنر">
        <div className="scanner-admin-stat"><span>کل تصاویر ثبت‌شده شما</span><strong>{uploads.length}</strong><small>تمام سوابق مجاز شما</small></div>
        <div className="scanner-admin-stat"><span>تصاویر امروز</span><strong>{todayRows.length}</strong><small>بر اساس تاریخ تهران</small></div>
        <div className="scanner-admin-stat"><span>در انتظار پردازش OCR</span><strong>{uploads.filter(x=>x.status==='uploaded').length}</strong><small>نیازمند شروع پردازش</small></div>
        <div className="scanner-admin-stat"><span>در انتظار بازبینی</span><strong>{uploads.filter(x=>x.status==='needs_review').length}</strong><small>تأیید انسانی لازم است</small></div>
      </div>
      <div className="scanner-home-grid" aria-label="بخش‌های مجاز اسکنر">
        <button type="button" onClick={()=>{setUploadSuccessRows([]);setScannerSection('upload');setScannerView('new');}}><b>↑</b><strong>تصاویر و آپلود</strong><small>افزودن تصویر جدید</small></button>
        <button type="button" onClick={()=>{setScannerSection('ocr');setScannerView('new');}}><b>⌕</b><strong>استخراج و بررسی</strong><small>پردازش و بازبینی OCR</small></button>
        <button type="button" onClick={()=>{setScannerSection('archive');setScannerView('archive');}}><b>▤</b><strong>آرشیو تصاویر</strong><small>{uploads.length} تصویر ثبت‌شده</small></button>
        <button type="button" onClick={()=>setScannerSection('ids')}><b>✓</b><strong>فهرست نهایی آیدی‌ها</strong><small>شناسه‌های یکتا و تکراری‌ها</small></button>
        <button type="button" onClick={()=>setScannerSection('report')}><b>↗</b><strong>گزارش تلگرام</strong><small>پیش‌نمایش و ارسال دستی به گروه آزمایشی</small></button>
        <button type="button" onClick={()=>setScannerSection('history')}><b>◷</b><strong>تاریخچه ارسال</strong><small>سوابق گزارش‌های ثبت‌شده اپراتور</small></button>
      </div>
    </>:<div className="scanner-admin-workspace">
      <div className="scanner-workspace-toolbar"><button type="button" className="scanner-back-button" onClick={()=>{setScannerSection('home');setScannerView('new');}}>← بازگشت به داشبورد</button><strong>{{upload:'تصاویر و آپلود',ocr:'استخراج و بررسی',archive:'آرشیو تصاویر',ids:'فهرست نهایی آیدی‌ها',report:'گزارش تلگرام',history:'تاریخچه ارسال'}[scannerSection]||'فضای کاری اسکنر'}</strong></div>
      {scannerSection==='ids'||scannerSection==='report'||scannerSection==='history'
        ? <GlobalUniqueIdsPanel uploads={uploads} mode={scannerSection}/>
        : <ScannerWorkspaceView view={scannerView} setView={setScannerView} sectionMode={scannerSection} archiveDate={archiveDate} setArchiveDate={setArchiveDate} archiveDays={archiveDays} archiveRows={archiveRows} todayRows={todayRows} todayLabel={todayLabel} uploads={uploads} onDelete={deleteScan} onScanUpdated={(updated:ScanRow)=>setUploads(prev=>prev.map(item=>item.id===updated.id?updated:item))} setFiles={setFiles} setMessage={setMessage} files={files} fileChecking={fileChecking} busy={busy} selectFiles={selectFiles} upload={upload} uploadSuccessRows={uploadSuccessRows} onContinueToOcr={()=>{setUploadSuccessRows([]);setScannerSection('ocr');}} client={supabase} reviewerId={user.id}/>
      }
    </div>}
   </section>}
  {message&&<p className="scanner-message" role="status">{message}</p>}<footer className="scanner-footer">PLATO LAND · دسترسی محدود و مستقل</footer>
 </Root>;
}

function GlobalUniqueIdsPanel({uploads,mode='all'}:{uploads:ScanRow[];mode?:'all'|'ids'|'report'|'history'}){
 const [revisions,setRevisions]=useState<any[]>([]),[reviewLoading,setReviewLoading]=useState(false);
 const [period,setPeriod]=useState<'today'|'yesterday'|'last7'|'custom'>('today');
 const [startDate,setStartDate]=useState(''),[endDate,setEndDate]=useState('');
 const [preview,setPreview]=useState<any>(null),[duplicateReviewed,setDuplicateReviewed]=useState(false),[includeExcel,setIncludeExcel]=useState(false),[reportBusy,setReportBusy]=useState(false),[reportMessage,setReportMessage]=useState(''),[deliveryHistory,setDeliveryHistory]=useState<any[]>([]),[historyLoading,setHistoryLoading]=useState(false);
 useEffect(()=>{
  let alive=true;
  (async()=>{
   if(!supabase||!uploads.length){setRevisions([]);setPreview(null);setDuplicateReviewed(false);return;}
   setPreview(null);setDuplicateReviewed(false);
   setReviewLoading(true);
   try{
    const ids=uploads.map(x=>x.id);
    const rows:any[]=[];
    for(let offset=0;;offset+=500){
     const {data,error}=await supabase.from('plato_id_scanner_review_revisions')
      .select('scan_id,revision,status,canonical_ids').in('scan_id',ids)
      .eq('status','approved').order('revision',{ascending:true}).range(offset,offset+499);
     if(error)throw error;
     rows.push(...(data||[]));if(!data||data.length<500)break;
    }
    if(alive)setRevisions(rows);
   }catch(e:any){if(alive)setReportMessage('بارگذاری بازبینی‌های تأییدشده ناموفق بود: '+(e?.message||'خطا'));}
   finally{if(alive)setReviewLoading(false);}
  })();
  return()=>{alive=false;};
 },[uploads]);
 const latestByScan=useMemo(()=>{
  const map=new Map<string,any>();
  for(const row of revisions){const old=map.get(row.scan_id);if(!old||row.revision>old.revision)map.set(row.scan_id,row);}
  return map;
 },[revisions]);
 const audit=useMemo(()=>{
  const scans=[...uploads].filter(row=>latestByScan.has(row.id))
   .sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id))
   .map(row=>({scan_id:row.id,candidates:(latestByScan.get(row.id)?.canonical_ids||[])
    .filter((id:unknown):id is string=>typeof id==='string'&&id.length>0)
    .map((raw_value:string)=>({raw_value}))}));
  return auditScannerBatchDuplicates(scans);
 },[uploads,latestByScan]);
 const names=new Map(uploads.map(row=>[row.id,row.file_name]));
 async function loadDeliveryHistory(){
  if(!supabase||historyLoading)return;
  setHistoryLoading(true);
  try{
   const {data,error}=await supabase.functions.invoke('plato-id-scanner-telegram-report',{body:{action:'history'}});
   if(error)throw error;
   setDeliveryHistory(data?.history||[]);
  }catch(e:any){setReportMessage(e?.message||'دریافت تاریخچه ارسال ناموفق بود.');}
  finally{setHistoryLoading(false);}
 }
 async function requestReport(action:'preview'|'send'){
  if(reportBusy)return;
  if(period==='custom'&&(!startDate||!endDate||startDate>endDate)){setReportMessage('برای بازه دلخواه، تاریخ شروع و پایان معتبر را انتخاب کن.');return;}
  if(action==='send'&&(!preview?.preview)){setReportMessage('ابتدا پیش‌نمایش همین بازه را تهیه و بررسی کن.');return;}
  if(action==='send'&&(preview?.duplicate_count||0)>0&&!duplicateReviewed){setReportMessage('ابتدا موارد تکراری دقیق را بررسی و تأیید کن.');return;}
  if(action==='send'&&!window.confirm(includeExcel?'گزارش گروه‌بندی‌شده بازه انتخابی همراه فایل Excel به گروه آزمایشی تلگرام ارسال شود؟ این ارسال یک نسخه جدید در تاریخچه ایجاد می‌کند.':'گزارش گروه‌بندی‌شده بازه انتخابی به گروه آزمایشی تلگرام ارسال شود؟ این ارسال یک نسخه جدید در تاریخچه ایجاد می‌کند.'))return;
  setReportBusy(true);setReportMessage('');
  try{
   const body:any={action,period};
   if(period==='custom'){body.start_date=startDate;body.end_date=endDate;}
   if(action==='send'){body.request_id=crypto.randomUUID();body.confirm_exact_duplicates=duplicateReviewed;body.preview_fingerprint=preview.fingerprint;body.include_excel=includeExcel;}
   const {data,error}=await supabase.functions.invoke('plato-id-scanner-telegram-report',{body});
   if(error)throw error;
   if(action==='preview'){setPreview(data);setDuplicateReviewed(false);setReportMessage('پیش‌نمایش آماده شد؛ هنوز هیچ پیامی ارسال نشده است.');}
   else{setPreview(data);void loadDeliveryHistory();setReportMessage(data?.sent?'ارسال به گروه آزمایشی انجام شد · نسخه '+data.report_version+' · '+data.id_count+' ردیف ID روزانه · '+data.message_count+' پیام'+(data.excel_attached?' · فایل Excel پیوست شد':''):data?.partial?'ارسال ناقص بود؛ بخشی از پیام‌ها ممکن است در گروه ثبت شده باشند. نسخه و وضعیت خطا ذخیره شد.':'ارسال تأیید نشد؛ وضعیت و جزئیات در پاسخ سرویس ثبت شده است.');}
  }catch(e:any){setReportMessage(e?.message||'تهیه یا ارسال گزارش ناموفق بود.');}
  finally{setReportBusy(false);}
 }
 return <section id="scanner-global-unique-panel" className="scanner-panel scanner-global-unique-panel">
  {mode==='all'||mode==='ids'?<>
  <div className="scanner-section-heading"><span className="scanner-step">✓</span><div><h2>فهرست نهایی و یکتای Plato IDها</h2><p>فقط آخرین نسخه بازبینی و تأییدشده هر تصویر در فهرست اصلی محاسبه می‌شود؛ موارد OCR تأییدنشده وارد فهرست و تلگرام نمی‌شوند.</p></div></div>
  <div className="scanner-report-stats">
   <div><strong>{audit.total_occurrences}</strong><small>کل IDهای تأییدشده</small></div>
   <div><strong>{audit.unique_count}</strong><small>ID یکتای تجمیعی</small></div>
   <div><strong>{audit.duplicate_count}</strong><small>تکراری دقیق</small></div>
   <div><strong>{uploads.filter(x=>x.ocr_result?.outcome==='succeeded'&&!latestByScan.has(x.id)).length}</strong><small>تصویر منتظر بازبینی</small></div>
  </div>
  {reviewLoading?<div className="scanner-empty-state">در حال بارگذاری آخرین نسخه‌های بازبینی…</div>:audit.accepted_ids.length
   ? <div className="scanner-global-id-list" dir="ltr">{audit.accepted_ids.map((id,index)=><span key={id+'-'+index}>{id}</span>)}</div>
   : <div className="scanner-empty-state"><strong>هنوز فهرست تأییدشده‌ای وجود ندارد</strong><small>پس از OCR، شناسه‌ها را با تصویر تطبیق بده و نسخه بازبینی را ثبت کن.</small></div>}
  {audit.duplicates.length>0&&<details className="scanner-review-history">
   <summary>مشاهده {audit.duplicates.length} مورد تکراری و منبع آن‌ها</summary>
   <div className="scanner-report-id-list" dir="ltr">{audit.duplicates.map((item,index)=><div key={item.scan_id+'-'+item.candidate_index+'-'+index}>
    <strong>{item.raw_value}</strong><small>تصویر تکراری: {names.get(item.scan_id)||item.scan_id} · اولین مورد: {names.get(item.duplicate_of_scan_id)||item.duplicate_of_scan_id}</small>
   </div>)}</div>
  </details>}
  </>:null}
  {mode==='all'||mode==='report'?<>
  <div id="scanner-telegram-report" className="scanner-telegram-report">
   <h3>ارسال گزارش به گروه آزمایشی تلگرام</h3>
   <p>گزارش بر اساس روز ثبت تصویر در منطقه زمانی تهران گروه‌بندی می‌شود. فقط آخرین نسخه بازبینی و تأییدشده هر تصویر وارد گزارش می‌شود؛ ارسال فقط با اقدام دستی به گروه آزمایشی انجام می‌شود.</p>
   <label>بازه گزارش<select value={period} onChange={e=>{setPeriod(e.target.value as any);setPreview(null);setDuplicateReviewed(false);setReportMessage('');}}>
    <option value="today">امروز</option><option value="yesterday">دیروز</option><option value="last7">هفت روز اخیر (بازه شناور)</option><option value="custom">بازه دلخواه</option>
   </select></label>
   {period==='custom'&&<div className="scanner-report-date-range">
    <label>از تاریخ<input type="date" value={startDate} onChange={e=>{setStartDate(e.target.value);setPreview(null);setDuplicateReviewed(false);}}/></label>
    <label>تا تاریخ<input type="date" value={endDate} onChange={e=>{setEndDate(e.target.value);setPreview(null);setDuplicateReviewed(false);}}/></label>
   </div>}
   <label className="scanner-duplicate-confirm"><input type="checkbox" checked={includeExcel} onChange={e=>setIncludeExcel(e.target.checked)}/> پیوست اختیاری فایل Excel (.xlsx) شامل خلاصه و یک برگه جداگانه برای هر روز</label>
   <div className="scanner-actions">
    <button type="button" className="scanner-ghost" disabled={reportBusy||reviewLoading} onClick={()=>void requestReport('preview')}>{reportBusy?'در حال آماده‌سازی…':'پیش‌نمایش گزارش'}</button>
    <button type="button" className="scanner-primary" disabled={reportBusy||reviewLoading||audit.unique_count===0} onClick={()=>void requestReport('send')}>{reportBusy?'در حال ارسال…':'ارسال گزارش گروه‌بندی‌شده به گروه آزمایشی'}</button>
   </div>
   {reportMessage&&<p className="scanner-message" role="status">{reportMessage}</p>}
   {preview?.preview&&<div className="scanner-report-preview"><strong>پیش‌نمایش · <span dir="rtl" style={{ unicodeBidi: 'isolate', display: 'inline-block' }}>{(()=>{const [from,to]=(preview.period_key||'').split('..');const formatJalali=(value:string)=>{const date=value.slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return date;return new Intl.DateTimeFormat('fa-IR-u-ca-persian',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));};const first=formatJalali(from||'');const last=formatJalali(to||'');return !last||first===last?first:first+' تا '+last;})()}</span></strong><small>{preview.reviewed_images} تصویر تأییدشده · {preview.days?.length||0} روز · {preview.id_count} ردیف ID روزانه · {preview.unique_id_count||0} ID یکتای کل بازه · {preview.duplicate_count||0} تکراری دقیق · {preview.messages?.length||0} پیام متنی</small>{(preview.duplicates||[]).length>0&&<><div className="scanner-report-id-list" dir="ltr">{preview.duplicates.map((item:any,index:number)=><div key={item.id+'-'+index}><strong>{item.id}</strong><small>{item.date_label||item.date_key} · اولین تصویر: {names.get(item.first_scan_id)||item.first_scan_id} · تصویر تکراری: {names.get(item.duplicate_scan_id)||item.duplicate_scan_id}</small></div>)}</div><label className="scanner-duplicate-confirm"><input type="checkbox" checked={duplicateReviewed} onChange={e=>setDuplicateReviewed(e.target.checked)}/> موارد تکراری دقیق را بررسی کردم و حذف تکرارها را تأیید می‌کنم.</label></>}<div className="scanner-report-days">{(preview.days||[]).map((day:any)=><section className="scanner-report-day" key={day.date_key}><strong>{day.weekday} · {day.jalali_date}</strong><small>{day.scan_count} تصویر ثبت‌شده · {day.reviewed_images} تصویر تأییدشده · {day.ids.length} ID یکتا</small>{day.ids.length?<div className="scanner-report-ids" dir="ltr">{day.ids.map((id:string,index:number)=><div key={day.date_key+'-'+index}>{index+1}. {id}</div>)}</div>:<small>شناسه تأییدشده‌ای برای این روز ثبت نشده است.</small>}</section>)}</div></div>}
  </div>
  </>:null}
  {mode==='all'||mode==='history'?<>
  <div id="scanner-delivery-history" className="scanner-delivery-history">
   <div className="scanner-section-heading"><div><h3>تاریخچه ارسال‌های تلگرام</h3><p>نسخه گزارش، وضعیت تحویل و شناسه پیام‌های ارسالی</p></div><button type="button" className="scanner-ghost" disabled={historyLoading} onClick={()=>void loadDeliveryHistory()}>{historyLoading?'در حال بارگذاری…':'به‌روزرسانی تاریخچه'}</button></div>
   {deliveryHistory.length?deliveryHistory.map((item:any)=><article className="scanner-history-item" key={item.id}>
    <strong>نسخه {item.report?.version??'—'} · {item.report?.period_key??'بازه نامشخص'}</strong>
    <small>{item.status==='sent'?'ارسال‌شده':item.status==='failed'?'ناموفق':item.status==='sending'?'در حال ارسال':'در انتظار'} · {item.message_count} پیام · {new Date(item.created_at).toLocaleString('fa-IR')}</small>
    {item.sent_at&&<small>زمان ارسال: {new Date(item.sent_at).toLocaleString('fa-IR')}</small>}
    {item.message_ids?.length>0&&<small>شناسه پیام‌ها: {item.message_ids.join('، ')}</small>}
    {item.report?.excel_attached&&<small>فایل Excel پیوست‌شده: {item.report.excel_filename||'PLATO-ID-Report.xlsx'}</small>}
    {item.last_error&&<small>{item.last_error}</small>}
   </article>):<p className="scanner-empty">هنوز سابقه ارسالی ثبت نشده است.</p>}
  </div>
  </>:null}
  <p className="scanner-report-disclaimer">تطابق فقط بر اساس متن دقیق انجام می‌شود؛ بزرگی و کوچکی حروف و نشانه‌ها تغییر نمی‌کند. سوابق OCR و بازبینی قبلی حذف یا بازنویسی نمی‌شوند.</p>
 </section>;
}

function ScannerWorkspaceView({view,setView,sectionMode='all',archiveDate,setArchiveDate,archiveDays,archiveRows,todayRows,todayLabel,uploads,onDelete,onScanUpdated,onReviewApproved,setFiles,setMessage,files,fileChecking,busy,selectFiles,upload,uploadSuccessRows=[],onContinueToOcr,client,reviewerId}:any){
 return <div className="scanner-flow">
  {sectionMode==='all'&&<GlobalUniqueIdsPanel uploads={uploads}/>}
 {sectionMode==='all'&&<nav className="scanner-view-switch" aria-label="بخش‌های اسکنر">
   <button type="button" className={view==='new'?'active':''} onClick={()=>setView('new')}>＋ اسکن جدید</button>
   <button type="button" className={view==='archive'?'active':''} onClick={()=>setView('archive')}>▤ آرشیو تصاویر <i>{uploads.length}</i></button>
  </nav>}
  {(sectionMode==='all'||sectionMode==='upload'||sectionMode==='ocr')&&view==='new'?<div className="scanner-new-flow">
   {(sectionMode==='all'||sectionMode==='upload')&&<form id="scanner-upload-new" className="scanner-panel scanner-upload scanner-upload-new" onSubmit={upload}>
    <div className="scanner-section-heading"><span className="scanner-step">۱</span><div><h2>افزودن تصویر جدید</h2><p>هر بار فقط یک تصویر آپلود کن؛ بعد از مشاهده نتیجه، تصویر بعدی را انتخاب کن.</p></div></div>
    <label className="scanner-drop"><span className="scanner-upload-icon">↑</span><strong>انتخاب یک تصویر برای اسکن</strong><small>{fileChecking?'در حال بررسی تصویر…':files.length?'یک تصویر معتبر آماده آپلود است.':'JPG، PNG یا WEBP · حداکثر ۱۵ مگابایت'}</small><input id="plato-scanner-files" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e:any)=>void selectFiles(e.target.files)}/></label>
    {files.length>0&&<><ul className="scanner-selected-files">{files.map((f:File,i:number)=><li key={f.name+'-'+i}>{f.name}<span>{(f.size/1024/1024).toFixed(2)} MB</span></li>)}</ul><button type="button" className="scanner-ghost scanner-delete-button" disabled={busy||fileChecking} onClick={()=>{setFiles([]);const input=document.getElementById('plato-scanner-files') as HTMLInputElement|null;if(input)input.value='';setMessage('تصویر انتخاب‌شده از فرم پاک شد؛ هنوز در سرور ذخیره نشده بود.');}}>حذف تصویر انتخاب‌شده</button></>}
    <button className="scanner-primary" disabled={!files.length||busy||fileChecking}>{fileChecking?'در حال بررسی…':busy?'در حال ذخیره تصاویر…':'ذخیره تصاویر انتخاب‌شده'}</button>
    {uploadSuccessRows.length>0&&<div className="scanner-upload-success" role="status" aria-live="polite"><div className="scanner-upload-success-heading"><span aria-hidden="true">✓</span><strong>{uploadSuccessRows.length===1?'تصویر با موفقیت ذخیره شد':uploadSuccessRows.length+' تصویر با موفقیت ذخیره شدند'}</strong></div><p>{uploadSuccessRows.map((row:ScanRow)=>row.file_name).join('، ')}</p><small>مرحله بعد: وارد «استخراج و بررسی» شوید و برای تصویر ذخیره‌شده، پردازش OCR را شروع کنید. تصویر هنوز فقط ذخیره شده و OCR خودکار اجرا نشده است.</small><button type="button" className="scanner-primary scanner-upload-next-step" onClick={onContinueToOcr}>رفتن به استخراج و بررسی ←</button></div>}
   </form>}
   {(sectionMode==='all'||sectionMode==='ocr')&&<ScannerOcrQueue rows={todayRows} client={client} reviewerId={reviewerId} onDelete={onDelete} onScanUpdated={onScanUpdated} onReviewApproved={onReviewApproved}/>}
  </div>:null}
  {(sectionMode==='all'||sectionMode==='archive')&&view==='archive'?<section className="scanner-panel scanner-archive-panel">
   <div className="scanner-section-heading"><span className="scanner-step">▤</span><div><h2>آرشیو اسکن‌ها</h2><p>سوابق را بر اساس روز انتخاب کن و نتیجه هر تصویر را دوباره ببین.</p></div></div>
   <label className="scanner-archive-filter">انتخاب روز<select value={archiveDate} onChange={(e:any)=>setArchiveDate(e.target.value)}><option value="all">همه روزها</option>{archiveDays.map((d:string)=><option value={d} key={d}>{d.replace(/\d/g,n=>'۰۱۲۳۴۵۶۷۸۹'[Number(n)])}</option>)}</select></label>
   <div className="scanner-archive-summary"><strong>{archiveRows.length}</strong><span>تصویر در این فهرست</span></div>
   <UploadList rows={archiveRows} client={client} reviewerId={reviewerId} onDelete={onDelete} onScanUpdated={onScanUpdated}/>
  </section>:null}
 </div>;
}
function ScannerOcrQueue({rows,client,reviewerId,onDelete,onScanUpdated,onReviewApproved}:{rows:ScanRow[];client:any;reviewerId:string;onDelete:(row:ScanRow)=>void;onScanUpdated:(row:ScanRow)=>void;onReviewApproved:(id:string)=>void}){
 const [reviewedIds,setReviewedIds]=useState<Set<string>>(new Set());
 const [checking,setChecking]=useState(true);
 useEffect(()=>{
  let alive=true;
  (async()=>{
   setChecking(true);
   try{
    const results=await Promise.all(rows.map(row=>loadScannerReviewRevisions(client,row.id)));
    if(!alive)return;
    const approved=new Set<string>();
    results.forEach((history,index)=>{if(history.some(item=>item.status==='approved'))approved.add(rows[index].id);});
    setReviewedIds(approved);
   }catch(e){if(alive)setReviewedIds(new Set());}
   finally{if(alive)setChecking(false);}
  })();
  return()=>{alive=false;};
 },[client,rows.map(row=>row.id).join('|')]);
 const queue=rows.filter(row=>!reviewedIds.has(row.id)&&['uploaded','queued','needs_review'].includes(row.status));
 const current=queue[0]||null;
 return <section id="scanner-queue-panel" className="scanner-panel scanner-queue-panel">
  <div className="scanner-section-heading"><span className="scanner-step">۲</span><div><h2>صف پردازش و بازبینی OCR</h2><p>هر تصویر فقط یک‌بار پردازش می‌شود. پس از پایان OCR، بازبینی انسانی انجام بده و با تأیید نهایی تصویر را به آرشیو بفرست.</p></div></div>
  <div className="scanner-archive-summary"><strong>{queue.length}</strong><span>تصویر باقی‌مانده در صف امروز</span></div>
  {checking?<div className="scanner-empty-state">در حال بررسی سوابق تأیید تصاویر…</div>
   :current?<><div className="scanner-queue-position"><strong>تصویر بعدی برای رسیدگی</strong><small>{current.file_name}</small></div>
     <ScannerReviewCard key={current.id} row={current} client={client} reviewerId={reviewerId} onDelete={onDelete} onScanUpdated={onScanUpdated} queueMode onReviewApproved={(id)=>{setReviewedIds(prev=>new Set([...prev,id]));onReviewApproved(id);}}/>
     <p className="scanner-report-disclaimer">تصاویر به‌ترتیب رسیدگی می‌شوند؛ پس از تأیید نهایی، تصویر جاری از صف خارج می‌شود و تصویر بعدی نمایش داده خواهد شد.</p>
    </>
   :<div className="scanner-empty-state"><strong>{rows.length?'همه تصاویر این صف تأیید نهایی شده‌اند':'تصویری برای پردازش یا بازبینی وجود ندارد'}</strong><small>{rows.length?'تصاویر تأییدشده از صف OCR خارج شده‌اند. برای مشاهده آن‌ها به آرشیو تصاویر برو.':'تصویر جدید را از بخش آپلود اضافه کن؛ OCR به‌صورت خودکار اجرا نمی‌شود.'}</small></div>}
 </section>;
}
function UploadList({rows,client,reviewerId,onDelete,onScanUpdated}:{rows:ScanRow[];client:any;reviewerId:string;onDelete:(row:ScanRow)=>void;onScanUpdated:(row:ScanRow)=>void}){
  if(!rows.length)return <p className="scanner-empty">هنوز تصویری ذخیره نشده است.</p>;
  return <div className="scanner-upload-list">{rows.map(row=><ScannerReviewCard key={row.id} row={row} client={client} reviewerId={reviewerId} onDelete={onDelete} onScanUpdated={onScanUpdated}/>)}</div>;
 }
 function SavedUploadItem({row,client}:{row:ScanRow;client:any}){
  const [url,setUrl]=useState('');
  useEffect(()=>{let active=true;client.storage.from(BUCKET).createSignedUrl(row.storage_path,300).then(({data,error}:any)=>{if(active&&!error)setUrl(data?.signedUrl||'');});return()=>{active=false;};},[client,row.storage_path]);
  return <article className="scanner-review-card">
   <div className="scanner-review-heading"><div><strong>{row.file_name}</strong><small>{new Date(row.created_at).toLocaleString('fa-IR')} · {(row.file_size/1024/1024).toFixed(2)} MB</small></div><span className="scanner-status">ذخیره‌شده</span></div>
   {url&&<a className="scanner-image-link" href={url} target="_blank" rel="noreferrer"><img src={url} alt={'تصویر ذخیره‌شده '+row.file_name}/></a>}
  </article>;
 }
 function ScannerReviewCard({row,client,reviewerId,onDelete,onScanUpdated,queueMode=false,onReviewApproved}:{row:ScanRow;client:any;reviewerId:string;onDelete:(row:ScanRow)=>void;onScanUpdated:(row:ScanRow)=>void;queueMode?:boolean;onReviewApproved?:(id:string)=>void}){
 const [scan,setScan]=useState<ScanRow>(row);
 useEffect(()=>{setScan(row);},[row]);
 const [history,setHistory]=useState<any[]>([]),[draft,setDraft]=useState(''),[note,setNote]=useState(''),[imageUrl,setImageUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loaded,setLoaded]=useState(false);
 useEffect(()=>{
  let alive=true;
  (async()=>{
   try{
    const [revisions,signed]=await Promise.all([
     loadScannerReviewRevisions(client,scan.id),
     client.storage.from(BUCKET).createSignedUrl(scan.storage_path,300),
    ]);
    if(!alive)return;
    setHistory(revisions);
    const latest=revisions[revisions.length-1];
    const initial=latest?.canonical_ids??(Array.isArray(scan.ocr_result?.ids)?scan.ocr_result.ids:[]);
    setDraft(scannerReviewText(initial));
    if(signed.error)throw signed.error;
    setImageUrl(signed.data?.signedUrl||'');
   }catch(e:any){if(alive)setError(e?.message||'بارگذاری اطلاعات بازبینی ناموفق بود.');}
   finally{if(alive)setLoaded(true);}
  })();
  return()=>{alive=false;};
 },[client,scan.id,scan.storage_path,scan.ocr_result]);
 async function save(){
  if(busy||!loaded||scan.status!=='needs_review'||scan.ocr_result?.outcome!=='succeeded')return;
  setBusy(true);setError('');
  try{
   const ids=parseScannerReviewDraft(draft);
   const result=await appendScannerReviewRevision(client,{scanId:scan.id,ids,reviewerId,note});
   setHistory(prev=>[...prev,result]);setDraft(scannerReviewText(result.canonical_ids));setNote('');
   onScanUpdated(scan);
   if(queueMode)onReviewApproved?.(scan.id);
  }catch(e:any){setError(e?.message||'ثبت تأیید نهایی ناموفق بود.');}
  finally{setBusy(false);}
 }
 const latest=history[history.length-1];
 const [dispatchBusy,setDispatchBusy]=useState(false),[dispatchMessage,setDispatchMessage]=useState('');
 async function refreshScan(){
  const {data,error}=await client.from('plato_id_scanner_uploads').select('*').eq('id',scan.id).single();
  if(!error&&data){setScan(data as ScanRow);onScanUpdated(data as ScanRow);}
  return error?null:data as ScanRow;
 }
 async function dispatchOcr(){
  if(dispatchBusy||scan.status!=='uploaded')return;setDispatchBusy(true);setDispatchMessage('');
  try{
   const {data,error}=await client.functions.invoke('plato-id-scanner-dispatch',{body:{scan_id:scan.id}});
   if(error){
    const latest=await refreshScan();
    const status=(error as any)?.context?.status;
    if(latest?.status==='needs_review'&&latest.ocr_result?.outcome==='succeeded'){
     setDispatchMessage('پردازش OCR قبلاً با موفقیت انجام شده است؛ نتیجه برای بازبینی آماده است.');return;
    }
    if(status===409){setDispatchMessage('این تصویر قبلاً وارد صف پردازش شده است. وضعیت تازه پرونده بارگذاری شد؛ چند لحظه بعد دوباره بررسی کنید.');return;}
    throw error;
   }
   await refreshScan();
   const worker=data?.worker;
   if(!data?.queued){setDispatchMessage('درخواست در صف ثبت نشد؛ پاسخ سرویس کامل نبود.');}
   else if(!worker?.invoked){setDispatchMessage('درخواست در صف ثبت شد، اما Worker اجرا نشد ('+(worker?.reason||'علت نامشخص')+').');}
   else if(worker.http_status!==200){setDispatchMessage('درخواست در صف ثبت شد، اما اجرای Worker ناموفق بود (HTTP '+String(worker.http_status??'نامشخص')+'). '+(worker.response_text==='Unauthorized'?'احراز کلید داخلی Worker رد شد.':'لطفاً گزارش فنی بررسی شود.'));}
   else if(worker.processed===1&&worker.status==='needs_review'){setDispatchMessage('پردازش OCR انجام شد و نتیجه برای بازبینی آماده است.');}
   else{setDispatchMessage('Worker پاسخ داد، اما تکمیل OCR تأیید نشد؛ وضعیت: '+String(worker.status||'نامشخص')+'.');}
   await refreshScan();
  }catch(e:any){await refreshScan();setDispatchMessage(e?.message||'ارسال درخواست پردازش ناموفق بود.');}
  finally{setDispatchBusy(false);}
 }
 return <article className="scanner-review-card">
  <div className="scanner-review-heading"><div><strong>{scan.file_name}</strong><small>{new Date(scan.created_at).toLocaleString('fa-IR')} · {(scan.file_size/1024/1024).toFixed(2)} MB</small></div><span className="scanner-status">{latest?'تأیید انسانی ثبت‌شده · نسخه '+latest.revision:scan.status==='needs_review'&&scan.ocr_result?.outcome==='succeeded'?'در انتظار بازبینی انسانی':scan.status==='uploaded'?'در انتظار اولین پردازش OCR':scan.status==='queued'?'پردازش OCR در صف':scan.status}</span></div>
  <div className="scanner-review-meta"><button type="button" className="scanner-ghost scanner-delete-button" disabled={busy||dispatchBusy} onClick={()=>onDelete(scan)}>حذف تصویر و سوابق آن</button></div>
  {imageUrl&&<a className="scanner-image-link" href={imageUrl} target="_blank" rel="noreferrer"><img src={imageUrl} alt={'تصویر اصلی '+scan.file_name}/></a>}
  {scan.ocr_result?.duplicate_audit&&<details className="scanner-review-history scanner-duplicate-audit">
   <summary>گزارش تکراری‌ها: {scan.ocr_result.duplicate_audit.duplicate_count??0} مورد · {scan.ocr_result.duplicate_audit.unique_count??0} شناسه یکتا</summary>
   <div className="scanner-report-stats">
    <div><strong>{scan.ocr_result.duplicate_audit.total_occurrences??0}</strong><small>کل موارد استخراج‌شده</small></div>
    <div><strong>{scan.ocr_result.duplicate_audit.unique_count??0}</strong><small>شناسه یکتا</small></div>
    <div><strong>{scan.ocr_result.duplicate_audit.duplicate_count??0}</strong><small>تکراری دقیق</small></div>
   </div>
   {(scan.ocr_result.duplicate_audit.duplicates||[]).length>0
    ? <div className="scanner-report-id-list" dir="ltr">{scan.ocr_result.duplicate_audit.duplicates.map((item:any,index:number)=><div key={scan.id+'-duplicate-'+index}>
      <strong>{item.raw_value}</strong><small>تکرار {item.duplicate_number} · مورد اصلی: {item.duplicate_of_scan_id} / #{item.duplicate_of_candidate_index}</small>
     </div>)}</div>
    : <p className="scanner-empty">در این تصویر تکراری دقیقی ثبت نشده است.</p>}
   <p className="scanner-report-disclaimer">این گزارش فقط موارد کاملاً یکسان را تکراری می‌شمارد؛ موارد مشابه جدا باقی می‌مانند.</p>
  </details>}
  {scan.status==='uploaded'&&<div className="scanner-review-meta">
   <button className="scanner-primary" type="button" disabled={dispatchBusy} onClick={()=>void dispatchOcr()}>{dispatchBusy?'در حال ثبت درخواست…':'شروع پردازش OCR'}</button>
   {dispatchMessage&&<small>{dispatchMessage}</small>}
  </div>}
  {scan.status==='needs_review'&&scan.ocr_result?.outcome==='succeeded'?<>
   <div className="scanner-review-meta"><strong>بازبینی انسانی · تأیید نهایی</strong><small>{latest?'آخرین نسخه ثبت‌شده: '+latest.revision:'نتیجه OCR آماده تطبیق با تصویر اصلی است.'}</small></div>
   <textarea className="scanner-review-textarea" dir="ltr" spellCheck={false} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="شناسه‌ها را با تصویر اصلی تطبیق بده؛ هر Plato ID در یک خط." rows={Math.min(10,Math.max(4,draft.split('\n').length))}/>
   <input className="scanner-review-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="یادداشت بازبینی (اختیاری)"/>
   <button className="scanner-primary" type="button" disabled={!loaded||busy||!draft.trim()} onClick={()=>void save()}>{busy?'در حال ثبت تأیید…':queueMode?'تأیید نهایی و انتقال به آرشیو':'ثبت نسخهٔ اصلاح‌شده در آرشیو'}</button>
  </>:scan.status==='uploaded'?<div className="scanner-empty-state"><strong>در انتظار شروع OCR</strong><small>برای این تصویر هنوز پردازش اجرا نشده است.</small></div>
   :<div className="scanner-empty-state"><strong>{scan.status==='queued'?'پردازش OCR در صف یا در حال اجراست':'این تصویر در وضعیت «'+scan.status+'» قرار دارد'}</strong><small>OCR دوباره اجرا نمی‌شود. پس از ثبت نتیجهٔ موفق، بازبینی انسانی فعال خواهد شد.</small></div>}
  {error&&<p className="scanner-review-error">{error}</p>}
  {history.length>0&&<details className="scanner-review-history"><summary>تاریخچه نسخه‌ها ({history.length})</summary>{history.map(item=><div key={item.id} className="scanner-history-item"><strong>نسخه {item.revision}</strong><small>{new Date(item.reviewed_at).toLocaleString('fa-IR')} · {item.reviewer_id}</small><p dir="ltr">{item.canonical_ids.join(' · ')}</p>{item.note&&<small>{item.note}</small>}</div>)}</details>}
 </article>;
}
