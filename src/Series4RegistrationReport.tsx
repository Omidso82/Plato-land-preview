import React,{useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';

type Registration={id:string;plato_id:string;rules_accepted:boolean;created_at:string;registration_status:'main'|'waitlist'|'withdrawn'};
const fa=(n:number)=>n.toLocaleString('fa-IR');
const panel:React.CSSProperties={marginTop:18,padding:16,border:'1px solid #8c6a34',borderRadius:14,background:'#111214'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.8};
const button:React.CSSProperties={background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:9,color:'#17130b',padding:'10px 14px',fontWeight:800,cursor:'pointer'};
const secondary:React.CSSProperties={background:'#252525',border:'1px solid #66512d',borderRadius:9,color:'#f2e6c9',padding:'9px 12px',fontWeight:700,cursor:'pointer'};

export default function Series4RegistrationReport(){
 const [rows,setRows]=useState<Registration[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [expanded,setExpanded]=useState(false);
 const [isOpen,setIsOpen]=useState(false);
 const [capacity,setCapacity]=useState(32);
 const [canOpen,setCanOpen]=useState(false);

 const load=useCallback(async()=>{
  if(!supabase){setError('اتصال به دیتابیس در دسترس نیست.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const [list,status]=await Promise.all([
    supabase.from('plato_land_series4_registration_requests').select('id,plato_id,rules_accepted,created_at,registration_status').order('created_at',{ascending:true}).order('id',{ascending:true}),
    supabase.rpc('series4_owner_registration_settings').single()
   ]);
   if(list.error)throw list.error;
   if(status.error)throw status.error;
   const settings=status.data as {registration_open:boolean;capacity:number;public_enabled:boolean};
   setIsOpen(settings.registration_open);
   setCapacity(settings.capacity);
   setCanOpen(settings.public_enabled);
   setRows((list.data||[]).map((r:any)=>({id:String(r.id),plato_id:String(r.plato_id||''),rules_accepted:r.rules_accepted===true,created_at:String(r.created_at||''),registration_status:r.registration_status})));
  }catch(e){console.error('Series 4 owner report load failed',e);setError(e instanceof Error?e.message:'خطای ناشناخته در دریافت گزارش');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);

 async function setRegistrationOpen(next:boolean){
  if(!supabase||busy||(next&&!canOpen))return;
  const verb=next?'بازکردن':'بستن';
  if(!window.confirm('ثبت‌نام سری چهارم '+verb+' شود؟'))return;
  setBusy(true);setMessage('');setError('');
  try{
   const {data,error}=await supabase.rpc('series4_owner_set_registration_open',{p_open:next});
   if(error)throw error;
   setIsOpen(data===true);
   setMessage(next?'ثبت‌نام باز شد.':'ثبت‌نام بسته شد.');
  }catch(e){setError(e instanceof Error?e.message:'تغییر وضعیت ثبت‌نام ناموفق بود.');}
  finally{setBusy(false);}
 }
 async function withdraw(row:Registration){
  if(!supabase||busy)return;
  if(!window.confirm('درخواست '+row.plato_id+' از فهرست فعال خارج شود؟ سابقه آن حفظ می‌شود و حذف فیزیکی انجام نمی‌شود.'))return;
  setBusy(true);setMessage('');setError('');
  try{
   const {error}=await supabase.rpc('series4_owner_withdraw_request',{p_request_id:row.id});
   if(error)throw error;
   setMessage('بازیکن از فهرست فعال خارج شد؛ سابقه ثبت‌نام حفظ شده است.');
   await load();
  }catch(e){setError(e instanceof Error?e.message:'خارج‌کردن بازیکن ناموفق بود.');}
  finally{setBusy(false);}
 }
 async function promote(row:Registration){
  if(!supabase||busy)return;
  if(!window.confirm('بازیکن '+row.plato_id+' به فهرست اصلی منتقل شود؟ فقط نفر اول صف قابل انتقال است.'))return;
  setBusy(true);setMessage('');setError('');
  try{
   const {error}=await supabase.rpc('series4_owner_promote_waitlist',{p_request_id:row.id});
   if(error)throw error;
   setMessage('بازیکن با موفقیت به فهرست اصلی منتقل شد.');
   await load();
  }catch(e){setError(e instanceof Error?e.message:'انتقال از صف انتظار ناموفق بود.');}
  finally{setBusy(false);}
 }
 const main=rows.filter(r=>r.registration_status==='main');
 const wait=rows.filter(r=>r.registration_status==='waitlist');
 const withdrawn=rows.filter(r=>r.registration_status==='withdrawn');
 const date=(v:string)=>{const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('fa-IR',{timeZone:'Europe/Copenhagen'});};
 const label=(s:Registration['registration_status'])=>s==='main'?'فهرست اصلی':s==='waitlist'?'فهرست انتظار':'خارج‌شده از فهرست';
 const roster=(items:Registration[],kind:'main'|'waitlist'|'withdrawn')=><details style={{marginTop:12,border:'1px solid #66512d',borderRadius:10,padding:10,background:'#151515'}}>
  <summary style={{cursor:'pointer',color:'#e4c77e',fontSize:16,fontWeight:800}}> {kind==='main'?'بازیکنان اصلی':kind==='waitlist'?'صف انتظار / رزرو':'سوابق خارج‌شده'} · {fa(items.length)} نفر</summary>
  {items.length===0?<p style={muted}>موردی وجود ندارد.</p>:<div style={{overflowX:'auto'}}>
   <table style={{width:'100%',minWidth:560,borderCollapse:'collapse',color:'#f2ead8'}}>
    <thead><tr style={{color:'#e4c77e',textAlign:'right'}}><th style={{padding:9}}>ردیف</th><th style={{padding:9}}>Plato ID</th><th style={{padding:9}}>زمان ثبت</th><th style={{padding:9}}>عملیات مالک</th></tr></thead>
    <tbody>{items.map((r,i)=><tr key={r.id}>
     <td style={{padding:9,borderTop:'1px solid #39342b'}}>{fa(i+1)}</td>
     <td dir="ltr" style={{padding:9,borderTop:'1px solid #39342b',fontWeight:800}}>{r.plato_id}</td>
     <td style={{padding:9,borderTop:'1px solid #39342b',whiteSpace:'nowrap'}}>{date(r.created_at)}</td>
     <td style={{padding:9,borderTop:'1px solid #39342b',whiteSpace:'nowrap'}}>
      {kind==='waitlist'&&i===0&&main.length<capacity&&<button style={button} disabled={busy} onClick={()=>void promote(r)}>انتقال به اصلی</button>}
      {kind!=='withdrawn'&&<button style={{...secondary,marginInlineStart:6}} disabled={busy} onClick={()=>void withdraw(r)}>خروج / حذف از فهرست</button>}
      {kind==='withdrawn'&&<span style={muted}>سابقه محفوظ</span>}
     </td>
    </tr>)}</tbody>
   </table>
  </div>}
 </details>;

 return <details dir="rtl" style={{...panel,padding:0}}>
  <summary style={{cursor:'pointer',padding:16,color:'#f6e8c5',fontSize:20,fontWeight:800}}>مدیریت ثبت‌نام سری چهارم</summary>
  <div style={{padding:'0 16px 16px'}}>
   <p style={{...muted,margin:'0 0 10px'}}>ظرفیت اصلی {fa(capacity)} نفر · صف انتظار به ترتیب زمان ثبت · عملیات فقط برای مالک</p>
   <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
    <button style={secondary} onClick={()=>setExpanded(v=>!v)}>{expanded?'بستن فهرست‌ها':'نمایش فهرست‌ها'}</button>
   </div>
  <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:14}}>
   {[{t:'اصلی',n:main.length},{t:'رزرو',n:wait.length},{t:'خارج‌شده',n:withdrawn.length}].map(x=><div key={x.t} style={{background:'#211b12',border:'1px solid #66512d',borderRadius:10,padding:'9px 14px',minWidth:95}}><div style={muted}>{x.t}</div><strong style={{fontSize:23,color:'#f1d99e'}}>{loading?'—':fa(x.n)}</strong></div>)}
   <div style={{background:'#171513',border:'1px solid #51452d',borderRadius:10,padding:'9px 14px',minWidth:120}}><div style={muted}>وضعیت ثبت‌نام</div><strong style={{color:isOpen?'#9ed6a3':'#f0aaaa'}}>{loading?'…':isOpen?'باز':'بسته'}</strong></div>
  </div>
  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>
   <button style={button} disabled={busy||loading||isOpen||!canOpen} onClick={()=>void setRegistrationOpen(true)}>بازکردن ثبت‌نام</button>
   <button style={secondary} disabled={busy||loading||!isOpen} onClick={()=>void setRegistrationOpen(false)}>بستن ثبت‌نام</button>
   <button style={secondary} disabled={busy||loading} onClick={()=>void load()}>{loading?'در حال دریافت…':'به‌روزرسانی فهرست'}</button>
  </div>
  <p style={{...muted,marginBottom:0}}>خروج بازیکن به‌صورت تغییر وضعیت ثبت می‌شود و رکورد و زمان ثبت او باقی می‌ماند. انتقال رزروی‌ها دستی است و فقط نفر اول صف، در صورت خالی‌بودن ظرفیت، قابل انتقال است.</p>
  {message&&<p role="status" style={{color:'#a8d6a8',fontSize:13}}>{message}</p>}
  {error&&<p role="alert" style={{color:'#f0aaaa',fontSize:13}}>{error}</p>}
  {expanded&&!loading&&<div>
   {roster(main,'main')}
   {roster(wait,'waitlist')}
   {roster(withdrawn,'withdrawn')}
  </div>}
  </div>
 </details>;
}
