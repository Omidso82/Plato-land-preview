import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import './plato-id-scanner.css';
import { parseScannerReviewDraft } from './plato-id-scanner-review';
import { auditScannerBatchDuplicates } from './plato-id-scanner-duplicate-audit';
import { appendScannerReviewRevision, loadScannerReviewRevisions, scannerReviewText } from './plato-id-scanner-review-store';

type AccessRow={user_id:string;email:string;status:'pending'|'approved'|'rejected'|'disabled';requested_at:string;reviewed_at:string|null};
type ScanRow={id:string;operator_id:string;storage_path:string;file_name:string;content_type:string;file_size:number;status:string;ocr_result:any;created_at:string};
const BUCKET='plato-id-scans', MAX_FILE_SIZE=15*1024*1024, ACCEPTED=['image/jpeg','image/png','image/webp'];

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
 const [access,setAccess]=useState<AccessRow|null>(null),[applications,setApplications]=useState<AccessRow[]>([]),[uploads,setUploads]=useState<ScanRow[]>([]),[files,setFiles]=useState<File[]>([]),[fileChecking,setFileChecking]=useState(false);
 const refreshGeneration=useRef(0);
 const [scannerView,setScannerView]=useState<'new'|'archive'>('new');
 const [archiveDate,setArchiveDate]=useState('all');
 const dateKey=(value:string)=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
 const archiveDays=Array.from(new Set(uploads.map(x=>dateKey(x.created_at))));
 const archiveRows=uploads.filter(x=>archiveDate==='all'||dateKey(x.created_at)===archiveDate);
 const pendingRows=uploads.filter(x=>x.status==='uploaded'||x.status==='queued');

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
    const [apps,scans]=await Promise.all([supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').order('requested_at',{ascending:false}),supabase.from('plato_id_scanner_uploads').select('*').order('created_at',{ascending:false}).limit(100)]);
    if(generation!==refreshGeneration.current)return;
    if(apps.error)setMessage('بارگذاری درخواست‌ها ناموفق بود: '+apps.error.message);else setApplications((apps.data||[]) as AccessRow[]);
    if(scans.error)setMessage('بارگذاری آپلودها ناموفق بود: '+scans.error.message);else setUploads((scans.data||[]) as ScanRow[]);
    setAccess(null);return;
   }
   let {data:row,error}=await supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').eq('user_id',u.id).maybeSingle();
   if(generation!==refreshGeneration.current)return;
   if(error){setMessage('دریافت وضعیت دسترسی ناموفق بود: '+error.message);return;}
   if(!row){const created=await supabase.from('plato_id_scanner_access').insert({user_id:u.id,email:u.email||''}).select('user_id,email,status,requested_at,reviewed_at').single();if(generation!==refreshGeneration.current)return;if(created.error){setMessage('ثبت درخواست دسترسی ناموفق بود: '+created.error.message);return;}row=created.data;}
   setAccess(row as AccessRow);
   if(row.status!=='approved'){setUploads([]);return;}
   const {data:own,error:ownError}=await supabase.from('plato_id_scanner_uploads').select('*').eq('operator_id',u.id).order('created_at',{ascending:false});
   if(generation!==refreshGeneration.current)return;
   if(ownError)setMessage('دریافت سوابق آپلود ناموفق بود: '+ownError.message);else setUploads((own||[]) as ScanRow[]);
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
  setFiles([]);setMessage('');if(!list||!list.length)return;setFileChecking(true);
  try{
   const selected=Array.from(list);const valid:File[]=[];const errors:string[]=[];
   for(const f of selected){try{await validateImage(f);valid.push(f);}catch(err:any){errors.push(f.name+': '+(err?.message||'فایل نامعتبر'))}}
   setFiles(valid);
   if(errors.length)setMessage(errors.join(' | ')+(valid.length?' — تصاویر معتبر برای آپلود نگه داشته شدند.':''));
   else setMessage(valid.length+' تصویر بررسی شد و آماده آپلود است.');
  }finally{setFileChecking(false);}
 }
 async function upload(e:React.FormEvent){
  e.preventDefault();if(!supabase||!user||(!owner&&access?.status!=='approved')||!files.length||busy||fileChecking)return;
  setBusy(true);setMessage('');const completed:ScanRow[]=[];const failures:string[]=[];
  for(const file of files){
   const id=crypto.randomUUID(),safeBase=(file.name.replace(/[^a-zA-Z0-9_-]/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'').slice(0,100)||'upload'),extension=file.type==='image/jpeg'?'.jpg':file.type==='image/png'?'.png':'.webp',path=user.id+'/'+id+'/'+safeBase+extension;
   try{
    const stored=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});if(stored.error)throw stored.error;
    const saved=await supabase.from('plato_id_scanner_uploads').insert({id,operator_id:user.id,storage_path:path,file_name:file.name,content_type:file.type,file_size:file.size,status:'uploaded'}).select('*').single();
    if(saved.error){await supabase.storage.from(BUCKET).remove([path]);throw saved.error;}
    completed.push(saved.data as ScanRow);
   }catch(err:any){failures.push(file.name+': '+(err?.message||'خطا در آپلود'));}
  }
  if(completed.length)setUploads(prev=>[...completed,...prev]);
  setFiles([]);const input=document.getElementById('plato-scanner-files') as HTMLInputElement|null;if(input)input.value='';
  setMessage((completed.length?'تعداد '+completed.length+' تصویر به‌صورت پرونده‌های مستقل ذخیره شد. ':'')+(failures.length?'موارد ناموفق: '+failures.join(' | '):'')+' اکنون برای هر تصویر، از کارت همان تصویر دکمه «شروع پردازش OCR» را بزن. نتیجه پس از پردازش برای بازبینی نمایش داده می‌شود؛ ارسال تلگرام خودکار انجام نمی‌شود.');
  setBusy(false);
 }
 if(loading)return <Root className={"plato-scanner-shell"+(embedded?" scanner-embedded":"")} dir="rtl"><div className="plato-scanner-card">در حال بررسی حساب…</div></Root>;
 return <Root className={"plato-scanner-shell"+(embedded?" scanner-embedded":"")} dir="rtl">
  <header className="plato-scanner-header"><div className="plato-scanner-brand"><span>♛</span><div><strong>PLATO LAND</strong><small>PLATO ID SCANNER</small></div></div>{user&&!ownerMode&&<button className="scanner-ghost" onClick={signOut}>خروج</button>}</header>
  {!user?<section className="plato-scanner-card scanner-auth"><span className="scanner-eyebrow">پنل مستقل اپراتور</span><h1>{mode==='register'?'ساخت حساب اپراتور':'ورود به اسکنر'}</h1><p>دسترسی فقط پس از تأیید ایمیل و تأیید مالک فعال می‌شود.</p><form onSubmit={authSubmit}><label>ایمیل<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>رمز عبور<input type="password" required minLength={8} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="scanner-primary" disabled={busy}>{busy?'لطفاً صبر کنید…':mode==='register'?'ثبت‌نام و ارسال ایمیل تأیید':'ورود امن'}</button></form><button className="scanner-link" onClick={()=>{setMode(mode==='register'?'login':'register');setMessage('');}}>{mode==='register'?'قبلاً حساب ساخته‌اید؟ ورود':'حساب ندارید؟ ثبت‌نام اپراتور'}</button></section>
  :!confirmed?<section className="plato-scanner-card"><h1>تأیید ایمیل لازم است</h1><p>لینک ارسال‌شده به {user.email} را باز کنید؛ سپس دوباره وارد شوید.</p><button className="scanner-primary" onClick={signOut}>بازگشت به ورود</button></section>
  :owner?<section className="scanner-workspace"><div className="scanner-welcome"><div><span className="scanner-eyebrow">دسترسی مالک</span><h1>مدیریت گزارش‌گیری Plato IDهای فعال</h1><p>مدیریت دسترسی اپراتورها و پردازش تصاویر ورودی</p></div><span className="scanner-status approved">مالک</span></div>
    <div className="scanner-panel scanner-access-panel"><h2>درخواست‌های اپراتورها</h2>{applications.length===0?<p className="scanner-empty">درخواستی ثبت نشده است.</p>:applications.map(a=><article className="scanner-row" key={a.user_id}><div><strong>{a.email}</strong><small>{new Date(a.requested_at).toLocaleString('fa-IR')}</small><span className={'scanner-status '+a.status}>{a.status==='pending'?'در انتظار بررسی':a.status==='approved'?'تأییدشده':a.status==='rejected'?'ردشده':'غیرفعال'}</span></div><div className="scanner-actions"><button disabled={busy||a.status==='approved'} onClick={()=>void review(a.user_id,'approved')}>تأیید</button><button disabled={busy||a.status==='rejected'} onClick={()=>void review(a.user_id,'rejected')}>رد</button><button disabled={busy||a.status==='disabled'} onClick={()=>void review(a.user_id,'disabled')}>غیرفعال‌سازی</button></div></article>)}</div>
    <ScannerWorkspaceView view={scannerView} setView={setScannerView} archiveDate={archiveDate} setArchiveDate={setArchiveDate} archiveDays={archiveDays} archiveRows={archiveRows} pendingRows={pendingRows} uploads={uploads} files={files} fileChecking={fileChecking} busy={busy} selectFiles={selectFiles} upload={upload} client={supabase} reviewerId={user.id}/>
   </section>
   :access?.status!=='approved'?<section className="plato-scanner-card"><span className={'scanner-status '+(access?.status||'pending')}>{access?.status==='rejected'?'درخواست رد شده':access?.status==='disabled'?'دسترسی غیرفعال':'در انتظار تأیید مالک'}</span><h1>{access?.status==='rejected'?'درخواست دسترسی تأیید نشد':access?.status==='disabled'?'دسترسی شما غیرفعال است':'حساب شما در صف بررسی است'}</h1><p>{access?.status==='pending'?'ایمیل شما تأیید شده است. پس از بررسی مالک، امکان آپلود فعال می‌شود.':'برای پیگیری با مالک PLATO LAND تماس بگیرید.'}</p></section>
  :<section className="scanner-workspace"><div className="scanner-welcome"><div><span className="scanner-eyebrow">پنل اپراتور</span><h1>گزارش‌گیری از Plato IDهای فعال</h1><p>تصاویر کارت‌ها و Guideها را بارگذاری کن، پردازش کن و نتیجه را بازبینی کن.</p></div><span className="scanner-status approved">دسترسی فعال</span></div>
    <ScannerWorkspaceView view={scannerView} setView={setScannerView} archiveDate={archiveDate} setArchiveDate={setArchiveDate} archiveDays={archiveDays} archiveRows={archiveRows} pendingRows={pendingRows} uploads={uploads} files={files} fileChecking={fileChecking} busy={busy} selectFiles={selectFiles} upload={upload} client={supabase} reviewerId={user.id}/>
   </section>}}
  {message&&<p className="scanner-message" role="status">{message}</p>}<footer className="scanner-footer">PLATO LAND · دسترسی محدود و مستقل</footer>
 </Root>;
}

