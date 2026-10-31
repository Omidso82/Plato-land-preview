import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { CalendarDays, Trophy, Users, Swords, RefreshCw, Clock3 } from 'lucide-react';

type Row = { id:string; tournament_id:string; status:string; registration_type:string; is_reserve:boolean; display_name:string|null; plato_id:string|null; team_name:string|null };
type Tournament = { id:string; title:string; game_type:string; series_name:string|null; description:string|null; rules:string|null; status:string; registration_open:boolean; starts_at:string|null; platform_settings:any };
type Player = { id:string; name:string; platoId:string; wins?:number; level?:number };
type Snapshot = { players?:Player[]; groups?:{name:string;players:Player[]}[]; drawReady?:boolean; scores?:Record<string,{played:number;won:number;lost:number;points:number}>; knockoutRounds?:{name:string;matches:{id:string;player1:Player|null;player2:Player|null;winnerId:string|null}[]}[] };

const statusText:Record<string,string>={pending:'در انتظار بررسی',approved:'تأیید شده',registered:'تأیید شده',rejected:'رد شده',withdrawn:'انصراف داده'};

export default function PlayerTournamentHub(){
 const [items,setItems]=useState<{registration:Row;tournament:Tournament;snapshot:Snapshot|null;members:any[]}[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const load=useCallback(async()=>{
  if(!supabase){setError('اتصال به سرور برقرار نیست.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user)throw new Error('برای دیدن مسابقات وارد حساب خود شو.');
   const {data:regs,error:regError}=await supabase.from('registrations').select('id,tournament_id,status,registration_type,is_reserve,display_name,plato_id,team_name').eq('player_id',user.id).order('created_at',{ascending:false});
   if(regError)throw regError;
   const rows=(regs||[]) as Row[];
   if(!rows.length){setItems([]);return;}
   const ids=[...new Set(rows.map(r=>r.tournament_id))];
   const [{data:ts,error:tsError},{data:members,error:membersError},{data:snapshots,error:snapshotError}]=await Promise.all([
    supabase.from('tournaments').select('id,title,game_type,series_name,description,rules,status,registration_open,starts_at,platform_settings').in('id',ids),
    supabase.from('registration_members').select('registration_id,display_name,plato_id,is_captain').in('registration_id',rows.map(r=>r.id)),
    supabase.from('competition_snapshots').select('tournament_id,snapshot').in('tournament_id',ids)
   ]);
   if(tsError)throw tsError;if(membersError)throw membersError;if(snapshotError)throw snapshotError;
   const tmap=new Map((ts||[]).map((t:any)=>[t.id,t as Tournament]));
   const smap=new Map((snapshots||[]).map((s:any)=>[s.tournament_id,s.snapshot as Snapshot]));
   const mmap=new Map<string,any[]>();(members||[]).forEach((m:any)=>mmap.set(m.registration_id,[...(mmap.get(m.registration_id)||[]),m]));
   setItems(rows.flatMap(registration=>{const tournament=tmap.get(registration.tournament_id);if(!tournament)return[];return[{registration,tournament,snapshot:smap.get(tournament.id)||null,members:mmap.get(registration.id)||[]}]}));
  }catch(e:any){setError(e?.message||'دریافت مسابقات ثبت‌نام‌شده ناموفق بود.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{
  if(!supabase)return;
  let channel:any;
  supabase.auth.getUser().then(({data})=>{if(data.user)channel=supabase.channel('player-tournament-hub-'+data.user.id).on('postgres_changes',{event:'*',schema:'public',table:'registrations',filter:'player_id=eq.'+data.user.id},()=>void load()).subscribe();});
  return()=>{if(channel)supabase?.removeChannel(channel)};
 },[load]);
 return <section className="player-tournament-hub panel">
  <div className="player-hub-heading"><div><span className="section-kicker">مسابقات من</span><h2>مسابقات و وضعیت رقابت‌ها</h2><p>مسابقاتی که با این حساب ثبت‌نام کرده‌ای، همراه با وضعیت تأیید و برنامهٔ بازی‌ها.</p></div><button type="button" className="outline-button" onClick={()=>void load()} disabled={loading}><RefreshCw size={15}/> بروزرسانی</button></div>
  {loading?<p className="empty-state">در حال دریافت مسابقات از سرور…</p>:error?<p className="auth-inline-error" role="alert">{error}</p>:!items.length?<p className="empty-state">هنوز ثبت‌نامی برای این حساب پیدا نشد.</p>:items.map(({registration:r,tournament:t,snapshot,members})=>{
   const approved=['approved','registered'].includes(r.status);
   const settings=t.platform_settings||{};
   const myName=r.registration_type==='team'?(r.team_name||r.display_name||'تیم'):r.display_name||'بازیکن';
   const myEntryId=r.id;
   const group=(snapshot?.groups||[]).find(g=>g.players?.some(p=>p.id===myEntryId));
   const myMatches=(snapshot?.knockoutRounds||[]).flatMap(round=>(round.matches||[]).map(match=>({round:round.name,match}))).filter(x=>x.match.player1?.id===myEntryId||x.match.player2?.id===myEntryId);
   const nextMatch=myMatches.find(x=>!x.match.winnerId)||myMatches[0];
   const opponent=nextMatch?(nextMatch.match.player1?.id===myEntryId?nextMatch.match.player2:nextMatch.match.player1):null;
   const publicSeeding=settings.publicSeeding!==false&&settings.progression!=='knockout_only';
   const publicDraw=settings.publicDraw!==false;
   const publicBracket=settings.publicBracket!==false;
   const publicTables=settings.publicTables!==false;
   const seedList=[...(snapshot?.players||[])].sort((a,b)=>settings.seedingOrder==='asc'?(a.wins||0)-(b.wins||0):(b.wins||0)-(a.wins||0));
   const seedIndex=seedList.findIndex(p=>p.id===myEntryId);
   return <article className="player-tournament-card" key={r.id}>
    <div className="player-tournament-top"><div><span className="section-kicker">{t.game_type||'مسابقه'}{t.series_name?' · '+t.series_name:''}</span><h3>{t.title}</h3><p>{myName} · Plato ID: {r.plato_id||'—'}</p></div><span className={'player-reg-status '+(approved?'is-approved':'')}>{statusText[r.status]||r.status}{r.is_reserve?' · ذخیره':''}</span></div>
    {t.starts_at&&<p className="player-tournament-date"><CalendarDays size={15}/> شروع مسابقه: {new Date(t.starts_at).toLocaleDateString('fa-IR')}</p>}
    {r.registration_type==='team'&&members.length>0&&<div className="player-team-members"><strong>اعضای تیم</strong>{members.map((m:any)=><span key={m.plato_id}>{m.display_name} · {m.plato_id}{m.is_captain?' (سرگروه)':''}</span>)}</div>}
    {approved&&!r.is_reserve?<div className="player-competition-details">
     {publicSeeding&&<div className="player-detail-block"><h4><Trophy size={16}/> سیدبندی</h4>{seedIndex>=0?<p>رتبهٔ فعلی در سیدبندی: <strong>{seedIndex+1}</strong></p>:<p>سیدبندی هنوز توسط مدیر مسابقه ثبت نشده است.</p>}</div>}
     {settings.progression!=='knockout_only'&&publicDraw&&<div className="player-detail-block"><h4><Users size={16}/> گروه‌بندی</h4>{group?<p>شما در <strong>گروه {group.name}</strong> قرار گرفته‌ای.</p>:<p>قرعه‌کشی گروهی هنوز ثبت نشده است.</p>}</div>}
     {settings.progression==='knockout_only'&&publicBracket&&<div className="player-detail-block"><h4><Swords size={16}/> مرحلهٔ حذفی و حریف</h4>{nextMatch?<p>{nextMatch.round||'مرحلهٔ حذفی'} · {opponent?<>حریف شما: <strong>{opponent.name}</strong> (Plato ID: {opponent.platoId})</>: 'در این دور استراحت داری یا حریف هنوز مشخص نشده است.'}</p>:<p>قرعه و حریف‌ها هنوز توسط مدیر مسابقه منتشر نشده‌اند.</p>}</div>}
     {settings.progression!=='knockout_only'&&publicTables&&group&&<div className="player-detail-block"><h4><Trophy size={16}/> وضعیت جدول گروه</h4>{(snapshot?.scores?.[myEntryId])?<p>برد: {snapshot.scores[myEntryId].won} · امتیاز: {snapshot.scores[myEntryId].points}</p>:<p>هنوز نتیجه‌ای برای شما ثبت نشده است.</p>}</div>}
     {settings.progression!=='knockout_only'&&publicBracket&&settings.progression!=='groups_only'&&<div className="player-detail-block"><h4><Swords size={16}/> مسیر حذفی</h4>{myMatches.length?<p>{nextMatch?.round||'مرحلهٔ حذفی'} · {opponent?'حریف: '+opponent.name:'در انتظار تعیین حریف'}</p>:<p>پس از پایان مرحلهٔ گروهی و ثبت صعودکنندگان، مسیر حذفی نمایش داده می‌شود.</p>}</div>}
     {!snapshot?.drawReady&&<p className="player-hub-note"><Clock3 size={15}/> قرعه‌کشی و جدول هنوز برای بازیکنان منتشر نشده است.</p>}
    </div>:<p className="player-hub-note">{r.is_reserve?'این ثبت‌نام در صف ذخیره قرار دارد.':'پس از تأیید مدیر، جزئیات رقابت در همین بخش نمایش داده می‌شود.'}</p>}
    {t.rules&&<details className="player-tournament-rules"><summary>مشاهدهٔ قوانین مسابقه</summary><p>{t.rules}</p></details>}
   </article>
  })}
 </section>;
}
