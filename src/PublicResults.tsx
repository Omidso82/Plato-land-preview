import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Medal, Trophy } from 'lucide-react';

type ResultRow={id:string;player_id:string;placement:number|null;points:number;wins:number;losses:number;score_for:number;score_against:number;display_name:string;plato_id:string};
export default function PublicResults({tournamentId}:{tournamentId:string}){
 const [rows,setRows]=useState<ResultRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(!supabase||!tournamentId){setLoading(false);return;}
  let alive=true;
  async function load(){
   setLoading(true);setError('');
   try{
    const {data:results,error:resultsError}=await supabase!.from('tournament_results').select('id,player_id,placement,points,wins,losses,score_for,score_against').eq('tournament_id',tournamentId).order('placement',{ascending:true,nullsFirst:false});
    if(resultsError)throw resultsError;
    const ids=(results||[]).map((row:any)=>row.player_id);
    const {data:profiles,error:profilesError}=ids.length?await supabase!.from('profiles').select('id,display_name,plato_id').in('id',ids):{data:[],error:null};
    if(profilesError)throw profilesError;
    const profileMap=new Map((profiles||[]).map((profile:any)=>[profile.id,profile]));
    if(alive)setRows((results||[]).map((row:any)=>({...row,...(profileMap.get(row.player_id)||{}),display_name:profileMap.get(row.player_id)?.display_name||'بازیکن',plato_id:profileMap.get(row.player_id)?.plato_id||''})));
   }catch(e:any){if(alive)setError(e?.message||'دریافت نتایج مسابقه ناموفق بود.');}
   finally{if(alive)setLoading(false);}
  }
  void load();
  return ()=>{alive=false;};
 },[tournamentId]);
 return <section className="public-results"><div className="section-heading"><div><span className="section-kicker">جدول نهایی</span><h3>نتایج مسابقه</h3></div><Trophy size={22}/></div>{loading?<p className="panel empty-state">در حال دریافت نتایج…</p>:error?<p className="auth-inline-error" role="alert">{error}</p>:rows.length===0?<div className="panel empty-state"><Medal size={24}/><strong>نتیجه تأییدشده‌ای برای نمایش ثبت نشده است.</strong></div>:<div className="public-results-table-wrap"><table className="public-results-table"><thead><tr><th>رتبه</th><th>بازیکن</th><th>Plato ID</th><th>برد</th><th>باخت</th><th>امتیاز</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.id}><td>{(row.placement||index+1).toLocaleString('fa-IR')}</td><td>{row.display_name}</td><td dir="ltr">{row.plato_id}</td><td>{row.wins.toLocaleString('fa-IR')}</td><td>{row.losses.toLocaleString('fa-IR')}</td><td>{row.points.toLocaleString('fa-IR')}</td></tr>)}</tbody></table></div>}</section>;
}
