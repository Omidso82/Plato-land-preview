import React,{useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';

type Status={registration_open:boolean;capacity:number;main_count:number;waitlist_count:number;replacement_cutoff_at:string|null};
const fa=(n:number)=>n.toLocaleString('fa-IR');
const toLocalDateTimeInput=(value:string)=>{const date=new Date(value);if(Number.isNaN(date.getTime()))return '';const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,16);};
const panel:React.CSSProperties={marginTop:18,padding:16,border:'1px solid #8c6a34',borderRadius:14,background:'linear-gradient(145deg,#211b12,#111214)',color:'#f2ead8'};
const muted:React.CSSProperties={color:'#c9c0b0',fontSize:12,lineHeight:1.9};
const button:React.CSSProperties={border:'1px solid #e3c77d',borderRadius:9,padding:'10px 14px',fontWeight:800,cursor:'pointer'};
export default function Series3RegistrationControls(){
 const [status,setStatus]=useState<Status|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [cutoff,setCutoff]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setError('اتصال به دیتابیس اصلی در دسترس نیست.');setLoading(false);return;}
  setLoading(true);setError('');
  const {data,error}=await supabase.rpc('series3_registration_status');
  if(error){setError('وضعیت ثبت‌نام قابل دریافت نیست: '+error.message);setStatus(null);}
  else{
   const row=Array.isArray(data)?data[0]:data;
   if(row){setStatus(row as Status);setCutoff(row.replacement_cutoff_at?toLocalDateTimeInput(row.replacement_cutoff_at):'');}
   else setError('تنظیمات ثبت‌نام سری سوم پیدا نشد.');
  }
  setLoading(false);
 },[]);
 useEffect(()=>{void load();},[load]);
 async function toggle(){
  if(!supabase||!status)return;
  setBusy(true);setError('');setMessage('');
  const {error}=await supabase.rpc('set_series3_registration_open',{p_open:!status.registration_open});
  if(error)setError('تغییر وضعیت ثبت‌نام انجام نشد: '+error.message);
  else{setMessage(status.registration_open?'ثبت‌نام بسته شد.':'ثبت‌نام باز شد.');await load();}
  setBusy(false);
 }
 async function saveCutoff(){
  if(!supabase)return;
  setBusy(true);setError('');setMessage('');
  const parsed=cutoff?new Date(cutoff):null;
  if(parsed&&!Number.isFinite(parsed.getTime())){setError('زمان پایان جایگزینی معتبر نیست.');setBusy(false);return;}
  const value=parsed?parsed.toISOString():null;
  const {error}=await supabase.rpc('set_series3_replacement_cutoff',{p_cutoff:value});
  if(error)setError('ذخیره مهلت جایگزینی انجام نشد: '+error.message);
  else{setMessage('مهلت جایگزینی ذخیره شد.');await load();}
  setBusy(false);
 }
 return <section dir="rtl" style={panel}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
   <div><h2 style={{color:'#f6e8c5',fontSize:20,margin:'0 0 5px'}}>ثبت‌نام و ظرفیت سری سوم</h2><p style={{...muted,margin:0}}>کنترل دستی ثبت‌نام مستقل از مهلت جایگزینی نفرات ذخیره</p></div>
   <button type="button" onClick={()=>void load()} disabled={loading||busy} style={{...button,background:'#28241d',color:'#f2e6c9',borderColor:'#66512d'}}>به‌روزرسانی</button>
  </div>
  {loading?<p style={muted}>در حال دریافت وضعیت…</p>:status&&<>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
    <div style={{flex:'1 1 100px',padding:10,border:'1px solid #66512d',borderRadius:9}}><div style={muted}>بازیکن اصلی</div><strong>{fa(status.main_count)} / {fa(status.capacity)}</strong></div>
    <div style={{flex:'1 1 100px',padding:10,border:'1px solid #66512d',borderRadius:9}}><div style={muted}>صف انتظار</div><strong>{fa(status.waitlist_count)}</strong></div>
    <div style={{flex:'1 1 100px',padding:10,border:'1px solid #66512d',borderRadius:9}}><div style={muted}>ثبت‌نام</div><strong>{status.registration_open?'باز':'بسته'}</strong></div>
   </div>
   <button type="button" disabled={busy} onClick={()=>void toggle()} style={{...button,width:'100%',marginTop:12,background:status.registration_open?'#4b2424':'linear-gradient(120deg,#a98239,#e4c77e)',color:status.registration_open?'#ffe5e5':'#17130b',borderColor:status.registration_open?'#a55b5b':'#e3c77d'}}>
    {busy?'در حال ذخیره…':status.registration_open?'بستن ثبت‌نام عمومی':'بازکردن ثبت‌نام عمومی'}
   </button>
   <div style={{marginTop:18,paddingTop:14,borderTop:'1px solid #51452d'}}>
    <strong style={{color:'#e4c77e'}}>مهلت جایگزینی نفرات ذخیره</strong>
    <p style={muted}>این زمان مستقل از باز و بسته‌کردن فرم ثبت‌نام است. زمان دقیق شروع مسابقه هنوز در تنظیمات ثبت نشده است.</p>
    <label style={{...muted,display:'block'}}>زمان پایان جایگزینی
     <input type="datetime-local" value={cutoff} onChange={e=>setCutoff(e.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:7,padding:11,borderRadius:8,border:'1px solid #6a5a37',background:'#101113',color:'#fff'}}/>
    </label>
    <button type="button" disabled={busy} onClick={()=>void saveCutoff()} style={{...button,marginTop:9,background:'#28241d',color:'#f2e6c9',borderColor:'#66512d'}}>ذخیره مهلت جایگزینی</button>
   </div>
  </>}
  {error&&<p role="alert" style={{...muted,color:'#f0aaaa'}}>{error}</p>}
  {message&&<p role="status" style={{...muted,color:'#b8dfa9'}}>{message}</p>}
 </section>;
}
