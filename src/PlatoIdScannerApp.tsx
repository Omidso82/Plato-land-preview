import React,{useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';
import './plato-id-scanner.css';

type AccessRow={user_id:string;email:string;status:'pending'|'approved'|'rejected'|'disabled';requested_at:string;reviewed_at:string|null};
type ScanRow={id:string;operator_id:string;storage_path:string;file_name:string;content_type:string;file_size:number;status:string;created_at:string};
const BUCKET='plato-id-scans';
const MAX_BYTES=15*1024*1024;
const isOwnerRole=async(userId:string)=>{if(!supabase)return false;const {data,error}=await supabase.from('user_roles').select('role').eq('user_id',userId).maybeSingle();return !error&&data?.role==='owner';};

export default function PlatoIdScannerApp({ownerMode=false,embedded=false}:{ownerMode?:boolean;embedded?:boolean}){
 const [user,setUser]=useState<any>(null),[owner,setOwner]=useState(false),[access,setAccess]=useState<AccessRow|null>(null);
 const [applications,setApplications]=useState<AccessRow[]>([]),[uploads,setUploads]=useState<ScanRow[]>([]);
 const [files,setFiles]=useState<File[]>([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState('');
 const Root:React.ElementType=embedded?'div':'main';
 const load=useCallback(async(u:any,isOwner:boolean)=>{
  if(!supabase||!u)return;
  if(isOwner){
   const [a,s]=await Promise.all([
    supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').order('requested_at',{ascending:false}),
    supabase.from('plato_id_scanner_uploads').select('*').order('created_at',{ascending:false}).limit(100)
   ]);
   if(a.error||s.error)throw a.error||s.error;
   setApplications(a.data||[]);setUploads(s.data||[]);
  }else{
   let {data:a,error:ae}=await supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').eq('user_id',u.id).maybeSingle();
   if(ae)throw ae;
   if(!a){const created=await supabase.from('plato_id_scanner_access').insert({user_id:u.id,email:u.email||'',status:'pending'}).select('user_id,email,status,requested_at,reviewed_at').single();if(created.error)throw created.error;a=created.data;}
   setAccess(a);
   if(a?.status==='approved'){
    const {data:s,error:se}=await supabase.from('plato_id_scanner_uploads').select('*').eq('operator_id',u.id).order('created_at',{ascending:false});
    if(se)throw se;setUploads(s||[]);
   }else setUploads([]);
  }
 },[]);
 const refresh=useCallback(async()=>{
  if(!supabase){setMessage('اتصال به Supabase در دسترس نیست.');setLoading(false);return;}
  setLoading(true);
  try{
   const {data:{user:u},error}=await supabase.auth.getUser();if(error)throw error;
   if(!u){setUser(null);setOwner(false);setAccess(null);setLoading(false);return;}
   const own=await isOwnerRole(u.id);
   if(ownerMode&&!own){setMessage('دسترسی مالک تأیید نشد.');setUser(u);setOwner(false);setLoading(false);return;}
   setUser(u);setOwner(own);await load(u,own);
  }catch(e:any){setMessage(e?.message||'بارگذاری اطلاعات ناموفق بود.');}
  finally{setLoading(false);}
 },[load,ownerMode]);
 useEffect(()=>{void refresh();},[refresh]);
 async function authenticate(e:React.FormEvent,mode:'login'|'signup'){
  e.preventDefault();if(!supabase)return;setBusy(true);setMessage('');
  const form=e.currentTarget as HTMLFormElement;const fd=new FormData(form);
  const email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
  try{
   if(mode==='login'){const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;}
   else{const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/?page=id-scanner'}});if(error)throw error;setMessage('درخواست ساخت حساب ثبت شد. پس از تأیید ایمیل، وارد شوید؛ دسترسی اپراتور پس از تأیید مالک فعال می‌شود.');}
   if(mode==='login')await refresh();
  }catch(e:any){setMessage(e?.message||'ورود یا ثبت‌نام ناموفق بود.');}
  finally{setBusy(false);}
 }
 async function signOut(){await supabase?.auth.signOut();setUser(null);setOwner(false);setAccess(null);setUploads([]);setApplications([]);}
 async function review(userId:string,status:'approved'|'rejected'|'disabled'){
  if(!supabase||!owner||busy)return;setBusy(true);setMessage('');
  try{const {error}=await supabase.from('plato_id_scanner_access').update({status,reviewed_at:new Date().toISOString(),reviewed_by:user.id}).eq('user_id',userId);if(error)throw error;await refresh();}
  catch(e:any){setMessage(e?.message||'به‌روزرسانی دسترسی ناموفق بود.');}
  finally{setBusy(false);}
 }
 async function selectFiles(list:FileList|null){
  const chosen=Array.from(list||[]);const invalid=chosen.filter(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size<=0||f.size>MAX_BYTES);
  if(invalid.length){setMessage('فقط JPG، PNG یا WEBP با حجم حداکثر ۱۵ مگابایت برای هر تصویر پذیرفته می‌شود: '+invalid.map(f=>f.name).join('، '));setFiles([]);return;}
  setFiles(chosen);setMessage('');
 }
 async function upload(e:React.FormEvent){
  e.preventDefault();if(!supabase||!user||(!owner&&access?.status!=='approved')||!files.length||busy)return;
  setBusy(true);setMessage('در حال ذخیره تصاویر…');const done:string[]=[],failed:string[]=[];
  for(const file of files){
   const id=crypto.randomUUID(),base=(file.name.replace(/[^A-Za-z0-9_-]/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'').slice(0,100)||'image');
   const ext=file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp',path=user.id+'/'+id+'/'+base+'.'+ext;
   try{
    const stored=await supabase.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type});
    if(stored.error)throw stored.error;
    const {error}=await supabase.from('plato_id_scanner_uploads').insert({id,operator_id:user.id,storage_path:path,file_name:file.name,content_type:file.type,file_size:file.size,status:'uploaded',ocr_result:{}});
    if(error){await supabase.storage.from(BUCKET).remove([path]);throw error;}
    done.push(file.name);
   }catch(err:any){failed.push(file.name+' ('+(err?.message||'خطا')+')');}
  }
  setFiles([]);await load(user,owner).catch(()=>{});setMessage((done.length?'تصاویر ذخیره‌شده: '+done.length+' مورد. ':'')+(failed.length?'ناموفق: '+failed.join('؛ '):'')+(done.length?' تصاویر قبلی حفظ شدند.':''));setBusy(false);
 }
 async function signedUrl(path:string){if(!supabase)return '';const {data,error}=await supabase.storage.from(BUCKET).createSignedUrl(path,900);return error?'':data.signedUrl;}
 const [urls,setUrls]=useState<Record<string,string>>({});
 useEffect(()=>{let live=true;(async()=>{if(!supabase)return;const entries=await Promise.all(uploads.map(async row=>[row.id,await signedUrl(row.storage_path)] as const));if(live)setUrls(Object.fromEntries(entries));})();return()=>{live=false};},[uploads]);
 if(loading)return <Root dir="rtl" className={'plato-scanner-shell'+(embedded?' scanner-embedded':'')}><div className="scanner-panel">در حال بررسی حساب…</div></Root>;
 if(!user)return <Root dir="rtl" className={'plato-scanner-shell'+(embedded?' scanner-embedded':'')}><section className="plato-scanner-card"><h1>گزارش‌گیری از Plato IDهای فعال</h1><p>ورود اپراتور یا ایجاد حساب جدید</p><form onSubmit={e=>void authenticate(e,'login')}><label>ایمیل<input name="email" type="email" required autoComplete="username"/></label><label>رمز عبور<input name="password" type="password" required autoComplete="current-password"/></label><button className="scanner-primary" disabled={busy}>ورود</button></form><form onSubmit={e=>void authenticate(e,'signup')}><label>ایمیل برای ساخت حساب<input name="email" type="email" required/></label><label>رمز عبور (حداقل ۶ کاراکتر)<input name="password" type="password" minLength={6} required/></label><button className="scanner-ghost" disabled={busy}>درخواست حساب اپراتور</button></form>{message&&<p role="status">{message}</p>}</section></Root>;
 if(ownerMode&&!owner)return <Root dir="rtl" className={'plato-scanner-shell scanner-embedded'}><div className="scanner-panel">دسترسی مالک تأیید نشد.</div></Root>;
 return <Root dir="rtl" className={'plato-scanner-shell'+(embedded?' scanner-embedded':'')}>
  {!embedded&&<header className="plato-scanner-header"><strong>PLATO LAND · SCANNER</strong><button className="scanner-ghost" onClick={()=>void signOut()}>خروج</button></header>}
  {owner?<section className="scanner-workspace"><div className="scanner-welcome"><div><h1>مدیریت گزارش‌گیری Plato IDهای فعال</h1><p>مدیریت دسترسی اپراتورها و مشاهده تصاویر بارگذاری‌شده</p></div>{!ownerMode&&<button className="scanner-ghost" onClick={()=>void signOut()}>خروج</button>}</div><div className="scanner-panel"><h2>درخواست‌های اپراتورها</h2>{applications.length?applications.map(a=><article className="scanner-row" key={a.user_id}><div><strong>{a.email}</strong><small>{new Date(a.requested_at).toLocaleString('fa-IR')}</small><span className="scanner-status">{a.status==='pending'?'در انتظار تأیید':a.status==='approved'?'تأییدشده':a.status==='rejected'?'ردشده':'غیرفعال'}</span></div><div className="scanner-actions"><button disabled={busy} onClick={()=>void review(a.user_id,'approved')}>تأیید</button><button disabled={busy} onClick={()=>void review(a.user_id,'rejected')}>رد</button><button disabled={busy} onClick={()=>void review(a.user_id,'disabled')}>غیرفعال</button></div></article>):<p>درخواستی وجود ندارد.</p>}</div></section>:<section className="scanner-workspace"><div className="scanner-welcome"><div><h1>گزارش‌گیری از Plato IDهای فعال</h1><p>{access?.status==='approved'?'حساب شما فعال است؛ تصاویر را بارگذاری کنید.':'درخواست دسترسی شما در انتظار تأیید مالک است.'}</p></div><button className="scanner-ghost" onClick={()=>void signOut()}>خروج</button></div>{access?.status==='approved'&&<form className="scanner-panel scanner-upload" onSubmit={e=>void upload(e)}><h2>آپلود تصاویر</h2><label className="scanner-drop">انتخاب یک یا چند تصویر<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>void selectFiles(e.target.files)}/><small>{files.length?files.length+' تصویر انتخاب شده':'JPG / PNG / WEBP · حداکثر ۱۵ مگابایت برای هر تصویر'}</small></label><button className="scanner-primary" disabled={!files.length||busy}>{busy?'در حال ذخیره…':'ذخیره تصاویر انتخاب‌شده'}</button></form>}</section>}
  <section className="scanner-panel"><h2>{owner?'تصاویر بارگذاری‌شده':'تاریخچه تصاویر من'}</h2>{uploads.length?uploads.map(row=><article className="scanner-row" key={row.id}><div><strong>{row.file_name}</strong><small>{new Date(row.created_at).toLocaleString('fa-IR')} · {(row.file_size/1048576).toFixed(2)} MB</small>{owner&&<small>اپراتور: {applications.find(a=>a.user_id===row.operator_id)?.email||row.operator_id}</small>}<span className="scanner-status">ذخیره‌شده</span></div>{urls[row.id]&&<a className="scanner-image-link" href={urls[row.id]} target="_blank" rel="noreferrer"><img src={urls[row.id]} alt={row.file_name}/></a>}</article>):<p className="scanner-empty">هنوز تصویری ذخیره نشده است.</p>}</section>
  {message&&<p className="scanner-message" role="status">{message}</p>}
 </Root>;
}
