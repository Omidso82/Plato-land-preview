import React, { useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime } from './iranDate';
import { Download, FileSpreadsheet, ShieldCheck } from 'lucide-react';

type Dataset='users'|'tournaments'|'registrations'|'results';
const labels:Record<Dataset,string>={users:'کاربران',tournaments:'مسابقات',registrations:'ثبت‌نام‌ها',results:'نتایج'};

function csvCell(value:unknown){const text=value==null?'':String(value);return '"'+text.replace(/"/g,'""')+'"';}
function downloadCsv(filename:string,headers:string[],rows:unknown[][]){
 const content='\uFEFF'+[headers,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
 const blob=new Blob([content],{type:'text/csv;charset=utf-8;'});
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
}

export default function OwnerExports(){
 const [dataset,setDataset]=useState<Dataset>('tournaments');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 async function exportData(){
  if(!supabase)return;setBusy(true);setError('');setMessage('');
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user)throw new Error('برای دریافت خروجی باید وارد حساب مالک شوی.');
   let headers:string[]=[];let rows:unknown[][]=[];
   if(dataset==='users'){
    const {data,error:qError}=await supabase.from('profiles').select('display_name,plato_id,created_at,updated_at').order('created_at',{ascending:false});
    if(qError)throw qError;headers=['نام نمایشی','Plato ID','تاریخ ایجاد','آخرین ویرایش'];rows=(data||[]).map(x=>[x.display_name,x.plato_id,formatIranDateTime(x.created_at),formatIranDateTime(x.updated_at)]);
   }else if(dataset==='tournaments'){
    const {data,error:qError}=await supabase.from('tournaments').select('title,game_type,series_name,status,capacity,registration_open,registration_starts_at,registration_ends_at,starts_at,completed_at,created_at').order('created_at',{ascending:false});
    if(qError)throw qError;headers=['عنوان مسابقه','بازی','سری','وضعیت','ظرفیت','ثبت‌نام باز','شروع ثبت‌نام','پایان ثبت‌نام','شروع مسابقه','پایان مسابقه','تاریخ ایجاد'];rows=(data||[]).map(x=>[x.title,x.game_type,x.series_name,x.status,x.capacity,x.registration_open?'بله':'خیر',x.registration_starts_at?formatIranDateTime(x.registration_starts_at):'',x.registration_ends_at?formatIranDateTime(x.registration_ends_at):'',x.starts_at?formatIranDateTime(x.starts_at):'',x.completed_at?formatIranDateTime(x.completed_at):'',formatIranDateTime(x.created_at)]);
   }else if(dataset==='registrations'){
    const {data,error:qError}=await supabase.from('registrations').select('id,tournament_id,display_name,plato_id,team_name,registration_type,status,is_reserve,reserve_position,slot_count,created_at').order('created_at',{ascending:false});
    if(qError)throw qError;const ids=[...new Set((data||[]).map(x=>x.tournament_id))];const {data:tournaments,error:tError}=ids.length?await supabase.from('tournaments').select('id,title').in('id',ids):{data:[],error:null};if(tError)throw tError;const map=new Map((tournaments||[]).map(x=>[x.id,x.title]));
    headers=['مسابقه','نام','Plato ID','نام تیم','نوع ثبت‌نام','وضعیت','رزرو','جایگاه رزرو','ظرفیت مصرفی','تاریخ ثبت'];rows=(data||[]).map(x=>[map.get(x.tournament_id)||x.tournament_id,x.display_name,x.plato_id,x.team_name,x.registration_type,x.status,x.is_reserve?'بله':'خیر',x.reserve_position,x.slot_count,formatIranDateTime(x.created_at)]);
   }else{
    const {data,error:qError}=await supabase.from('tournament_results').select('tournament_id,player_id,placement,points,wins,losses,score_for,score_against,updated_at').order('updated_at',{ascending:false});
    if(qError)throw qError;const tournamentIds=[...new Set((data||[]).map(x=>x.tournament_id))],playerIds=[...new Set((data||[]).map(x=>x.player_id))];
    const [t,p]=await Promise.all([
     tournamentIds.length?supabase.from('tournaments').select('id,title').in('id',tournamentIds):Promise.resolve({data:[],error:null}),
     playerIds.length?supabase.from('profiles').select('id,display_name,plato_id').in('id',playerIds):Promise.resolve({data:[],error:null})
    ]);
    if(t.error)throw t.error;if(p.error)throw p.error;const tm=new Map((t.data||[]).map(x=>[x.id,x.title]));const pm=new Map((p.data||[]).map(x=>[x.id,x]));
    headers=['مسابقه','بازیکن','Plato ID','رتبه','امتیاز','برد','باخت','امتیاز زده','امتیاز خورده','آخرین ویرایش'];
    rows=(data||[]).map(x=>{const player=pm.get(x.player_id);return [tm.get(x.tournament_id)||x.tournament_id,player?.display_name||'',player?.plato_id||'',x.placement,x.points,x.wins,x.losses,x.score_for,x.score_against,formatIranDateTime(x.updated_at)];});
   }
   const stamp=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   downloadCsv('plato-land-'+dataset+'-'+stamp+'.csv',headers,rows);
   setMessage('خروجی '+labels[dataset]+' با '+rows.length.toLocaleString('fa-IR')+' ردیف آماده شد.');
  }catch(e:any){setError(e?.message||'تهیه خروجی ناموفق بود.');}
  finally{setBusy(false);}
 }
 return <section className="owner-exports panel"><div className="admin-toolbar"><div><span className="section-kicker">گزارش و خروجی داده</span><h2>دریافت خروجی اطلاعات</h2><p>فقط مالک سایت به این بخش دسترسی دارد. اطلاعات خصوصی تصویر پروفایل و مسیر فایل‌ها در خروجی قرار نمی‌گیرند.</p></div><FileSpreadsheet size={24}/></div><div className="owner-export-controls"><label>نوع اطلاعات<select value={dataset} onChange={e=>{setDataset(e.target.value as Dataset);setMessage('');setError('');}}>{Object.entries(labels).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label><button type="button" className="gold-button" onClick={()=>void exportData()} disabled={busy}><Download size={16}/>{busy?'در حال آماده‌سازی…':'دریافت فایل CSV'}</button></div>{error&&<p className="auth-inline-error" role="alert">{error}</p>}{message&&<p className="form-footnote"><ShieldCheck size={15}/> {message}</p>}</section>;
}
