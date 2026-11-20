import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';
type Player={id:string;plato_id:string;first_seen_at:string;last_seen_at:string;plato_id_normalized:string};
type Entry={id:string;player_id:string;event_key:'series2'|'series3';registration_status:string|null;registered_at:string|null;source_table:string};
type Match={id:string;event_key:'series2'|'series3';source_match_key:string;stage:string;group_name:string|null;match_date:string|null;player_a_id:string|null;player_a_plato_id:string|null;player_b_id:string|null;player_b_plato_id:string|null;score_a:number|null;score_b:number|null;winner_player_id:string|null;result_status:string;played_at:string|null};
const fa=(n:number)=>n.toLocaleString('fa-IR');
const panel:React.CSSProperties={marginTop:18,padding:16,border:'1px solid #8c6a34',borderRadius:14,background:'#111214'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.8};
const gold:React.CSSProperties={color:'#e4c77e'};
const btn:React.CSSProperties={background:'#252525',border:'1px solid #66512d',borderRadius:9,color:'#f2e6c9',padding:'9px 12px',fontWeight:700,cursor:'pointer'};
export default function TemporaryPlayerBank(){
 const [players,setPlayers]=useState<Player[]>([]),[entries,setEntries]=useState<Entry[]>([]),[matches,setMatches]=useState<Match[]>([]);
 const [query,setQuery]=useState(''),[selectedId,setSelectedId]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[refreshing,setRefreshing]=useState(false);
 const load=useCallback(async()=>{
  if(!supabase){setError('اتصال به دیتابیس در دسترس نیست.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const [p,e,m]=await Promise.all([
    supabase.from('plato_land_temp_players').select('id,plato_id,plato_id_normalized,first_seen_at,last_seen_at').order('plato_id_normalized').limit(1000),
    supabase.from('plato_land_temp_player_entries').select('id,player_id,event_key,registration_status,registered_at,source_table').limit(2000),
    supabase.from('plato_land_temp_player_matches').select('id,event_key,source_match_key,stage,group_name,match_date,player_a_id,player_a_plato_id,player_b_id,player_b_plato_id,score_a,score_b,winner_player_id,result_status,played_at').order('match_date',{ascending:false}).limit(2000)
   ]);
   if(p.error)throw p.error;if(e.error)throw e.error;if(m.error)throw m.error;
   setPlayers((p.data||[]) as Player[]);setEntries((e.data||[]) as Entry[]);setMatches((m.data||[]) as Match[]);
  }catch(err){setError(err instanceof Error?err.message:'دریافت اطلاعات بانک بازیکنان ناموفق بود.');}
  finally{setLoading(false);setRefreshing(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return (q?players.filter(p=>p.plato_id.toLowerCase().includes(q)||p.plato_id_normalized.includes(q)):players).slice(0,80);},[players,query]);
 const player=players.find(p=>p.id===selectedId)||null;
 const playerEntries=entries.filter(e=>e.player_id===selectedId),playerMatches=matches.filter(m=>m.player_a_id===selectedId||m.player_b_id===selectedId);
 const stats=(event:'series2'|'series3')=>{const rows=playerMatches.filter(m=>m.event_key===event);return {played:rows.filter(m=>m.result_status==='completed'||m.result_status==='double_no_show').length,wins:rows.filter(m=>m.result_status==='completed'&&m.winner_player_id===selectedId).length,losses:rows.filter(m=>m.result_status==='completed'&&!!m.winner_player_id&&m.winner_player_id!==selectedId).length,pending:rows.filter(m=>m.result_status==='pending').length};};
 const date=(v:string|null)=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('fa-IR',{timeZone:'Europe/Copenhagen'});};
 const stage=(v:string)=>({group:'مرحله گروهی',round16:'مرحله ۱۶ نفر',quarter:'یک‌چهارم نهایی',semi:'نیمه‌نهایی',final:'فینال',third_place:'رده‌بندی'} as Record<string,string>)[v]||v;
 const status=(v:string)=>v==='completed'?'انجام‌شده':v==='pending'?'در انتظار':v==='double_no_show'?'عدم حضور دوطرفه':v;
 const entryStatus=(v:string|null)=>v==='main'?'اصلی':v==='waitlist'?'انتظار':v==='withdrawn'?'انصراف / خارج‌شده':v||'ثبت‌شده';
 return <section dir="rtl" style={panel}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><div><h2 style={{color:'#f6e8c5',fontSize:21,margin:'0 0 5px'}}>بانک دائمی بازیکنان</h2><p style={{...muted,margin:0}}>جست‌وجوی Plato ID و مشاهده سابقه ثبت‌نام و مسابقات سری دوم و سوم</p></div><button style={btn} disabled={loading} onClick={()=>{setRefreshing(true);void load();}}>{refreshing?'در حال دریافت…':'به‌روزرسانی'}</button></div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(115px,1fr))',gap:9,marginTop:15}}>{[{label:'کل بازیکنان',value:players.length},{label:'ثبت‌نام سری دوم',value:entries.filter(e=>e.event_key==='series2').length},{label:'ثبت‌نام سری سوم',value:entries.filter(e=>e.event_key==='series3').length},{label:'مسابقات ثبت‌شده',value:matches.length}].map(x=><div key={x.label} style={{background:'#211b12',border:'1px solid #66512d',borderRadius:10,padding:10}}><div style={muted}>{x.label}</div><strong style={{fontSize:22,...gold}}>{loading?'—':fa(x.value)}</strong></div>)}</div>
  <label style={{display:'block',...muted,marginTop:15}}>جست‌وجو با Plato ID<input value={query} onChange={e=>setQuery(e.target.value)} dir="ltr" autoComplete="off" placeholder="مثلاً omd82" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:12,borderRadius:9,border:'1px solid #705b31',background:'#090a0c',color:'#fff',fontSize:16}}/></label>
  {error&&<p role="alert" style={{color:'#f0aaaa',overflowWrap:'anywhere'}}>{error}</p>}
  {loading?<p style={muted}>در حال دریافت اطلاعات بازیکنان…</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:12}}>
   <div style={{border:'1px solid #51452d',borderRadius:10,padding:10,background:'#151515',maxHeight:360,overflowY:'auto'}}><strong style={gold}>فهرست بازیکنان · {fa(filtered.length)} مورد</strong>{filtered.length===0?<p style={muted}>بازیکنی با این شناسه پیدا نشد.</p>:filtered.map(p=><button key={p.id} type="button" onClick={()=>setSelectedId(p.id)} style={{display:'block',width:'100%',textAlign:'left',direction:'ltr',marginTop:7,padding:10,borderRadius:8,border:selectedId===p.id?'1px solid #e4c77e':'1px solid #39342b',background:selectedId===p.id?'#302515':'#101113',color:'#f4ead2',cursor:'pointer',fontWeight:700}}>{p.plato_id}</button>)}{filtered.length===80&&<p style={muted}>برای محدودکردن فهرست، بخشی از Plato ID را جست‌وجو کن.</p>}</div>
   <div style={player?{position:'fixed',inset:0,zIndex:10000,background:'rgba(0,0,0,.82)',backdropFilter:'blur(4px)',padding:'max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom))',boxSizing:'border-box',overflowY:'auto',display:'flex',justifyContent:'center',alignItems:'center'}:{minWidth:0}}>{!player?<div style={{border:'1px dashed #66512d',borderRadius:10,padding:18,color:'#aaa',textAlign:'center'}}>برای مشاهده پرونده، یک Plato ID را انتخاب کن.</div>:<div role="dialog" aria-modal="true" aria-label="پرونده کامل بازیکن" style={{width:'100%',maxWidth:760,maxHeight:'100%',overflowY:'auto',position:'relative',background:'#111214',border:'1px solid #b18b45',borderRadius:16,padding:14,boxSizing:'border-box',boxShadow:'0 18px 70px rgba(0,0,0,.65)'}}>
    <button type="button" aria-label="بستن پرونده بازیکن" onClick={()=>setSelectedId('')} style={{position:'sticky',top:0,marginRight:'auto',display:'block',width:42,height:42,borderRadius:22,border:'1px solid #b18b45',background:'#2a2115',color:'#f6e8c5',fontSize:28,lineHeight:1,cursor:'pointer',zIndex:2}}>×</button>
    <div style={{border:'1px solid #8c6a34',borderRadius:10,padding:14,background:'linear-gradient(145deg,#2b2113,#121315)'}}><div style={muted}>پرونده بازیکن</div><div dir="ltr" style={{fontSize:25,fontWeight:900,...gold,overflowWrap:'anywhere'}}>{player.plato_id}</div><p style={{...muted,margin:'8px 0 0'}}>اولین ثبت: {date(player.first_seen_at)}</p><p style={{...muted,margin:'2px 0'}}>آخرین مشاهده: {date(player.last_seen_at)}</p></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:10}}>{(['series2','series3'] as const).map(event=>{const s=stats(event);return <div key={event} style={{border:'1px solid #51452d',borderRadius:9,padding:10,background:'#151515'}}><strong style={gold}>{event==='series2'?'سری دوم':'سری سوم'}</strong><div style={{...muted,marginTop:5}}>بازی: {fa(s.played)}</div><div style={muted}>برد: {fa(s.wins)} · باخت: {fa(s.losses)}</div><div style={muted}>در انتظار: {fa(s.pending)}</div></div>;})}</div>
    <div style={{marginTop:13}}><strong style={gold}>سوابق ثبت‌نام</strong>{playerEntries.length===0?<p style={muted}>سابقه ثبت‌نامی ثبت نشده است.</p>:playerEntries.map(e=><div key={e.id} style={{padding:'9px 0',borderBottom:'1px solid #39342b',...muted}}><strong style={{color:'#eee'}}>{e.event_key==='series2'?'سری دوم':'سری سوم'}</strong> · {entryStatus(e.registration_status)}<div>{date(e.registered_at)}</div></div>)}</div>
    <div style={{marginTop:13}}><strong style={gold}>تاریخچه مسابقات · {fa(playerMatches.length)}</strong>{playerMatches.length===0?<p style={muted}>مسابقه‌ای در سابقه این بازیکن ثبت نشده است.</p>:<div style={{display:'grid',gap:8,marginTop:8}}>{playerMatches.map(m=>{const isA=m.player_a_id===selectedId,opponent=isA?m.player_b_plato_id:m.player_a_plato_id,own=isA?m.score_a:m.score_b,other=isA?m.score_b:m.score_a,result=m.result_status==='pending'?'در انتظار':m.result_status==='double_no_show'?'عدم حضور دوطرفه':m.winner_player_id===selectedId?'برد':'باخت';return <article key={m.id} style={{border:'1px solid #39342b',borderRadius:9,padding:10,background:'#151515'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong style={gold}>{m.event_key==='series2'?'سری دوم':'سری سوم'} · {stage(m.stage)}</strong><span style={muted}>{status(m.result_status)}</span></div><div style={{marginTop:6}}>حریف: <b dir="ltr">{opponent||'—'}</b></div><div style={muted}>نتیجه: {own??'—'} - {other??'—'} · {result}</div><div style={muted}>{m.group_name?('گروه '+m.group_name+' · '):''}{date(m.played_at||m.match_date)}</div></article>;})}</div>}</div>
   </>}</div></div>}
  </div>}
  <p style={{...muted,marginTop:14}}>این گزارش فقط بر اساس Plato ID است؛ شناسه‌های متفاوت به‌صورت خودکار به یک شخص ادغام نمی‌شوند. اطلاعات از جداول تاریخچه موقت خوانده می‌شود و داده‌های ثبت‌نام/نتایج اصلی را تغییر نمی‌دهد.</p>
 </section>;
}
