import React,{useCallback,useEffect,useState} from 'react';
import {supabase} from './supabase';

type Registration={id:string;plato_id:string;rules_accepted:boolean;created_at:string};
const fa=(n:number)=>n.toLocaleString('fa-IR');
const panel:React.CSSProperties={marginTop:18,padding:16,border:'1px solid #8c6a34',borderRadius:14,background:'#111214'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.8};
const button:React.CSSProperties={background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:9,color:'#17130b',padding:'10px 14px',fontWeight:800,cursor:'pointer'};

export default function Series3RegistrationReport(){
 const [rows,setRows]=useState<Registration[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setError('اتصال به دیتابیس در دسترس نیست.');setLoading(false);return;}
  setLoading(true);setError('');
  const {data,error}=await supabase.from('plato_land_series3_registration_requests')
   .select('id,plato_id,rules_accepted,created_at').order('created_at',{ascending:false});
  if(error){setError('دریافت گزارش ثبت‌نام‌ها ناموفق بود: '+error.message);setRows([]);}
  else setRows((data||[]) as Registration[]);
  setLoading(false);
 },[]);
 useEffect(()=>{void load();},[load]);
 return <section dir="rtl" style={panel}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
   <div><h2 style={{color:'#f6e8c5',fontSize:20,margin:'0 0 5px'}}>گزارش ثبت‌نام‌کنندگان سری سوم</h2><p style={{...muted,margin:0}}>فهرست Plato IDهایی که ثبت‌نامشان در دیتابیس ثبت شده است.</p></div>
   <button type="button" style={button} onClick={()=>void load()} disabled={loading}>{loading?'در حال دریافت…':'به‌روزرسانی گزارش'}</button>
  </div>
  <div style={{display:'flex',gap:10,flexWrap:'wrap',margin:'16px 0'}}>
   <div style={{background:'#211b12',border:'1px solid #66512d',borderRadius:10,padding:'12px 18px',minWidth:130}}>
    <div style={{...muted,fontSize:12}}>تعداد ثبت‌نام‌ها</div><strong style={{fontSize:25,color:'#f1d99e'}}>{loading?'—':fa(rows.length)}</strong>
   </div>
  </div>
  {error?<p role="alert" style={{...muted,color:'#f0aaaa'}}>{error}</p>:loading?<p style={muted}>در حال دریافت فهرست…</p>:rows.length===0?<p style={muted}>هنوز هیچ ثبت‌نامی برای سری سوم در دیتابیس ثبت نشده است.</p>:
   <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse',minWidth:420,color:'#f2ead8'}}>
     <thead><tr style={{color:'#e4c77e',textAlign:'right'}}><th style={{padding:10,borderBottom:'1px solid #66512d'}}>ردیف</th><th style={{padding:10,borderBottom:'1px solid #66512d'}}>Plato ID</th><th style={{padding:10,borderBottom:'1px solid #66512d'}}>تاریخ ثبت</th><th style={{padding:10,borderBottom:'1px solid #66512d'}}>پذیرش قوانین</th></tr></thead>
     <tbody>{rows.map((row,i)=><tr key={row.id}><td style={{padding:10,borderBottom:'1px solid #39342b'}}>{fa(i+1)}</td><td dir="ltr" style={{padding:10,borderBottom:'1px solid #39342b',textAlign:'right',fontWeight:800}}>{row.plato_id}</td><td style={{padding:10,borderBottom:'1px solid #39342b',whiteSpace:'nowrap'}}>{new Date(row.created_at).toLocaleString('fa-IR',{timeZone:'Asia/Copenhagen'})}</td><td style={{padding:10,borderBottom:'1px solid #39342b'}}>{row.rules_accepted?'بله':'خیر'}</td></tr>)}</tbody>
    </table>
   </div>}
 </section>;
}
