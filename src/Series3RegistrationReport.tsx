import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';

type Registration={id:string;plato_id:string;rules_accepted:boolean;created_at:string;registration_status:'main'|'waitlist'|'withdrawn'};
type ReportBoundaryState={hasError:boolean};
const fa=(n:number)=>n.toLocaleString('fa-IR');
const panel:React.CSSProperties={marginTop:18,padding:16,border:'1px solid #8c6a34',borderRadius:14,background:'#111214'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.8};
const button:React.CSSProperties={background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:9,color:'#17130b',padding:'10px 14px',fontWeight:800,cursor:'pointer'};
const secondary:React.CSSProperties={background:'#252525',border:'1px solid #66512d',borderRadius:9,color:'#f2e6c9',padding:'9px 12px',fontWeight:700,cursor:'pointer'};

// Keep a report rendering failure inside this panel instead of blanking the whole admin workspace.
class RegistrationReportBoundary extends React.Component<React.PropsWithChildren,ReportBoundaryState>{
 state:ReportBoundaryState={hasError:false};
 static getDerivedStateFromError():ReportBoundaryState{return {hasError:true};}
 componentDidCatch(error:Error){console.error('Series 3 registration report render error:',error);}
 render(){
  if(this.state.hasError)return <section dir="rtl" style={panel} role="alert">
   <h2 style={{color:'#f6e8c5',fontSize:20,margin:'0 0 8px'}}>گزارش ثبت‌نام‌کنندگان سری سوم</h2>
   <p style={{...muted,color:'#f0aaaa'}}>در نمایش گزارش خطایی رخ داد. سایر بخش‌های پنل همچنان قابل استفاده هستند. صفحه را تازه‌سازی کن یا بعداً دوباره تلاش کن.</p>
  </section>;
  return this.props.children;
 }
}

