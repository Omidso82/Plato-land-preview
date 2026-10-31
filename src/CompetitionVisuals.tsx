import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, Shuffle, Layers3, ListOrdered, Users, BarChart3, RotateCcw, Crown } from 'lucide-react';

type Tournament = { id:string; title:string; game:string; progression:string; seedingMetric:string; seedingOrder:string; qualifiersPerGroup:string; publicSeeding:boolean; publicDraw:boolean; publicTables:boolean; publicBracket:boolean; status?:string };
type Registration = { id:string; name:string; platoId:string; tournamentId:string; status:string };
type Player = { id:string; name:string; platoId:string; wins:number; level:number };
type Group = { name:string; players:Player[] };
type Match = { id:string; player1:Player|null; player2:Player|null; winnerId:string|null };
type Round = { name:string; matches:Match[] };

const STORE_KEY = 'plato-land-live-competition-v1';
const metricLabel:Record<string,string> = { wins:'تعداد برد', win_rate:'درصد برد', level:'سطح بازیکن', rating:'امتیاز یا ریتینگ', points:'امتیاز مسابقات', manual:'رتبه‌بندی دستی' };

function shuffled<T>(items:T[]):T[] {
 const result=[...items];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
function roundNames(count:number):string[] {
 if(count<=0)return [];
 if(count===1)return ['فینال'];
 const names:string[]=[];
 for(let i=0;i<count;i++){
  const remaining=count-i;
  names.push(remaining===1?'فینال':remaining===2?'نیمه‌نهایی':remaining===3?'یک‌چهارم نهایی':remaining===4?'یک‌هشتم نهایی':`مرحله ${i+1}`);
 }
 return names;
}
function makeKnockout(players:Player[]):Round[] {
 if(players.length<2)return [];
 const entrants=shuffled(players);
 let slots=1;while(slots<entrants.length)slots*=2;
 while(entrants.length<slots)entrants.push(null as any);
 const first:Match[]=[];
 for(let i=0;i<slots;i+=2){
  const a=entrants[i]||null,b=entrants[i+1]||null;
  first.push({id:`r1m${i/2+1}`,player1:a,player2:b,winnerId:a&&!b?a.id:b&&!a?b.id:null});
 }
 const rounds:Round[]=[{name:'مرحله اول',matches:first}];
 let matchCount=first.length,round=2;
 while(matchCount>1){
  matchCount=Math.ceil(matchCount/2);
  rounds.push({name:'',matches:Array.from({length:matchCount},(_,i)=>({id:`r${round}m${i+1}`,player1:null,player2:null,winnerId:null}))});
  round++;
 }
 const names=roundNames(rounds.length);
 rounds.forEach((r,i)=>r.name=names[i]);
 for(let i=1;i<rounds.length;i++){
  const prev=rounds[i-1].matches;
  rounds[i].matches.forEach((m,j)=>{
   const a=prev[j*2]?.winnerId?([prev[j*2].player1,prev[j*2].player2].find(p=>p?.id===prev[j*2].winnerId)||null):null;
   const b=prev[j*2+1]?.winnerId?([prev[j*2+1].player1,prev[j*2+1].player2].find(p=>p?.id===prev[j*2+1].winnerId)||null):null;
   m.player1=a;m.player2=b;
   if(a&&!b)m.winnerId=a.id;
   else if(b&&!a)m.winnerId=b.id;
  });
 }
 return rounds;
}
function updateWinner(rounds:Round[],roundIndex:number,matchIndex:number,winnerId:string):Round[] {
 const next=rounds.map(r=>({name:r.name,matches:r.matches.map(m=>({...m}))}));
 const match=next[roundIndex]?.matches[matchIndex];
 if(!match||![match.player1?.id,match.player2?.id].includes(winnerId))return rounds;
 match.winnerId=winnerId;
 for(let ri=roundIndex+1;ri<next.length;ri++){
  const previous=next[ri-1].matches;
  next[ri].matches.forEach((m,mi)=>{
   const left=previous[mi*2];const right=previous[mi*2+1];
   const winner=(source:Match|undefined):Player|null=>source?.winnerId?([source.player1,source.player2].find(p=>p?.id===source.winnerId)||null):null;
   m.player1=winner(left);m.player2=winner(right);
   if(m.winnerId!==m.player1?.id&&m.winnerId!==m.player2?.id)m.winnerId=null;
   if(m.player1&&!m.player2)m.winnerId=m.player1.id;
   else if(m.player2&&!m.player1)m.winnerId=m.player2.id;
  });
 }
 return next;
}

export default function CompetitionVisuals({ tournaments, registrations }: { tournaments:Tournament[]; registrations:Registration[] }) {
 const [tournamentId,setTournamentId] = useState('');
 const [players,setPlayers] = useState<Player[]>([]);
 const [groups,setGroups] = useState<Group[]>([]);
 const [drawReady,setDrawReady] = useState(false);
 const [scores,setScores] = useState<Record<string,{played:number;won:number;lost:number;points:number}>>({});
 const [knockoutRounds,setKnockoutRounds] = useState<Round[]>([]);
 const [loadedTournamentId,setLoadedTournamentId] = useState('');
 const tournament = tournaments.find(t=>t.id===tournamentId);
 const entrants = registrations.filter(r=>r.tournamentId===tournamentId && r.status==='تأیید شده');
 const knockoutOnly=tournament?.progression==='knockout_only';
 const registrationClosed=tournament?.status==='بسته';
 const confirmedPlayers=useMemo(()=>entrants.map(r=>({id:r.id,name:r.name,platoId:r.platoId,wins:0,level:0})),[entrants]);
 useEffect(()=>{ if(!tournamentId && tournaments.length) setTournamentId(tournaments[0].id); },[tournaments,tournamentId]);
 useEffect(()=>{
  try {
   const saved=JSON.parse(localStorage.getItem(STORE_KEY)||'{}'); const data=saved[tournamentId];
   if(data){
    const known=new Map<string,Player>((data.players||[]).map((p:Player)=>[p.id,p] as [string,Player]));
    setPlayers(entrants.map(r=>known.get(r.id)||({id:r.id,name:r.name,platoId:r.platoId,wins:0,level:0})));
    setGroups(data.groups||[]);setDrawReady(!!data.drawReady);setScores(data.scores||{});
    setKnockoutRounds(data.knockoutRounds||[]);
   } else {
    setPlayers(entrants.map(r=>({id:r.id,name:r.name,platoId:r.platoId,wins:0,level:0})));
    setGroups([]);setDrawReady(false);setScores({});setKnockoutRounds([]);
   }
   setLoadedTournamentId(tournamentId);
  } catch {
   setPlayers(entrants.map(r=>({id:r.id,name:r.name,platoId:r.platoId,wins:0,level:0})));
   setGroups([]);setDrawReady(false);setScores({});setKnockoutRounds([]);setLoadedTournamentId(tournamentId);
  }
 },[tournamentId]);
 useEffect(()=>{
  if(!tournamentId||loadedTournamentId!==tournamentId)return;
  try{const all=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');all[tournamentId]={players,groups,drawReady,scores,knockoutRounds};localStorage.setItem(STORE_KEY,JSON.stringify(all));}catch{}
 },[tournamentId,loadedTournamentId,players,groups,drawReady,scores,knockoutRounds]);
 useEffect(()=>{
  if(!knockoutOnly||!registrationClosed||loadedTournamentId!==tournamentId||knockoutRounds.length||confirmedPlayers.length<2)return;
  const rounds=makeKnockout(confirmedPlayers);
  if(rounds.length){setKnockoutRounds(rounds);setDrawReady(true);}
 },[knockoutOnly,registrationClosed,loadedTournamentId,tournamentId,knockoutRounds.length,confirmedPlayers]);
 const sorted = useMemo(()=>[...players].sort((a,b)=>{const key=tournament?.seedingMetric||'wins';const d=key==='level'?a.level-b.level:a.wins-b.wins;return (tournament?.seedingOrder==='asc'?1:-1)*d||a.platoId.localeCompare(b.platoId);}),[players,tournament]);
 const pots = useMemo(()=>{const count=Math.min(4,Math.max(1,sorted.length));return Array.from({length:count},(_,i)=>sorted.slice(Math.floor(i*sorted.length/count),Math.floor((i+1)*sorted.length/count)));},[sorted]);
 function generateDraw(){if(players.length<2)return;const groupCount=Math.ceil(players.length/4);const next:Group[]=Array.from({length:groupCount},(_,i)=>({name:String.fromCharCode(65+i),players:[]}));pots.forEach(pot=>{const shuffledPot=shuffled(pot);shuffledPot.forEach((p,i)=>next[i%groupCount].players.push(p));});setGroups(next);setDrawReady(true);setScores({});}
 function resetDraw(){setGroups([]);setDrawReady(false);setScores({});}
 const groupStandings=(g:Group)=>[...g.players].sort((a,b)=>{const sa=scores[a.id]||{points:0,won:0};const sb=scores[b.id]||{points:0,won:0};return sb.points-sa.points||sb.won-sa.won;});
 if(!tournaments.length)return <section className="live-competition panel"><h2>نمایش زندهٔ ساختار مسابقه</h2><p>ابتدا یک مسابقه در فرم مدیریت بساز.</p></section>;
 const champion=knockoutRounds.length?knockoutRounds[knockoutRounds.length-1].matches[0]?.winnerId:null;
 const finalMatch=knockoutRounds.length?knockoutRounds[knockoutRounds.length-1].matches[0]:null;
 const championPlayer=champion&&finalMatch?(finalMatch.player1?.id===champion?finalMatch.player1:finalMatch.player2):null;
 return <section className="live-competition panel">
  <div className="live-head"><div><span className="live-kicker">LIVE COMPETITION BUILDER</span><h2>نمایش گرافیکی زندهٔ مسابقه</h2><p>ساختار نمایشی متناسب با فرمت انتخاب‌شدهٔ مسابقه</p></div><BarChart3 size={28}/></div>
  <label className="live-select">انتخاب مسابقه<select value={tournamentId} onChange={e=>setTournamentId(e.target.value)}>{tournaments.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
  {tournament&&<div className="live-stats"><div><strong>{entrants.length}</strong><span>بازیکن تأییدشده</span></div><div><strong>{knockoutOnly?'-':pots.length}</strong><span>{knockoutOnly?'بدون سیدبندی':'سبد سیدبندی'}</span></div><div><strong>{knockoutOnly?(knockoutRounds.length||'—'):groups.length}</strong><span>{knockoutOnly?'مراحل حذفی':'گروه قرعه‌کشی'}</span></div><div><strong>{knockoutOnly?(registrationClosed?'بسته':'باز'):(drawReady?'آماده':'—')}</strong><span>{knockoutOnly?'وضعیت ثبت‌نام':'وضعیت قرعه'}</span></div></div>}
  {knockoutOnly ? <>
   <div className="live-section live-disabled-section"><div className="live-section-title"><h3><ListOrdered size={18}/> سیدبندی و رتبه‌بندی</h3><small>برای فرمت فقط حذفی کاربرد ندارد</small></div><div className="live-disabled-content"><p>در مسابقهٔ فقط حذفی، سیدبندی و رتبه‌بندی انجام نمی‌شود. جایگاه بازیکنان با قرعه‌کشی تصادفی تعیین خواهد شد.</p></div></div>
   <div className="live-section live-disabled-section"><div className="live-section-title"><h3><Layers3 size={18}/> سبدهای سیدبندی و گروه‌ها</h3><small>غیرفعال در مسابقهٔ حذفی</small></div><div className="live-disabled-content"><p>این مسابقه مرحلهٔ گروهی ندارد؛ بنابراین سبدها، گروه‌ها و جدول‌های گروهی نمایش داده نمی‌شوند.</p></div></div>
   <div className="live-section"><div className="live-section-title"><h3><Shuffle size={18}/> قرعه‌کشی مسابقهٔ حذفی</h3><small>{!registrationClosed?'پس از پایان ثبت‌نام فعال می‌شود':knockoutRounds.length?'قرعه‌کشی انجام شده':'در انتظار بازیکنان تأییدشده'}</small></div>
    {!registrationClosed?<p className="live-empty">تا زمانی که وضعیت ثبت‌نام مسابقه «بسته» نشود، قرعه‌کشی انجام نمی‌شود.</p>:entrants.length<2?<p className="live-empty">برای انجام قرعه‌کشی حداقل دو بازیکن تأییدشده لازم است. تعداد فعلی: {entrants.length}</p>:knockoutRounds.length?<><div className="knockout-draw-summary"><span><Shuffle size={15}/> قرعه‌کشی تصادفی ثبت شد</span><small>{entrants.length} بازیکن · {knockoutRounds[0]?.matches.length||0} مسابقه در دور اول</small></div><div className="knockout-first-round">{knockoutRounds[0]?.matches.map((m,i)=><div className="knockout-draw-match" key={m.id}><b>مسابقه {i+1}</b><span>{m.player1?.name||'استراحت'}</span><span>{m.player2?.name||'استراحت'}</span>{(!m.player1||!m.player2)&&<small>صعود خودکار بازیکن حاضر</small>}</div>)}</div></>:<p className="live-empty">قرعه‌کشی پس از بسته‌شدن ثبت‌نام به‌صورت خودکار ایجاد می‌شود.</p>}
   </div>
   <div className="live-section"><div className="live-section-title"><h3><Trophy size={18}/> جدول مرحلهٔ حذفی</h3><small>{knockoutRounds.length?'با ثبت برنده، مرحله بعد به‌روز می‌شود':'پس از قرعه‌کشی ساخته می‌شود'}</small></div>
    {knockoutRounds.length?<><div className="knockout-bracket">{knockoutRounds.map((round,ri)=><div className="knockout-bracket-round" key={round.name}><h4>{round.name}</h4>{round.matches.map((m,mi)=><div className="knockout-bracket-match" key={m.id}><div className={m.winnerId===m.player1?.id&&m.winnerId?'knockout-player winner':'knockout-player'}><span>{m.player1?.name||'در انتظار صعود'}</span>{m.player1&&<small>{m.player1.platoId}</small>}</div><div className={m.winnerId===m.player2?.id&&m.winnerId?'knockout-player winner':'knockout-player'}><span>{m.player2?.name||'در انتظار صعود'}</span>{m.player2&&<small>{m.player2.platoId}</small>}</div>{m.player1&&m.player2?<label className="knockout-winner-select">برندهٔ مسابقه<select value={m.winnerId||''} onChange={e=>setKnockoutRounds(old=>updateWinner(old,ri,mi,e.target.value))}><option value="">هنوز ثبت نشده</option><option value={m.player1.id}>{m.player1.name}</option><option value={m.player2.id}>{m.player2.name}</option></select></label>:m.winnerId&&<small className="knockout-bye">صعود خودکار با قرعهٔ استراحت</small>}</div>)}</div>)}</div>{championPlayer&&<div className="knockout-champion"><Crown size={19}/> قهرمان فعلی: <strong>{championPlayer.name}</strong></div>}</>:<p className="live-empty">{registrationClosed?'در انتظار حداقل دو بازیکن تأییدشده برای تولید جدول حذفی.':'جدول مرحلهٔ حذفی پس از پایان ثبت‌نام و انجام قرعه‌کشی نمایش داده می‌شود.'}</p>}
   </div>
  </> : <>
   <div className="live-section"><div className="live-section-title"><h3><ListOrdered size={18}/> سیدبندی و رتبه‌بندی</h3><small>معیار: {metricLabel[tournament?.seedingMetric||'wins']||'تعداد برد'}</small></div>
    {players.length===0?<p className="live-empty">هنوز بازیکن تأییدشده‌ای برای این مسابقه وجود ندارد. ثبت‌نام‌های تأییدشده اینجا نمایش داده می‌شوند.</p>:<div className="seed-table"><div className="seed-row seed-header"><span>رتبه</span><span>بازیکن / Plato ID</span><span>برد</span><span>سطح</span></div>{sorted.map((p,i)=><div className="seed-row" key={p.id}><b>{i+1}</b><span><strong>{p.name}</strong><small>{p.platoId}</small></span><input aria-label={'برد '+p.name} type="number" min="0" value={p.wins} onChange={e=>setPlayers(old=>old.map(x=>x.id===p.id?{...x,wins:Number(e.target.value)}:x))}/><input aria-label={'سطح '+p.name} type="number" min="0" value={p.level} onChange={e=>setPlayers(old=>old.map(x=>x.id===p.id?{...x,level:Number(e.target.value)}:x))}/></div>)}</div>}
   </div>
   <div className="live-section"><div className="live-section-title"><h3><Layers3 size={18}/> سبدهای سیدبندی</h3><small>تقسیم متوازن بر اساس رتبه</small></div><div className="pot-grid">{pots.map((pot,i)=><div className="pot-card" key={i}><h4>سبد {i+1}</h4>{pot.length?pot.map((p,j)=><div className="pot-player" key={p.id}><span>{j+1}</span><b>{p.name}</b><small>{p.platoId}</small></div>):<p>خالی</p>}</div>)}</div></div>
   <div className="live-section"><div className="live-section-title"><h3><Shuffle size={18}/> قرعه‌کشی و گروه‌بندی</h3><small>{drawReady?'قرعه تولید شده':'آمادهٔ قرعه‌کشی'}</small></div><div className="live-actions"><button type="button" className="gold-button" disabled={players.length<2} onClick={generateDraw}><Shuffle size={16}/> اجرای قرعه‌کشی</button><button type="button" className="outline-button" disabled={!drawReady} onClick={resetDraw}><RotateCcw size={15}/> پاک‌کردن قرعه</button></div>{drawReady?<div className="group-grid">{groups.map(g=><div className="group-card" key={g.name}><h4>گروه {g.name}</h4>{g.players.map(p=><div className="group-player" key={p.id}><Users size={14}/><span>{p.name}</span><small>{p.platoId}</small></div>)}</div>)}</div>:<p className="live-empty">پس از تأیید بازیکنان و تکمیل اطلاعات سیدبندی، قرعه‌کشی را اجرا کن.</p>}</div>
   <div className="live-section"><div className="live-section-title"><h3><Trophy size={18}/> جدول گروهی و مسیر حذفی</h3><small>ثبت نتیجه در نسخهٔ بعدی</small></div>{drawReady?<><div className="group-grid">{groups.map(g=><div className="standings-card" key={g.name}><h4>جدول گروه {g.name}</h4><div className="standing-row standing-head"><span>بازیکن</span><span>برد</span><span>امتیاز</span></div>{groupStandings(g).map(p=>{const s=scores[p.id]||{played:0,won:0,lost:0,points:0};return <div className="standing-row" key={p.id}><span>{p.name}</span><input aria-label={'برد گروهی '+p.name} type="number" min="0" value={s.won} onChange={e=>setScores(old=>({...old,[p.id]:{...s,won:Number(e.target.value)}}))}/><input aria-label={'امتیاز گروهی '+p.name} type="number" min="0" value={s.points} onChange={e=>setScores(old=>({...old,[p.id]:{...s,points:Number(e.target.value)}}))}/></div>})}</div>)}</div>{tournament?.progression!=='groups_only'&&<div className="bracket-preview"><h4>نمودار مرحلهٔ حذفی — پیش‌نمایش</h4><div className="bracket-round"><b>مرحلهٔ اول</b>{groups.slice(0,Math.max(1,Math.ceil(groups.length/2))).map((g,i)=><div className="bracket-match" key={g.name}><span>{groupStandings(g)[0]?.name||'صعودکننده گروه '+g.name}</span><span>{groupStandings(groups[i+Math.ceil(groups.length/2)]||g)[0]?.name||'صعودکننده گروه'}</span></div>)}</div><small>جایگاه‌ها نمایشی‌اند؛ با ثبت نتایج واقعی، جدول و مسیر صعود تکمیل می‌شود.</small></div>}</>:<p className="live-empty">پس از قرعه‌کشی، جدول گروه‌ها و پیش‌نمایش نمودار حذفی در این قسمت ساخته می‌شود.</p>}</div>
  </>}
  <p className="live-note">اطلاعات این بخش در حافظهٔ همین مرورگر ذخیره می‌شود و هنوز به دیتابیس Supabase متصل نیست؛ قرعهٔ حذفی پس از بسته‌شدن ثبت‌نام به‌صورت خودکار در همین مرورگر ایجاد و نگهداری می‌شود.</p>
 </section>;
}
