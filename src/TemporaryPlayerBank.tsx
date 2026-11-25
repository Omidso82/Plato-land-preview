import PlayerSuspensionHistory from './PlayerSuspensionHistory';
import React,{useEffect,useState} from 'react';
import {supabase} from './supabase';

type Player={id:string;plato_id:string;first_seen_at:string;last_seen_at:string;plato_id_normalized:string};
type Entry={id:string;player_id:string;event_key:string;game_type_key:string;registration_status:string|null;registered_at:string|null;source_table:string};
type Match={id:string;event_key:string;game_type_key:string;source_match_key:string;stage:string;group_name:string|null;match_date:string|null;player_a_id:string|null;player_a_plato_id:string|null;player_b_id:string|null;player_b_plato_id:string|null;score_a:number|null;score_b:number|null;winner_player_id:string|null;result_status:string;played_at:string|null};
type TeamResult={event_key:string;game_type_key:string;slot:number;team_name:string;opponent_name:string;result:string};
type EventInfo={event_key:string;label:string;game_type_key:string;sort_order:number};
type GameType={game_key:string;label:string;icon:string;sort_order:number;is_active:boolean};

const fa=(n:number)=>n.toLocaleString('fa-IR');
const panel:React.CSSProperties={marginTop:18,padding:16,border:'1px solid #8c6a34',borderRadius:14,background:'#111214'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.8};
const gold:React.CSSProperties={color:'#e4c77e'};
const btn:React.CSSProperties={background:'#252525',border:'1px solid #66512d',borderRadius:9,color:'#f2e6c9',padding:'9px 12px',fontWeight:700,cursor:'pointer'};

async function readPages<T>(fetchPage:(from:number,to:number)=>PromiseLike<{data:T[]|null;error:unknown}>):Promise<T[]> {
 const rows:T[]=[];
 const size=100;
 for(let from=0;;from+=size){
  const {data,error}=await fetchPage(from,from+size-1);
  if(error)throw error;
  rows.push(...(data??[]));
  if((data?.length??0)<size)return rows;
 }
}

