import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Users, ShieldCheck } from 'lucide-react';

type Participant = {
  id:string;
  registration_type:string;
  display_name:string|null;
  plato_id:string|null;
  team_name:string|null;
  slot_count:number|null;
  members:{display_name:string;plato_id:string;is_captain:boolean}[];
};

export default function PublicParticipants({ tournamentId, capacityUnit='players' }: { tournamentId:string; capacityUnit?:string }) {
  const [items,setItems]=useState<Participant[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!supabase||!tournamentId){setLoading(false);return;}
    let alive=true;
    async function load(){
      setLoading(true);setError('');
      try{
        const {data:rows,error:rowsError}=await supabase!.from('registrations').select('id,registration_type,display_name,plato_id,team_name,slot_count').eq('tournament_id',tournamentId).in('status',['approved','registered']).eq('is_reserve',false).order('created_at',{ascending:true});
        if(rowsError)throw rowsError;
        const ids=(rows||[]).map((row:any)=>row.id);
        const memberResult=ids.length?await supabase!.from('registration_members').select('registration_id,display_name,plato_id,is_captain').in('registration_id',ids):{data:[],error:null};
        if(memberResult.error)throw memberResult.error;
        const memberMap=new Map<string,{display_name:string;plato_id:string;is_captain:boolean}[]>();
        (memberResult.data||[]).forEach((member:any)=>memberMap.set(member.registration_id,[...(memberMap.get(member.registration_id)||[]),member]));
        if(alive)setItems((rows||[]).map((row:any)=>({...row,members:memberMap.get(row.id)||[]})));
      }catch(e:any){if(alive)setError(e?.message||'دریافت فهرست شرکت‌کنندگان ناموفق بود.');}
      finally{if(alive)setLoading(false);}
    }
    void load();
    const channel=supabase.channel('public-participants-'+tournamentId).on('postgres_changes',{event:'*',schema:'public',table:'registrations',filter:'tournament_id=eq.'+tournamentId},()=>void load()).subscribe();
    return ()=>{alive=false;void supabase?.removeChannel(channel);};
  },[tournamentId]);

  const total=items.reduce((sum,item)=>sum+Math.max(1,Number(item.slot_count)||1),0);
  return <section className="public-participants"><div className="section-heading"><div><span className="section-kicker">فهرست رسمی</span><h3>شرکت‌کنندگان تأییدشده</h3></div><div className="participants-total"><Users size={17}/><strong>{total.toLocaleString('fa-IR')}</strong><small>{capacityUnit==='teams'?'تیم/ظرفیت':'نفر'}</small></div></div>{loading?<p className="panel empty-state">در حال دریافت فهرست…</p>:error?<p className="auth-inline-error" role="alert">{error}</p>:items.length===0?<div className="panel empty-state"><ShieldCheck size={24}/><strong>هنوز شرکت‌کننده تأییدشده‌ای ثبت نشده است.</strong></div>:<div className="participants-list">{items.map(item=><article className="panel participant-card" key={item.id}><div className="participant-main"><strong>{item.registration_type==='team'?(item.team_name||item.display_name||'تیم'):item.display_name||'بازیکن'}</strong><span>{item.registration_type==='team'?'ثبت‌نام تیمی':'ثبت‌نام انفرادی'}</span>{item.registration_type!=='team'&&item.plato_id&&<small>Plato ID: {item.plato_id}</small>}</div>{item.members.length>0&&<div className="participant-members">{item.members.map(member=><span key={member.plato_id}>{member.display_name} · {member.plato_id}{member.is_captain?' · سرگروه':''}</span>)}</div>}</article>)}</div>}</section>;
}
