import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import PlatoIdImageUpload from './PlatoIdImageUpload';

type AccessRow = { user_id:string; email:string; status:'pending'|'approved'|'suspended'; requested_at:string; reviewed_at:string|null };

export default function PlatoIdScannerPortal() {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [userEmail,setUserEmail]=useState('');
  const [owner,setOwner]=useState(false);
  const [status,setStatus]=useState<AccessRow['status']|null>(null);
  const [accessRows,setAccessRows]=useState<AccessRow[]>([]);
  const [message,setMessage]=useState('');

  const load=useCallback(async()=>{
    if(!supabase){setMessage('اتصال به سرویس اصلی برقرار نیست.');setLoading(false);return;}
    setLoading(true);
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user){setUserEmail('');setOwner(false);setStatus(null);setLoading(false);return;}
    setUserEmail(user.email||'');
    const {data:role}=await supabase.rpc('current_user_role');
    const isOwner=role==='owner'||role==='مالک کل';
    setOwner(isOwner);
    if(isOwner){
      const {data,error}=await supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').order('requested_at',{ascending:false});
      if(error)setMessage('خواندن فهرست اپراتورها ناموفق بود: '+error.message);
      else setAccessRows((data||[]) as AccessRow[]);
    } else {
      let {data,error}=await supabase.from('plato_id_scanner_access').select('user_id,email,status,requested_at,reviewed_at').eq('user_id',user.id).maybeSingle();
      if(error){setMessage('بررسی دسترسی ناموفق بود: '+error.message);}
      else if(!data){
        const created=await supabase.from('plato_id_scanner_access').insert({user_id:user.id,email:user.email||''}).select('user_id,email,status,requested_at,reviewed_at').single();
        if(created.error)setMessage('ثبت درخواست دسترسی ناموفق بود: '+created.error.message);
        else data=created.data as AccessRow;
      }
      setStatus((data as AccessRow|null)?.status||null);
    }
    setLoading(false);
  },[]);

  useEffect(()=>{void load();},[load]);

  async function submit(e:React.FormEvent){
    e.preventDefault(); if(!supabase)return;
    setBusy(true);setMessage('');
    try{
      if(mode==='signup'){
        if(password.length<8)throw new Error('رمز عبور باید حداقل ۸ کاراکتر باشد.');
        const {data,error}=await supabase.auth.signUp({email:email.trim(),password});
        if(error)throw error;
        if(data.session?.user){
          const {error:requestError}=await supabase.from('plato_id_scanner_access').insert({user_id:data.session.user.id,email:data.session.user.email||email.trim()});
          if(requestError&&requestError.code!=='23505')throw requestError;
          setMessage('حساب ساخته شد و درخواست دسترسی برای مالک ارسال شد. پس از تأیید، امکان ورود به اسکنر فعال می‌شود.');
          await load();
        }else{
          setMessage('ثبت‌نام انجام شد. ایمیل تأیید را باز کن؛ سپس از همین صفحه وارد شو تا درخواست دسترسی ثبت شود.');
          setMode('login');
        }
      }else{
        const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
        if(error)throw error;
        setPassword('');
        await load();
      }
    }catch(err:any){setMessage(err?.message||'عملیات انجام نشد.');}
    finally{setBusy(false);}
  }

  async function changeStatus(row:AccessRow,next:AccessRow['status']){
    if(!supabase||!owner)return;
    setBusy(true);setMessage('');
    try{
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;if(!user)throw new Error('نشست مالک معتبر نیست.');
      const {error}=await supabase.from('plato_id_scanner_access').update({status:next,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq('user_id',row.user_id);
      if(error)throw error;
      setMessage('وضعیت دسترسی اپراتور به‌روزرسانی شد.');
      await load();
    }catch(err:any){setMessage('تغییر دسترسی انجام نشد: '+(err?.message||'خطای ناشناخته'));}
    finally{setBusy(false);}
  }

  async function signOut(){await supabase?.auth.signOut();setUserEmail('');setOwner(false);setStatus(null);setAccessRows([]);setMessage('از حساب خارج شدی.');}

  if(loading)return <main style={shell} dir="rtl"><section style={panel}>در حال بررسی نشست و دسترسی…</section></main>;
  if(!userEmail)return <main style={shell} dir="rtl"><section style={panel}>
    <h1 style={heading}>اسکنر تصاویر Plato ID</h1><p style={muted}>این درگاه مستقل است و فقط برای بارگذاری و مشاهده تصاویر Plato ID استفاده می‌شود.</p>
    <form onSubmit={submit} style={{display:'grid',gap:12}}>
      <label style={muted}>ایمیل<input style={field} type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label style={muted}>رمز عبور<input style={field} type="password" required minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button style={primary} disabled={busy}>{busy?'لطفاً صبر کن…':mode==='login'?'ورود به اسکنر':'ساخت حساب اپراتور'}</button>
    </form>
    <button style={secondary} type="button" onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('')}}>{mode==='login'?'حساب نداری؟ ثبت‌نام اپراتور':'قبلاً حساب ساخته‌ای؟ ورود'}</button>
    {message&&<p role="status" style={muted}>{message}</p>}
  </section></main>;

  return <main style={shell} dir="rtl"><section style={panel}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
      <div><h1 style={heading}>درگاه مستقل اسکنر Plato ID</h1><p style={muted}>حساب: {userEmail} · {owner?'مالک کل':'اپراتور'}</p></div>
      <button style={secondary} onClick={()=>void signOut()}>خروج امن</button>
    </header>
    {owner?<section style={subpanel}>
      <h2 style={subheading}>مدیریت اپراتورها</h2>
      <p style={muted}>فقط مالک می‌تواند درخواست‌ها را تأیید، تعلیق یا دوباره فعال کند.</p>
      {accessRows.length===0?<p style={muted}>هنوز درخواست اپراتوری ثبت نشده است.</p>:accessRows.map(row=><article key={row.user_id} style={accessCard}>
        <div><strong style={{color:'#f6e8c5',overflowWrap:'anywhere'}}>{row.email}</strong><div style={muted}>وضعیت: {row.status==='pending'?'در انتظار تأیید':row.status==='approved'?'فعال':'تعلیق‌شده'} · {new Date(row.requested_at).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'})}</div></div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {row.status!=='approved'&&<button style={primary} disabled={busy} onClick={()=>void changeStatus(row,'approved')}>تأیید</button>}
          {row.status!=='suspended'&&<button style={secondary} disabled={busy} onClick={()=>void changeStatus(row,'suspended')}>تعلیق</button>}
          {row.status==='suspended'&&<button style={secondary} disabled={busy} onClick={()=>void changeStatus(row,'pending')}>بازگشت به انتظار</button>}
        </div>
      </article>)}
    </section>:status==='approved'?<p style={muted}>دسترسی شما فعال است. فقط تصاویر متعلق به حساب خودتان را می‌توانید ببینید و مدیریت کنید.</p>:<section style={subpanel}><h2 style={subheading}>{status==='pending'?'درخواست شما در انتظار تأیید مالک است.':'دسترسی شما فعلاً فعال نیست.'}</h2><p style={muted}>{status==='pending'?'پس از تأیید، همین صفحه به ابزار بارگذاری تصاویر تبدیل می‌شود.':'برای فعال‌سازی دسترسی با مالک PLATO LAND تماس بگیر.'}</p></section>}
    {(owner||status==='approved')&&<PlatoIdImageUpload/>}
    {message&&<p role="status" style={muted}>{message}</p>}
  </section></main>;
}