export default function TemporaryPlayerBank(){
 const [players,setPlayers]=useState<Player[]>([]),[entries,setEntries]=useState<Entry[]>([]),[matches,setMatches]=useState<Match[]>([]),[gameTypes,setGameTypes]=useState<GameType[]>([]);
 const [teamResults,setTeamResults]=useState<TeamResult[]>([]);
 const [events,setEvents]=useState<EventInfo[]>([]);
 const [totals,setTotals]=useState({players:0,matches:0,entries:{} as Record<string,number>});
 const [query,setQuery]=useState(''),[selectedId,setSelectedId]=useState(''),[selectedGameKey,setSelectedGameKey]=useState('');
 const [eventFilter,setEventFilter]=useState(''),[page,setPage]=useState(0),[revision,setRevision]=useState(0);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[detailError,setDetailError]=useState(''),[detailLoading,setDetailLoading]=useState(false);
 const [searchCount,setSearchCount]=useState(0);
 const [selectedPlayer,setSelectedPlayer]=useState<Player|null>(null);

 useEffect(()=>{
  const db=supabase;
  if(!db){setError('اتصال به دیتابیس در دسترس نیست.');setLoading(false);return;}
  let active=true;
  setLoading(true);setError('');
  void (async()=>{
   try {
    const [playerTotal,matchTotal,games,catalog]=await Promise.all([
     db.from('plato_land_temp_players').select('id',{head:true,count:'exact'}),
     db.from('plato_land_temp_player_match_feed').select('id',{head:true,count:'exact'}),
     db.from('plato_land_temp_game_types').select('game_key,label,icon,sort_order,is_active').eq('is_active',true).order('sort_order').order('label'),
     db.from('plato_land_temp_events').select('event_key,label,game_type_key,sort_order').order('sort_order').order('event_key')
    ]);
    for(const response of [playerTotal,matchTotal,games,catalog]) if(response.error) throw response.error;
    const eventRows=catalog.data??[];
    const counts=await Promise.all(eventRows.map(async event=>{
     const response=await db.from('plato_land_temp_player_entries').select('id',{head:true,count:'exact'}).eq('event_key',event.event_key);
     if(response.error) throw response.error;
     return [event.event_key,response.count??0] as const;
    }));
    if(!active)return;
    setEvents(eventRows);setGameTypes(games.data??[]);
    setTotals({players:playerTotal.count??0,matches:matchTotal.count??0,entries:Object.fromEntries(counts)});
   } catch { if(active)setError('دریافت آمار بانک بازیکنان ناموفق بود.'); }
   finally { if(active)setLoading(false); }
  })();
  return ()=>{active=false;};
 },[revision]);

 const [listLoading,setListLoading]=useState(true),[listError,setListError]=useState('');
 useEffect(()=>{
  const db=supabase;
  if(!db)return;
  let active=true;
  setListLoading(true);setListError('');
  const timer=setTimeout(async()=>{
   const term=query.trim().replace(/[\\%_*]/g,character=>`\${character}`);
   const request=db.from('plato_land_temp_players').select('id,plato_id,plato_id_normalized,first_seen_at,last_seen_at',{count:'exact'}).order('plato_id_normalized').range(page*25,page*25+24);
   const response=await (term?request.ilike('plato_id_normalized',`%${term}%`):request);
   if(!active)return;
   if(response.error){setListError('دریافت فهرست بازیکنان ناموفق بود.');setPlayers([]);setSearchCount(0);}
   else {setPlayers(response.data??[]);setSearchCount(response.count??0);}
   setListLoading(false);
  },query?220:0);
  return ()=>{active=false;clearTimeout(timer);};
 },[page,query,revision]);

 useEffect(()=>{
  const db=supabase;
  if(!db||!selectedId)return;
  let active=true;
  setDetailLoading(true);setDetailError('');
  void (async()=>{
   try {
    const [entryRows,matchRows,teamRows]=await Promise.all([
     readPages<Entry>((from,to)=>db.from('plato_land_temp_player_entries').select('id,player_id,event_key,game_type_key,registration_status,registered_at,source_table').eq('player_id',selectedId).order('registered_at',{ascending:false}).order('id').range(from,to)),
     readPages<Match>((from,to)=>db.from('plato_land_temp_player_match_feed').select('id,event_key,game_type_key,source_match_key,stage,group_name,match_date,player_a_id,player_a_plato_id,player_b_id,player_b_plato_id,score_a,score_b,winner_player_id,result_status,played_at').or(`player_a_id.eq.${selectedId},player_b_id.eq.${selectedId}`).order('match_date',{ascending:false,nullsFirst:false}).order('id').range(from,to)),
     readPages<TeamResult>((from,to)=>db.rpc('plato_land_temp_player_team_results',{p_player_id:selectedId}).order('slot').range(from,to))
    ]);
    if(active){setEntries(entryRows);setMatches(matchRows);setTeamResults(teamRows);}
   } catch {if(active)setDetailError('دریافت پرونده بازیکن ناموفق بود.');}
   finally {if(active)setDetailLoading(false);}
  })();
  return ()=>{active=false;};
 },[selectedId,revision]);

 const eventLabel=(key:string)=>events.find(e=>e.event_key===key)?.label||key;
 const player=selectedPlayer;
 const playerEntries=entries,playerMatches=matches;
 const gameEntries=playerEntries.filter(e=>e.game_type_key===selectedGameKey&&(!eventFilter||e.event_key===eventFilter));
 const gameMatches=playerMatches.filter(m=>m.game_type_key===selectedGameKey&&(!eventFilter||m.event_key===eventFilter));
 const gameTeamResults=teamResults.filter(result=>result.game_type_key===selectedGameKey&&(!eventFilter||result.event_key===eventFilter));
 const activeGame=gameTypes.find(g=>g.game_key===selectedGameKey)||null;
 const stats=(rows:Match[])=>({played:rows.filter(m=>m.result_status==='completed'||m.result_status==='double_no_show').length,wins:rows.filter(m=>m.result_status==='completed'&&m.winner_player_id===selectedId).length,losses:rows.filter(m=>m.result_status==='completed'&&!!m.winner_player_id&&m.winner_player_id!==selectedId).length,pending:rows.filter(m=>m.result_status==='pending').length});
 const date=(v:string|null)=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('fa-IR',{timeZone:'Europe/Copenhagen'});};
 const stage=(v:string)=>({round32:'مرحله ۳۲ نفر',cutoff_playoff:'پلی‌آف صعود',individual_game:'بازی انفرادی',individual_decider:'بازی انفرادی تعیین‌کننده',group:'مرحله گروهی',round16:'مرحله ۱۶ نفر',quarter:'یک‌چهارم نهایی',semi:'نیمه‌نهایی',final:'فینال',third_place:'رده‌بندی'} as Record<string,string>)[v]||v;
 const status=(v:string)=>v==='completed'?'انجام‌شده':v==='pending'?'در انتظار':v==='double_no_show'?'عدم حضور دوطرفه':v;
 const entryStatus=(v:string|null)=>v==='pending'?'در انتظار انتخاب':v==='excluded'?'کنار گذاشته‌شده':(v==='selected'||v==='accepted')?'انتخاب‌شده':v==='main'?'اصلی':v==='waitlist'?'انتظار':v==='withdrawn'?'انصراف / خارج‌شده':v||'ثبت‌شده';
 const choosePlayer=(next:Player|null)=>{
  setSelectedPlayer(next);setSelectedId(next?.id??'');setSelectedGameKey('');setEventFilter('');
  setEntries([]);setMatches([]);setTeamResults([]);setDetailError('');setDetailLoading(Boolean(next));
 };
 return <section dir="rtl" style={panel}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><div><h2 style={{color:'#f6e8c5',fontSize:21,margin:'0 0 5px'}}>بانک دائمی بازیکنان</h2><p style={{...muted,margin:0}}>جست‌وجوی Plato ID و مشاهده سابقه بازی‌ها و مسابقات</p></div><button style={btn} disabled={loading} onClick={()=>setRevision(value=>value+1)}>{loading?'در حال دریافت…':'به‌روزرسانی'}</button></div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(115px,1fr))',gap:9,marginTop:15}}>{[{label:'کل بازیکنان',value:totals.players},...events.map(t=>({label:'ثبت‌نام '+t.label,value:totals.entries[t.event_key]??0})),{label:'مسابقات ثبت‌شده',value:totals.matches}].map(x=><div key={x.label} style={{background:'#211b12',border:'1px solid #66512d',borderRadius:10,padding:10}}><div style={muted}>{x.label}</div><strong style={{fontSize:22,...gold}}>{loading||error?'—':fa(x.value)}</strong></div>)}</div>
  <label style={{display:'block',...muted,marginTop:15}}>جست‌وجو با Plato ID<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} dir="ltr" autoComplete="off" placeholder="مثلاً omd82" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:12,borderRadius:9,border:'1px solid #705b31',background:'#090a0c',color:'#fff',fontSize:16}}/></label>
  {error&&<p role="alert" style={{color:'#f0aaaa',overflowWrap:'anywhere'}}>{error}</p>}
  {loading?<p style={muted}>در حال دریافت اطلاعات بازیکنان…</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:12}}>
   <div style={{border:'1px solid #51452d',borderRadius:10,padding:10,background:'#151515',maxHeight:360,overflowY:'auto'}}><strong style={gold}>فهرست بازیکنان · {fa(searchCount)} مورد</strong>{listLoading?<p style={muted}>در حال دریافت فهرست…</p>:listError?<p role="alert">{listError}</p>:players.length===0?<p style={muted}>بازیکنی با این شناسه پیدا نشد.</p>:players.map(p=><button key={p.id} type="button" onClick={()=>choosePlayer(p)} style={{display:'block',width:'100%',textAlign:'left',direction:'ltr',marginTop:7,padding:10,borderRadius:8,border:selectedId===p.id?'1px solid #e4c77e':'1px solid #39342b',background:selectedId===p.id?'#302515':'#101113',color:'#f4ead2',cursor:'pointer',fontWeight:700}}>{p.plato_id}</button>)}{searchCount>25&&<div style={{display:'flex',gap:8,marginTop:12}}><button style={btn} disabled={listLoading||page===0} onClick={()=>setPage(page-1)}>قبلی</button><button style={btn} disabled={listLoading||(page+1)*25>=searchCount} onClick={()=>setPage(page+1)}>بعدی</button></div>}</div>
   <div style={player?{position:'fixed',inset:0,zIndex:10000,background:'rgba(0,0,0,.82)',backdropFilter:'blur(4px)',padding:'max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom))',boxSizing:'border-box',overflowY:'auto',display:'flex',justifyContent:'center',alignItems:'center'}:{minWidth:0}}>{!player?<div style={{border:'1px dashed #66512d',borderRadius:10,padding:18,color:'#aaa',textAlign:'center'}}>برای مشاهده پرونده، یک Plato ID را انتخاب کن.</div>:<div role="dialog" aria-modal="true" aria-label="پرونده کامل بازیکن" style={{width:'100%',maxWidth:760,maxHeight:'100%',overflowY:'auto',position:'relative',background:'#111214',border:'1px solid #b18b45',borderRadius:16,padding:14,boxSizing:'border-box',boxShadow:'0 18px 70px rgba(0,0,0,.65)'}}>
    <button type="button" aria-label="بستن پرونده بازیکن" onClick={()=>choosePlayer(null)} style={{position:'sticky',top:0,marginRight:'auto',display:'block',width:42,height:42,borderRadius:22,border:'1px solid #b18b45',background:'#2a2115',color:'#f6e8c5',fontSize:28,lineHeight:1,cursor:'pointer',zIndex:2}}>×</button>
    <div style={{border:'1px solid #8c6a34',borderRadius:10,padding:14,background:'linear-gradient(145deg,#2b2113,#121315)'}}><div style={muted}>پرونده بازیکن</div><div dir="ltr" style={{fontSize:25,fontWeight:900,...gold,overflowWrap:'anywhere'}}>{player.plato_id}</div><p style={{...muted,margin:'8px 0 0'}}>اولین ثبت: {date(player.first_seen_at)}</p><p style={{...muted,margin:'2px 0'}}>آخرین مشاهده: {date(player.last_seen_at)}</p></div>
    <PlayerSuspensionHistory key={player.id} playerId={player.id} revision={revision} />
    {detailLoading?<p style={muted}>در حال دریافت پرونده…</p>:detailError?<p role="alert">{detailError}</p>:!selectedGameKey?<div style={{marginTop:13}}><h3 style={{...gold,fontSize:18}}>سوابق بر اساس نوع بازی</h3><p style={muted}>برای مشاهده جزئیات، نوع بازی را انتخاب کن.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10,marginTop:10}}>{gameTypes.map(game=>{const es=playerEntries.filter(e=>e.game_type_key===game.game_key),ms=playerMatches.filter(m=>m.game_type_key===game.game_key),s=stats(ms);return <button key={game.game_key} type="button" onClick={()=>setSelectedGameKey(game.game_key)} style={{textAlign:'right',border:'1px solid #8c6a34',borderRadius:12,padding:14,background:'linear-gradient(145deg,#2b2113,#141517)',color:'#f4ead2',cursor:'pointer'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}><strong style={{...gold,fontSize:18}}>{game.icon} {game.label}</strong><span style={{color:'#d8c79e'}}>‹</span></div><div style={{...muted,marginTop:8}}>بازی: {fa(s.played)} · برد: {fa(s.wins)} · باخت: {fa(s.losses)}</div><div style={muted}>در انتظار: {fa(s.pending)} · ثبت‌نام: {fa(es.length)}</div><div style={{...muted,marginTop:6}}>مشاهده سوابق {game.label} ←</div></button>;})}</div>{gameTypes.length===0&&<p style={muted}>هنوز نوع بازی فعالی تعریف نشده است.</p>}</div>:<div style={{marginTop:13}}>
     <button type="button" onClick={()=>{setSelectedGameKey('');setEventFilter('');}} style={{...btn,marginBottom:12}}>→ بازگشت به انواع بازی</button>
     <h3 style={{...gold,fontSize:19,margin:'0 0 10px'}}>{activeGame?.icon} سوابق {activeGame?.label||'بازی'}</h3>
     <label style={{display:'block',...muted,marginBottom:10}}>تورنمنت <select value={eventFilter} onChange={event=>setEventFilter(event.target.value)} style={btn}><option value="">همه تورنمنت‌ها</option>{events.filter(event=>event.game_type_key===selectedGameKey).map(event=><option key={event.event_key} value={event.event_key}>{event.label}</option>)}</select></label>
     {(()=>{const s=stats(gameMatches);return <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:7}}>{[{label:'بازی',value:s.played},{label:'برد',value:s.wins},{label:'باخت',value:s.losses},{label:'در انتظار',value:s.pending}].map(x=><div key={x.label} style={{border:'1px solid #51452d',borderRadius:9,padding:8,background:'#171717',textAlign:'center'}}><strong style={{...gold,fontSize:20}}>{fa(x.value)}</strong><div style={muted}>{x.label}</div></div>)}</div>;})()}
     <div style={{marginTop:14}}><strong style={gold}>سوابق ثبت‌نام</strong>{gameEntries.length===0?<p style={muted}>سابقه ثبت‌نامی برای این بازی ثبت نشده است.</p>:gameEntries.map(e=><div key={e.id} style={{padding:'9px 0',borderBottom:'1px solid #39342b',...muted}}><strong style={{color:'#eee'}}>{eventLabel(e.event_key)}</strong> · {entryStatus(e.registration_status)}<div>{date(e.registered_at)}</div></div>)}</div>
     {gameTeamResults.length>0&&<div style={{marginTop:14}}>
      <strong style={gold}>نتایج تیمی</strong>
      {gameTeamResults.map(result=><div key={result.slot} style={{padding:'9px 0',...muted}}>
       {eventLabel(result.event_key)} · {result.team_name} / {result.opponent_name} · {result.result==='won'?'برد تیم':result.result==='lost'?'باخت تیم':'در انتظار نتیجه'}
      </div>)}
     </div>}
     <div style={{marginTop:14}}><strong style={gold}>تاریخچه مسابقات · {fa(gameMatches.length)}</strong>{gameMatches.length===0?<p style={muted}>مسابقه‌ای در سابقه این بازی ثبت نشده است.</p>:<div style={{display:'grid',gap:8,marginTop:8}}>{gameMatches.map(m=>{const isA=m.player_a_id===selectedId,opponent=isA?m.player_b_plato_id:m.player_a_plato_id,own=isA?m.score_a:m.score_b,other=isA?m.score_b:m.score_a,result=m.result_status==='pending'?'در انتظار':m.result_status==='double_no_show'?'عدم حضور دوطرفه':!m.winner_player_id?'—':m.winner_player_id===selectedId?'برد':'باخت';return <article key={m.id} style={{border:'1px solid #39342b',borderRadius:9,padding:10,background:'#151515'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong style={gold}>{eventLabel(m.event_key)} · {stage(m.stage)}</strong><span style={muted}>{status(m.result_status)}</span></div><div style={{marginTop:6}}>حریف: <b dir="ltr">{opponent||'—'}</b></div><div style={muted}>نتیجه: {own??'—'} - {other??'—'} · {result}</div><div style={muted}>{m.group_name?('گروه '+m.group_name+' · '):''}{date(m.played_at||m.match_date)}</div></article>;})}</div>}</div>
    </div>}
   </div>}</div>
  </div>}
  <p style={{...muted,marginTop:14}}>این گزارش فقط بر اساس Plato ID است؛ شناسه‌های متفاوت به‌صورت خودکار به یک شخص ادغام نمی‌شوند. اطلاعات از جداول اختصاصی بانک بازیکنان خوانده می‌شود و داده‌های ثبت‌نام/نتایج اصلی را تغییر نمی‌دهد.</p>
 </section>;
}
