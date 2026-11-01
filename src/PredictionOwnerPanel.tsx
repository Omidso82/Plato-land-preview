import React,{useEffect,useState} from 'react';
import {supabase} from './supabase';

type View='semifinal'|'champion';
export default function PredictionOwnerPanel(){
 const [email,E]=useState(''),[password,P]=useState(''),[votes,V]=useState<any[]>([]),[error,S]=useState(''),[busy,B]=useState(false),[ok,O]=useState(false),[view,SetView]=useState<View>('semifinal');
 async function load(nextView:View=view){
  B(true);S('');
  try{
   const {data:{session}}=await supabase.auth.getSession();
   if(!session){O(false);return;}
   const slug=nextView==='semifinal'?'plato-land-semifinal-prediction-owner-votes':'plato-land-prediction-owner-votes';
   const r=await fetch('https://dfrppbapaaydbjeflozw.supabase.co/functions/v1/'+slug,{headers:{apikey:'sb_publishable_fuY9xR6e5pGB-6SnoV4-Hg_LNr23RzE',Authorization:'Bearer '+session.access_token}});
   const d=await r.json();if(!r.ok)throw Error(d.error||'دسترسی مجاز نیست');
   V(nextView==='semifinal'?(d.predictions||[]):(d.votes||[]));O(true);
  }catch(e:any){S(e.message||'خطا');}finally{B(false);}
 }
 useEffect(()=>{void load('semifinal')},[]);
 async function login(e:any){e.preventDefault();B(true);const {error}=await supabase.auth.signInWithPassword({email,password});if(error){S('ورود ناموفق بود؛ اطلاعات حساب مالک را بررسی کنید.');B(false);return;}await load('semifinal');}
 async function logout(){await supabase.auth.signOut();O(false);V([]);}
 const field:any={display:'block',width:'100%',padding:12,margin:'8px 0 16px',background:'#080808',border:'1px solid #80602a',borderRadius:8,color:'#fff'};
 const btn:any={padding:'11px 16px',background:'#d8ad52',border:0,borderRadius:8,fontWeight:700,cursor:'pointer',marginLeft:8};
 const td:any={padding:12,borderBottom:'1px solid #554321',textAlign:'right',whiteSpace:'nowrap'};
 return <main dir="rtl" style={{minHeight:'100vh',background:'#090806',color:'#fff',padding:24,fontFamily:'Tahoma'}}><div style={{maxWidth:1080,margin:'auto'}}>
  <h1 style={{color:'#f3cf73'}}>پنل خصوصی Owner | گزارش پیش‌بینی‌ها</h1>
  {!ok?<form onSubmit={login} style={{maxWidth:440,background:'#1b160e',border:'1px solid #98712e',borderRadius:14,padding:20}}><p>ورود با حساب مالک سایت برای مشاهده اطلاعات پیش‌بینی‌کنندگان</p><label>ایمیل مالک</label><input type="email" required value={email} onChange={e=>E(e.target.value)} style={field}/><label>رمز عبور</label><input type="password" required value={password} onChange={e=>P(e.target.value)} style={field}/><button disabled={busy} style={btn}>{busy?'در حال بررسی…':'ورود و مشاهده گزارش'}</button>{error&&<p style={{color:'#ffb3a9'}}>{error}</p>}</form>:<>
   <div style={{margin:'16px 0'}}><button style={btn} onClick={()=>{SetView('semifinal');void load('semifinal')}}>پیش‌بینی نیمه‌نهایی‌ها</button><button style={btn} onClick={()=>{SetView('champion');void load('champion')}}>آرشیو پیش‌بینی قهرمان</button><button style={btn} onClick={()=>void load()}>به‌روزرسانی</button><button style={btn} onClick={logout}>خروج</button></div>
   {error&&<p style={{color:'#ffb3a9'}}>{error}</p>}
   <h2 style={{color:'#ffe3a0'}}>{view==='semifinal'?'پیش‌بینی صعودکنندگان به فینال':'آرشیو پیش‌بینی قهرمان سری اول'}</h2>
   <p>تعداد ثبت‌شده: {votes.length.toLocaleString('fa-IR')}</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',background:'#17130d'}}><thead><tr>{(view==='semifinal'?['ردیف','Plato ID رأی‌دهنده','برنده نیمه‌نهایی اول','برنده نیمه‌نهایی دوم','زمان ثبت']:['ردیف','Plato ID رأی‌دهنده','انتخاب قهرمان','زمان ثبت']).map(x=><th key={x} style={td}>{x}</th>)}</tr></thead><tbody>{votes.map((v,i)=><tr key={v.id}><td style={td}>{(i+1).toLocaleString('fa-IR')}</td><td dir="ltr" style={td}>{v.voter_plato_id}</td>{view==='semifinal'?<><td style={td}>{v.semifinal_one_winner_name}</td><td style={td}>{v.semifinal_two_winner_name}</td></>:<td style={td}>{v.predicted_player_name}</td>}<td style={td}>{new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Tehran'}).format(new Date(v.created_at))}</td></tr>)}</tbody></table>{!votes.length&&<p>هنوز پیش‌بینی‌ای ثبت نشده است.</p>}</div>
  </>}
 </div></main>;
}