function ScannerWorkspaceView({view,setView,archiveDate,setArchiveDate,archiveDays,archiveRows,pendingRows,uploads,files,fileChecking,busy,selectFiles,upload,client,reviewerId}:any){
 return <div className="scanner-flow">
  <nav className="scanner-view-switch" aria-label="بخش‌های اسکنر">
   <button type="button" className={view==='new'?'active':''} onClick={()=>setView('new')}>＋ اسکن جدید</button>
   <button type="button" className={view==='archive'?'active':''} onClick={()=>setView('archive')}>▤ آرشیو تصاویر <i>{uploads.length}</i></button>
  </nav>
  {view==='new'?<div className="scanner-new-flow">
   <form className="scanner-panel scanner-upload scanner-upload-new" onSubmit={upload}>
    <div className="scanner-section-heading"><span className="scanner-step">۱</span><div><h2>افزودن تصاویر</h2><p>یک یا چند کارت یا Guide را انتخاب کن. هر تصویر جداگانه ذخیره می‌شود.</p></div></div>
    <label className="scanner-drop"><span className="scanner-upload-icon">↑</span><strong>انتخاب تصاویر برای اسکن</strong><small>{fileChecking?'در حال بررسی تصاویر…':files.length?files.length+' تصویر معتبر آماده آپلود است.':'JPG، PNG یا WEBP · حداکثر ۱۵ مگابایت برای هر تصویر'}</small><input id="plato-scanner-files" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e:any)=>void selectFiles(e.target.files)}/></label>
    {files.length>0&&<ul className="scanner-selected-files">{files.map((f:File,i:number)=><li key={f.name+'-'+i}>{f.name}<span>{(f.size/1024/1024).toFixed(2)} MB</span></li>)}</ul>}
    <button className="scanner-primary" disabled={!files.length||busy||fileChecking}>{fileChecking?'در حال بررسی…':busy?'در حال ذخیره تصاویر…':'ذخیره تصاویر انتخاب‌شده'}</button>
   </form>
   <section className="scanner-panel scanner-queue-panel"><div className="scanner-section-heading"><span className="scanner-step">۲</span><div><h2>در انتظار پردازش</h2><p>برای هر تصویر، پردازش OCR را جداگانه آغاز کن.</p></div></div>
    {pendingRows.length?<UploadList rows={pendingRows} client={client} reviewerId={reviewerId}/>:<div className="scanner-empty-state"><strong>هنوز تصویری برای پردازش نداریم</strong><small>ابتدا تصاویر مرحله قبل را اضافه کن.</small></div>}
   </section>
   {uploads.some((x:ScanRow)=>x.ocr_result?.ids?.length)&&<button type="button" className="scanner-archive-shortcut" onClick={()=>setView('archive')}>مشاهده نتایج و آرشیو کامل ←</button>}
  </div>:<section className="scanner-panel scanner-archive-panel">
   <div className="scanner-section-heading"><span className="scanner-step">▤</span><div><h2>آرشیو اسکن‌ها</h2><p>سوابق را بر اساس روز انتخاب کن و نتیجه هر تصویر را دوباره ببین.</p></div></div>
   <label className="scanner-archive-filter">انتخاب روز<select value={archiveDate} onChange={(e:any)=>setArchiveDate(e.target.value)}><option value="all">همه روزها</option>{archiveDays.map((d:string)=><option value={d} key={d}>{d}</option>)}</select></label>
   <div className="scanner-archive-summary"><strong>{archiveRows.length}</strong><span>تصویر در این فهرست</span></div>
   <UploadList rows={archiveRows} client={client} reviewerId={reviewerId}/>
  </section>}
 </div>;
}
function UploadList({rows,client,reviewerId}:{rows:ScanRow[];client:any;reviewerId:string}){
  if(!rows.length)return <p className="scanner-empty">هنوز تصویری ذخیره نشده است.</p>;
  return <div className="scanner-upload-list">{rows.map(row=><ScannerReviewCard key={row.id} row={row} client={client} reviewerId={reviewerId}/>)}</div>;
 }
 function SavedUploadItem({row,client}:{row:ScanRow;client:any}){
  const [url,setUrl]=useState('');
  useEffect(()=>{let active=true;client.storage.from(BUCKET).createSignedUrl(row.storage_path,300).then(({data,error}:any)=>{if(active&&!error)setUrl(data?.signedUrl||'');});return()=>{active=false;};},[client,row.storage_path]);
  return <article className="scanner-review-card">
   <div className="scanner-review-heading"><div><strong>{row.file_name}</strong><small>{new Date(row.created_at).toLocaleString('fa-IR')} · {(row.file_size/1024/1024).toFixed(2)} MB</small></div><span className="scanner-status">ذخیره‌شده</span></div>
   {url&&<a className="scanner-image-link" href={url} target="_blank" rel="noreferrer"><img src={url} alt={'تصویر ذخیره‌شده '+row.file_name}/></a>}
  </article>;
 }
 function ScannerReviewCard({row,client,reviewerId}:{row:ScanRow;client:any;reviewerId:string}){
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
  if(busy||!loaded)return;
  setBusy(true);setError('');
  try{
   const ids=parseScannerReviewDraft(draft);
   const result=await appendScannerReviewRevision(client,{scanId:scan.id,ids,reviewerId,note});
   setHistory(prev=>[...prev,result]);setDraft(scannerReviewText(result.canonical_ids));setNote('');
  }catch(e:any){setError(e?.message||'ثبت نسخه جدید ناموفق بود.');}
  finally{setBusy(false);}
 }
 const latest=history[history.length-1];
 const [dispatchBusy,setDispatchBusy]=useState(false),[dispatchMessage,setDispatchMessage]=useState('');
 async function refreshScan(){
  const {data,error}=await client.from('plato_id_scanner_uploads').select('*').eq('id',scan.id).single();
  if(!error&&data)setScan(data as ScanRow);
  return error?null:data as ScanRow;
 }
 async function dispatchOcr(){
  if(dispatchBusy)return;setDispatchBusy(true);setDispatchMessage('');
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
  <div className="scanner-review-heading"><div><strong>{scan.file_name}</strong><small>{new Date(scan.created_at).toLocaleString('fa-IR')} · {(scan.file_size/1024/1024).toFixed(2)} MB</small></div><span className="scanner-status">{latest?'بازبینی تأییدشده · نسخه '+latest.revision:Array.isArray(scan.ocr_result?.ids)&&scan.ocr_result.ids.length?'نتیجه OCR آماده بازبینی':scan.status==='uploaded'?'ذخیره شده – در انتظار پردازش OCR':scan.status}</span></div>
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
  {(scan.status==='uploaded'||scan.status==='queued')&&<div className="scanner-review-meta">
   <button className="scanner-primary" type="button" disabled={dispatchBusy} onClick={()=>void dispatchOcr()}>{dispatchBusy?'در حال ثبت درخواست…':'شروع پردازش OCR'}</button>
   {dispatchMessage&&<small>{dispatchMessage}</small>}
  </div>}
  <div className="scanner-review-meta"><strong>بازبینی دستی فهرست Plato ID</strong><small>{latest?'آخرین نسخه تأییدشده: '+latest.revision:'هنوز نسخه تأییدشده‌ای ثبت نشده است.'}</small></div>
  <textarea className="scanner-review-textarea" dir="ltr" spellCheck={false} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="هر Plato ID را در یک خط وارد کنید؛ مقایسه با تصویر اصلی انجام شود." rows={Math.min(10,Math.max(4,draft.split('\n').length))}/>
  <input className="scanner-review-note" value={note} onChange={e=>setNote(e.target.value)} placeholder="یادداشت اصلاح (اختیاری)"/>
  <button className="scanner-primary" type="button" disabled={!loaded||busy||!draft.trim()} onClick={()=>void save()}>{busy?'در حال ثبت نسخه…':'ثبت نسخه تأییدشده جدید'}</button>
  {error&&<p className="scanner-review-error">{error}</p>}
  {history.length>0&&<details className="scanner-review-history"><summary>تاریخچه نسخه‌ها ({history.length})</summary>{history.map(item=><div key={item.id} className="scanner-history-item"><strong>نسخه {item.revision}</strong><small>{new Date(item.reviewed_at).toLocaleString('fa-IR')} · {item.reviewer_id}</small><p dir="ltr">{item.canonical_ids.join(' · ')}</p>{item.note&&<small>{item.note}</small>}</div>)}</details>}
 </article>;
}