const shell:React.CSSProperties={minHeight:'100vh',background:'radial-gradient(ellipse at 50% 0%,#292216 0,#111214 48%,#090a0c 100%)',color:'#f4f0e8',padding:'24px 14px',fontFamily:'inherit'};
const panel:React.CSSProperties={maxWidth:1050,margin:'20px auto',padding:22,border:'1px solid #705b31',borderRadius:16,background:'#171819',boxShadow:'0 20px 70px #0008'};
const subpanel:React.CSSProperties={marginTop:20,padding:16,border:'1px solid #51452d',borderRadius:12,background:'#111214'};
const heading:React.CSSProperties={color:'#f6e8c5',fontSize:24,margin:'0 0 8px'};
const subheading:React.CSSProperties={color:'#e4c77e',fontSize:18,margin:'0 0 8px'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.9};
const field:React.CSSProperties={display:'block',width:'100%',marginTop:7,background:'#101113',border:'1px solid #6a5a37',borderRadius:8,color:'#fff',padding:12};
const primary:React.CSSProperties={background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:9,color:'#17130b',padding:'10px 14px',fontWeight:700,cursor:'pointer'};
const secondary:React.CSSProperties={background:'#252525',border:'1px solid #555',color:'#ddd',borderRadius:9,padding:'10px 14px',cursor:'pointer',marginTop:10};
const accessCard:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',padding:'12px 0',borderTop:'1px solid #38332a'};