function RegistrationReportContent(){
 const [rows,setRows]=useState<Registration[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [expanded,setExpanded]=useState(false);
 const [busyId,setBusyId]=useState<string|null>(null);
 const load=useCallback(async()=>{
  if(!supabase){setError('اتصال به دیتابیس در دسترس نیست.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const result=await supabase.from('plato_land_series3_registration_requests')
    .select('id,plato_id,rules_accepted,created_at,registration_status')
    .order('created_at',{ascending:true}).order('id',{ascending:true});
   if(result.error)throw result.error;
   const records=Array.isArray(result.data)?result.data:[];
   const safeRows=records.filter((row:any)=>row&&typeof row==='object').map((row:any,index:number)=>({
    id:String(row.id??'registration-'+index),
    plato_id:typeof row.plato_id==='string'?row.plato_id:'',
    rules_accepted:row.rules_accepted===true,
    created_at:typeof row.created_at==='string'?row.created_at:'',
    registration_status:row.registration_status==='waitlist'||row.registration_status==='withdrawn'?row.registration_status:'main'
   } as Registration));
   setRows(safeRows);
  }catch(e){
   console.error('Series 3 registration report load failed:',e);
   const detail=e instanceof Error&&e.message?e.message:'خطای ناشناخته';
   setError('دریافت گزارش ثبت‌نام‌ها ناموفق بود: '+detail);
  }finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const main=useMemo(()=>rows.filter(r=>r.registration_status==='main'),[rows]);
 const waitlist=useMemo(()=>rows.filter(r=>r.registration_status==='waitlist'),[rows]);
 const withdrawn=useMemo(()=>rows.filter(r=>r.registration_status==='withdrawn'),[rows]);
 const formatDate=(value:string)=>{
  if(!value)return '—';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return '—';
  try{return date.toLocaleString('fa-IR',{timeZone:'Europe/Copenhagen'});}catch{return '—';}
 };
 async function withdraw(row:Registration){
  if(!supabase||busyId)return;
  const confirmed=window.confirm('آیا از ثبت انصراف '+row.plato_id+' مطمئن هستی؟ اگر مهلت جایگزینی معتبر تنظیم شده باشد، نفر اول صف انتظار به فهرست اصلی منتقل می‌شود.');
  if(!confirmed)return;
  setBusyId(row.id);setError('');setMessage('');
  try{
   const {data,error}=await supabase.rpc('withdraw_series3_main_registration',{p_request_id:row.id});
   if(error)throw error;
   setMessage(data?'انصراف ثبت شد و نفر اول صف انتظار به فهرست اصلی منتقل شد.':'انصراف ثبت شد؛ به‌دلیل تنظیم‌نشدن یا پایان مهلت جایگزینی، بازیکنی ارتقا پیدا نکرد.');
   await load();
  }catch(e){
   setError('ثبت انصراف انجام نشد: '+(e instanceof Error?e.message:'خطای ناشناخته'));
  }finally{setBusyId(null);}
 }
 const renderRows=(items:Registration[],kind:'main'|'waitlist'|'withdrawn')=>{
  if(!items.length)return <p style={muted}>موردی در این بخش وجود ندارد.</p>;
  return <div style={{overflowX:'auto'}}>
   <table style={{width:'100%',borderCollapse:'collapse',minWidth:470,color:'#f2ead8'}}>
    <thead><tr style={{color:'#e4c77e',textAlign:'right'}}>
     <th style={{padding:9,borderBottom:'1px solid #66512d'}}>ردیف</th>
     <th style={{padding:9,borderBottom:'1px solid #66512d'}}>Plato ID</th>
     <th style={{padding:9,borderBottom:'1px solid #66512d'}}>تاریخ ثبت</th>
     <th style={{padding:9,borderBottom:'1px solid #66512d'}}>پذیرش قوانین</th>
     {kind==='main'&&<th style={{padding:9,borderBottom:'1px solid #66512d'}}>عملیات</th>}
    </tr></thead>
    <tbody>{items.map((row,i)=><tr key={row.id}>
     <td style={{padding:9,borderBottom:'1px solid #39342b'}}>{fa(i+1)}</td>
     <td dir="ltr" style={{padding:9,borderBottom:'1px solid #39342b',textAlign:'right',fontWeight:800}}>{row.plato_id||'—'}</td>
     <td style={{padding:9,borderBottom:'1px solid #39342b',whiteSpace:'nowrap'}}>{formatDate(row.created_at)}</td>
     <td style={{padding:9,borderBottom:'1px solid #39342b'}}>{row.rules_accepted?'بله':'خیر'}</td>
     {kind==='main'&&<td style={{padding:9,borderBottom:'1px solid #39342b'}}>
      <button type="button" style={{...secondary,color:'#ffd0d0',borderColor:'#754747',whiteSpace:'nowrap'}} disabled={busyId!==null} onClick={()=>void withdraw(row)}>
       {busyId===row.id?'در حال ثبت…':'ثبت انصراف'}
      </button>
     </td>}
    </tr>)}</tbody>
   </table>
  </div>;
 };
 return <section dir="rtl" style={panel}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
   <div style={{minWidth:0}}><h2 style={{color:'#f6e8c5',fontSize:20,margin:'0 0 5px'}}>گزارش ثبت‌نام‌کنندگان سری سوم</h2><p style={{...muted,margin:0}}>فهرست اصلی، صف انتظار و انصرافی‌ها به‌صورت جداگانه؛ صف انتظار بر اساس زمان ثبت مرتب شده است.</p></div>
   <button type="button" style={button} onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} aria-controls="series3-registration-report-details">
    {expanded?'بستن گزارش':'مشاهده گزارش'}
   </button>
  </div>
  <div style={{display:'flex',gap:10,flexWrap:'wrap',margin:'13px 0 0'}}>
   {([['بازیکنان اصلی',main.length],['صف انتظار',waitlist.length],['انصرافی‌ها',withdrawn.length]] as const).map(([label,value])=>
    <div key={label} style={{background:'#211b12',border:'1px solid #66512d',borderRadius:10,padding:'9px 14px',minWidth:105}}>
     <div style={{...muted,fontSize:12}}>{label}</div><strong style={{fontSize:23,color:'#f1d99e'}}>{loading?'—':fa(value)}</strong>
    </div>)}
  </div>
  {expanded&&<div id="series3-registration-report-details" style={{marginTop:14}}>
   <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
    <button type="button" style={button} onClick={()=>void load()} disabled={loading||busyId!==null}>{loading?'در حال دریافت…':'به‌روزرسانی گزارش'}</button>
   </div>
   {error?<p role="alert" style={{...muted,color:'#f0aaaa'}}>{error}</p>:loading?<p style={muted}>در حال دریافت فهرست…</p>:<>
    <section style={{marginTop:14}}><h3 style={{color:'#e4c77e',fontSize:16}}>۱. بازیکنان اصلی ({fa(main.length)})</h3>{renderRows(main,'main')}</section>
    <section style={{marginTop:20}}><h3 style={{color:'#e4c77e',fontSize:16}}>۲. فهرست انتظار ({fa(waitlist.length)})</h3><p style={muted}>ترتیب صف از قدیمی‌ترین درخواست به جدیدترین درخواست است.</p>{renderRows(waitlist,'waitlist')}</section>
    <section style={{marginTop:20}}><h3 style={{color:'#e4c77e',fontSize:16}}>۳. انصرافی‌ها ({fa(withdrawn.length)})</h3>{renderRows(withdrawn,'withdrawn')}</section>
   </>}
  </div>}
  {message&&<p role="status" style={{...muted,color:'#b8dfa9'}}>{message}</p>}
 </section>;
}

export default function Series3RegistrationReport(){
 return <RegistrationReportBoundary><RegistrationReportContent/></RegistrationReportBoundary>;
}
