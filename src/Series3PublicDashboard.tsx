import React,{useEffect,useMemo,useRef,useState} from 'react';
import {supabase} from './supabase';
import PublicTournamentArchive, { podiumFromMatches, type ArchiveMatch } from './PublicTournamentArchive';
import {resolveLockedGroupPlacements,resolveSeries3BracketSlots} from './series3BracketProgression';

type Player={plato_id:string;games_played:number|null;games_won:number|null};
type Group={name:string;players:Player[]};
type Draw={ranking_snapshot:Player[];pots_snapshot:Player[][];groups_snapshot:Group[]};
type Fixture={match_id:string;updated_at:string;match_date:string;round_no:number;group_name:string;match_no:number;player_a_plato_id:string;player_b_plato_id:string;result_status:'pending'|'completed'|'double_no_show';score_a:number|null;score_b:number|null};
type Token={id:string;label:string;source:'first'|'second'|'third'|'winner'|'loser';group?:string};
type Match={id:string;a:Token;b:Token};
type Bracket={tokens:Token[];round32:Match[];round16:Match[];quarterfinals:Match[];semifinals:Match[];final:Match[];thirdPlace?:Match[]};
type KnockoutResult={match_id:string;stage_key:keyof Bracket;updated_at:string;player_a_plato_id:string;player_b_plato_id:string;score_a:number|null;score_b:number|null;result_status:'pending'|'completed'};
type Standing={plato_id:string;played:number;wins:number;losses:number;points:number;for:number;against:number;diff:number};
const fa=(n:number)=>n.toLocaleString('fa-IR');
const groups='ABCDEFGHIJKL'.split('');
const panel:React.CSSProperties={marginTop:18,padding:14,border:'1px solid #8c6a34',borderRadius:15,background:'linear-gradient(145deg,rgba(36,29,18,.97),rgba(15,16,18,.98))',color:'#f4ead2'};
const card:React.CSSProperties={border:'1px solid #59472a',borderRadius:11,padding:11,background:'rgba(12,13,15,.86)',minWidth:0};
const muted:React.CSSProperties={color:'#bfb39b',fontSize:11,lineHeight:1.8};
const gold='#e4c77e';
function standingsFor(group:string,fixtures:Fixture[]):Standing[]{
 const map=new Map<string,Standing>();
 const get=(id:string)=>{if(!map.has(id))map.set(id,{plato_id:id,played:0,wins:0,losses:0,points:0,for:0,against:0,diff:0});return map.get(id)!};
 fixtures.filter(x=>x.group_name===group).forEach(x=>{
  const a=get(x.player_a_plato_id),b=get(x.player_b_plato_id);
  if(x.result_status==='completed'||x.result_status==='double_no_show'){a.played++;b.played++;}
  if(x.result_status==='completed'&&x.score_a!==null&&x.score_b!==null){
   a.for+=x.score_a;a.against+=x.score_b;b.for+=x.score_b;b.against+=x.score_a;
   if(x.score_a>x.score_b){a.wins++;a.points+=3;b.losses++;}else{b.wins++;b.points+=3;a.losses++;}
  }
 });
 return [...map.values()].map(x=>({...x,diff:x.for-x.against})).sort((a,b)=>b.points-a.points||b.diff-a.diff||b.for-a.for||a.plato_id.localeCompare(b.plato_id,'en'));
}
const stages:[keyof Bracket,string][]=[['round32','یک‌شانزدهم نهایی'],['round16','یک‌هشتم نهایی'],['quarterfinals','یک‌چهارم نهایی'],['semifinals','نیمه‌نهایی'],['thirdPlace','رده‌بندی (مقام سوم و چهارم)'],['final','فینال']];
// Approved Series 3 quarterfinal slot, from the official Series 3 schedule snapshot.
const quarterfinalStart = new Date('2026-11-28T21:00:00+03:30');
const quarterfinalDate = new Intl.DateTimeFormat('fa-IR', {
 weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Tehran',
}).format(quarterfinalStart);
const quarterfinalTehranTime = new Intl.DateTimeFormat('fa-IR', {
 hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Tehran',
}).format(quarterfinalStart);

function recentResults(fixtures: Fixture[], knockoutResults: KnockoutResult[]) {
 const matches = [
  ...fixtures.map(match => ({ ...match, key: 'group:' + match.match_id, label: 'گروه ' + match.group_name })),
  ...knockoutResults.map(match => ({
   ...match,
   key: 'knockout:' + match.match_id,
   label: stages.find(([key]) => key === match.stage_key)?.[1] ?? 'مرحله حذفی',
  })),
 ];
 return matches
  .filter(match => match.result_status === 'completed' && match.score_a !== null && match.score_b !== null
   && Number.isFinite(Date.parse(match.updated_at)))
  .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at) || a.key.localeCompare(b.key))
  .slice(0, 5);
}

export default function Series3PublicDashboard({ archived = false }: { archived?: boolean }){
 const [draw,setDraw]=useState<Draw|null>(null);
 const [fixtures,setFixtures]=useState<Fixture[]>([]);
 const [bracket,setBracket]=useState<Bracket|null>(null);
 const [knockoutResults,setKnockoutResults]=useState<KnockoutResult[]>([]);
 const [tab,setTab]=useState<'overview'|'ranking'|'groups'|'bracket'>('overview');
 const sectionButtons = useRef<Partial<Record<typeof tab, HTMLButtonElement>>>({});
 const [loading,setLoading]=useState(true);
 const [refreshTick,setRefreshTick]=useState(0);
 const [error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{
  if(!supabase){setError('اتصال به اطلاعات مسابقات در دسترس نیست.');setLoading(false);return;}
  const [d,f,b,k]=await Promise.all([
   supabase.from('plato_land_series3_public_draw').select('ranking_snapshot,pots_snapshot,groups_snapshot').eq('event_key','series3').maybeSingle(),
   supabase.from('plato_land_series3_public_fixtures').select('match_id,match_date,round_no,group_name,match_no,player_a_plato_id,player_b_plato_id,result_status,score_a,score_b,updated_at').eq('event_key','series3').order('match_date').order('group_name').order('match_no'),
   supabase.from('plato_land_series3_public_bracket').select('bracket_snapshot,created_at').eq('event_key','series3').maybeSingle(),
   supabase.from('plato_land_series3_public_knockout_results').select('match_id,stage_key,player_a_plato_id,player_b_plato_id,score_a,score_b,result_status,updated_at').eq('event_key','series3').order('stage_key').order('match_no')
  ]);
  if(!active)return;
  const failure=d.error||f.error||b.error||(k.error&&k.error.code!=='42P01'?k.error:null);
  if(failure){setError('بارگذاری اطلاعات مسابقات ناموفق بود. لطفاً کمی بعد دوباره تلاش کنید.');}
  else{
   setDraw(d.data as Draw|null);setFixtures((f.data||[]) as Fixture[]);
   setBracket((b.data?.bracket_snapshot||null) as Bracket|null);
   setKnockoutResults((k.data||[]) as KnockoutResult[]);
   setError(!d.data||!b.data ? 'اطلاعات قرعه‌کشی هنوز کامل در دسترس نیست.' : '');
  }
  setLoading(false);
 })();return()=>{active=false}},[refreshTick]);
 useEffect(()=>{
  if(!supabase)return;
  const channel=supabase.channel('series3-public-bracket-live')
   .on('postgres_changes',{event:'*',schema:'public',table:'plato_land_series3_public_fixtures'},()=>setRefreshTick(value=>value+1))
   .on('postgres_changes',{event:'*',schema:'public',table:'plato_land_series3_public_knockout_results'},()=>setRefreshTick(value=>value+1))
   .subscribe();
  return()=>{void supabase.removeChannel(channel)};
 },[]);
 const recent = useMemo(() => archived ? [] : recentResults(fixtures, knockoutResults), [archived, fixtures, knockoutResults]);
 function openResults(nextTab: 'groups' | 'bracket') {
  setTab(nextTab);
  sectionButtons.current[nextTab]?.focus();
 }
 const ranking=draw?.ranking_snapshot||[];
 const pots=draw?.pots_snapshot||[];
 const groupDraw=draw?.groups_snapshot||[];
 const completed=fixtures.filter(x=>x.result_status==='completed').length;
 const noShows=fixtures.filter(x=>x.result_status==='double_no_show').length;
 const pending=fixtures.filter(x=>x.result_status==='pending').length;
 const standings=useMemo(()=>groups.map(g=>({group:g,players:standingsFor(g,fixtures)})),[fixtures]);
 const lockedPlacements=useMemo(()=>resolveLockedGroupPlacements(fixtures.map(row=>({
  match_id:row.match_id,group_name:row.group_name,
  player_a_registration_id:row.player_a_plato_id,player_a_plato_id:row.player_a_plato_id,
  player_b_registration_id:row.player_b_plato_id,player_b_plato_id:row.player_b_plato_id,
  result_status:row.result_status,score_a:row.score_a,score_b:row.score_b,
 }))),[fixtures]);
 const thirdQualifiers=useMemo(()=>bracket?.tokens.filter(token=>token.source==='third'&&Boolean(token.group)&&!token.id.startsWith('3-BEST-'))||[],[bracket]);
 const resolvedBracketSlots=useMemo(()=>bracket?resolveSeries3BracketSlots(bracket,lockedPlacements,thirdQualifiers as any,knockoutResults):{},[bracket,lockedPlacements,thirdQualifiers,knockoutResults]);
 const tabs:[typeof tab,string][]=[['overview','خلاصه مسابقات'],['ranking','رتبه‌بندی و سیدها'],['groups','گروه‌ها و نتایج'],['bracket','مسیر قهرمانی']];
 const upcomingQuarterfinals = (bracket?.quarterfinals ?? []).flatMap(match => {
  const slots = resolvedBracketSlots[match.id];
  if (!slots?.a.resolved || !slots.b.resolved
   || knockoutResults.some(result => result.match_id === match.id && result.result_status === 'completed')) return [];
  return [{ id: match.id, a: slots.a.token.label, b: slots.b.token.label }];
 });
 const quarterfinalsUpcoming = Date.now() < quarterfinalStart.getTime() && upcomingQuarterfinals.length > 0;
 const th:React.CSSProperties={padding:'7px 5px',borderBottom:'1px solid #67532f',whiteSpace:'nowrap',textAlign:'center',fontSize:10,color:'#e6d3a7'};
 const td:React.CSSProperties={padding:'7px 5px',borderBottom:'1px solid #30291d',textAlign:'center',fontSize:11,whiteSpace:'nowrap'};
 const dashboard = <section dir="rtl" style={panel} aria-label="داشبورد عمومی مسابقات سری سوم">
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
   <div><div style={{fontSize:19,fontWeight:900,color:'#f3dfad'}}>{archived ? 'آرشیو مسابقات · سری سوم' : 'مسیر قهرمانی · سری سوم'}</div><div style={{...muted,marginTop:3}}>رتبه‌بندی رسمی، گروه‌ها، نتایج و جدول حذفی</div></div>
   <span style={{border:'1px solid #806638',borderRadius:30,padding:'6px 11px',fontSize:11,color:gold}}>۴۸ بازیکن · ۱۲ گروه</span>
  </div>
  <nav aria-label="بخش‌های داشبورد" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:5,marginTop:14}}>
   {tabs.map(([key,label])=><button key={key} ref={node => { if (node) sectionButtons.current[key] = node; else delete sectionButtons.current[key]; }} type="button" aria-pressed={tab === key} onClick={()=>setTab(key)} style={{minWidth:0,padding:'9px 3px',borderRadius:8,border:'1px solid '+(tab===key?'#e4c77e':'#57472d'),background:tab===key?'linear-gradient(120deg,#a98239,#e4c77e)':'#151515',color:tab===key?'#17130b':'#e8d8b6',fontWeight:800,fontSize:11,cursor:'pointer'}}>{label}</button>)}
  </nav>
  {loading?<p style={muted}>در حال دریافت اطلاعات رسمی مسابقات…</p>:error?<p role="status" style={{color:'#e9c98a',fontSize:12,lineHeight:1.9}}>{error}</p>:<>
   {tab==='overview'&&<div style={{display:'grid',gap:9,marginTop:12}}>
    {!archived && <>
     <section aria-labelledby="series3-recent-results" style={card}>
      <h2 id="series3-recent-results" style={{ margin: 0, fontSize: 16, color: gold }}>آخرین نتایج ثبت‌شده</h2>
      {recent.length === 0 ? <p style={muted}>هنوز نتیجه‌ای برای نمایش ثبت نشده است.</p> :
       <ul style={{ listStyle: 'none', display: 'grid', gap: 8, margin: '12px 0', padding: 0 }}>
        {recent.map(match => <li key={match.key} style={{ border: '1px solid #493c28', borderRadius: 8, padding: 8 }}>
         <div style={{ ...muted, marginBottom: 5 }}>{match.label}</div>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {[[match.player_a_plato_id, match.score_a], [match.player_b_plato_id, match.score_b]].map(([id, score]) =>
           <div key={id} style={{ display: 'grid', gap: 4, textAlign: 'center', alignContent: 'start' }}>
            <bdi dir="ltr" style={{ overflowWrap: 'anywhere', fontSize: 13 }}>{id}</bdi>
            <strong style={{ color: gold }}>{typeof score === 'number' ? fa(score) : '—'}</strong>
           </div>
          )}
         </div>
        </li>)}
       </ul>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
       <button type="button" onClick={() => openResults('groups')} style={{ ...card, minHeight: 44, color: gold, cursor: 'pointer' }}>
        همهٔ نتایج گروهی
       </button>
       <button type="button" onClick={() => openResults('bracket')} style={{ ...card, minHeight: 44, color: gold, cursor: 'pointer' }}>
        همهٔ نتایج حذفی
       </button>
      </div>
     </section>
     <section aria-labelledby="series3-upcoming-matches" style={card}>
      <h2 id="series3-upcoming-matches" style={{ margin: 0, fontSize: 16, color: gold }}>بازی‌های پیش‌رو</h2>
      {quarterfinalsUpcoming ? <>
       <p style={{ ...muted, fontSize: 13, marginBlock: '8px 12px' }}>
        یک‌چهارم نهایی · {quarterfinalDate} · ساعت <bdi>{quarterfinalTehranTime}</bdi> به وقت تهران
       </p>
       <ul style={{ listStyle: 'none', display: 'grid', gap: 8, margin: 0, padding: 0 }}>
        {upcomingQuarterfinals.map(match => <li key={match.id} style={{
         display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
         alignItems: 'center', textAlign: 'center', gap: 8, padding: 8,
         border: '1px solid #493c28', borderRadius: 8, fontSize: 13,
        }}>
         <bdi dir="ltr" style={{ overflowWrap: 'anywhere' }}>{match.a}</bdi>
         <span style={{ color: gold }}>مقابل</span>
         <bdi dir="ltr" style={{ overflowWrap: 'anywhere' }}>{match.b}</bdi>
        </li>)}
       </ul>
      </> : <p style={{ ...muted, marginBottom: 0 }}>بازی زمان‌بندی‌شدهٔ بعدی برای نمایش وجود ندارد.</p>}
     </section>
    </>}
    <div style={card}><strong style={{color:gold}}>مرحله گروهی</strong><p style={muted}>۴۸ بازیکن در ۱۲ گروه چهار‌نفره · ۷۲ بازی برنامه‌ریزی‌شده · هر برد ۳ امتیاز · بازی پنج‌امتیازی</p><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{groups.map(g=><span key={g} style={{border:'1px solid #5c4a2d',borderRadius:7,padding:'4px 8px',fontSize:11,color:'#ead7ac'}}>گروه {g}</span>)}</div></div>
    <div style={card}><strong style={{color:gold}}>مراحل حذفی</strong><div style={{display:'grid',gap:7,marginTop:8}}>{stages.map(([key,label])=><div key={key} style={{display:'flex',justifyContent:'space-between',gap:8,borderBottom:'1px solid #30291d',paddingBottom:6}}><span style={{fontSize:12}}>{label}</span><span style={{...muted,color:gold}}>{bracket?.[key]?.length||0} مسابقه</span></div>)}</div></div>
   </div>}
   {tab==='ranking'&&<div style={{display:'grid',gap:12,marginTop:12}}>
    <div style={card}><strong style={{color:gold}}>رتبه‌بندی ۴۸ بازیکن</strong><p style={muted}>مبنای رتبه‌بندی: درصد برد، سپس تعداد بازی کمتر، برد بیشتر و Plato ID. آمار از تصویر ذخیره‌شده قرعه استخراج شده است.</p><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:420}}><thead><tr>{['رتبه','Plato ID','بازی','برد','درصد برد'].map(x=><th style={th} key={x}>{x}</th>)}</tr></thead><tbody>{ranking.map((p,i)=><tr key={p.plato_id}><td style={td}>{fa(i+1)}</td><td dir="ltr" style={{...td,textAlign:'left',fontWeight:800,color:'#f0d99f'}}>{p.plato_id}</td><td style={td}>{p.games_played==null?'—':fa(p.games_played)}</td><td style={td}>{p.games_won==null?'—':fa(p.games_won)}</td><td style={{...td,color:gold}}>{p.games_played&&p.games_won!==null?(p.games_won/p.games_played*100).toLocaleString('fa-IR',{maximumFractionDigits:2})+'٪':'—'}</td></tr>)}</tbody></table></div></div>
    <div style={card}><strong style={{color:gold}}>چهار سید قرعه‌کشی</strong><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:9}}>{pots.map((pot,i)=><div key={i} style={{border:'1px solid #514128',borderRadius:9,padding:8}}><strong style={{color:'#e9d29e',fontSize:12}}>سید {fa(i+1)}</strong>{pot.map(p=><div key={p.plato_id} dir="ltr" style={{fontSize:11,textAlign:'left',padding:'5px 2px',borderBottom:'1px solid #2d281e'}}>{p.plato_id}</div>)}</div>)}</div></div>
    <div style={card}><strong style={{color:gold}}>گروه‌بندی رسمی · گروه‌های A تا L</strong><p style={muted}>ترکیب گروه‌ها مطابق Snapshot رسمی قرعه‌کشی؛ هر گروه شامل چهار بازیکن است.</p><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:9}}>{[...groupDraw].sort((a,b)=>a.name.localeCompare(b.name,'en')).map(g=><div key={g.name} style={{border:'1px solid #514128',borderRadius:9,padding:8,minWidth:0}}><strong style={{color:'#e9d29e',fontSize:13}}>گروه {g.name}</strong>{g.players.map((p,i)=><div key={p.plato_id} dir="ltr" style={{fontSize:11,textAlign:'left',padding:'6px 2px',borderBottom:i===g.players.length-1?'none':'1px solid #2d281e',overflowWrap:'anywhere'}}>{p.plato_id}</div>)}</div>)}</div></div>
   </div>}
   {tab==='groups'&&<div style={{display:'grid',gap:9,marginTop:12}}>
    <p style={muted}>جدول‌ها فقط با نتایج تأییدشده به‌روزرسانی می‌شوند. ترتیب: امتیاز، تفاضل ست، ست برده‌شده؛ در تساوی کامل رتبه مشترک حفظ می‌شود.</p>
    {standings.map(({group,players})=><details key={group} style={card}><summary style={{cursor:'pointer',color:gold,fontWeight:900}}>گروه {group}</summary><div style={{overflowX:'auto',marginTop:8}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:430}}><thead><tr>{['ردیف','Plato ID','بازی','برد','باخت','ست برده','ست باخته','امتیاز','تفاضل ست'].map(x=><th style={th} key={x}>{x}</th>)}</tr></thead><tbody>{players.map((p,i)=><tr key={p.plato_id}><td style={td}>{fa(i+1)}</td><td dir="ltr" style={{...td,textAlign:'left',color:'#f0d99f'}}>{p.plato_id}</td>{[p.played,p.wins,p.losses,p.for,p.against,p.points,p.diff].map((v,j)=><td style={td} key={j}>{fa(v)}</td>)}</tr>)}</tbody></table></div><div style={{display:'grid',gap:6,marginTop:10}}>{fixtures.filter(x=>x.group_name===group).sort((a,b)=>a.round_no-b.round_no||a.match_no-b.match_no).map(m=><div key={m.match_id} style={{padding:8,borderRadius:8,background:'#171717',border:'1px solid #30291d'}}><div style={{...muted,display:'flex',justifyContent:'space-between',gap:6,marginBottom:6}}><span>روز {fa(m.round_no)} · بازی {fa(m.match_no)}</span><span>{new Date(m.match_date+'T12:00:00').toLocaleDateString('fa-IR')}</span></div><div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto minmax(0,1fr)',gap:5,alignItems:'center'}}><span dir="ltr" style={{fontSize:11,overflowWrap:'anywhere',textAlign:'center'}}>{m.player_a_plato_id}</span><strong style={{fontSize:11,color:gold}}>{m.result_status==='completed'?fa(m.score_a??0)+' : '+fa(m.score_b??0):m.result_status==='double_no_show'?'عدم حضور دوطرفه':'VS'}</strong><span dir="ltr" style={{fontSize:11,overflowWrap:'anywhere',textAlign:'center'}}>{m.player_b_plato_id}</span></div></div>)}</div></details>)}
   </div>}
   {tab==='bracket'&&<div style={{display:'grid',gap:10,marginTop:12}}>
    <p style={muted}>قرعه حذفی ذخیره‌شده بدون تغییر نمایش داده می‌شود. جایگاه‌های صعودکنندگان سوم برتر تا پایان گروه‌ها به‌صورت جایگاه موقت باقی می‌ماند.</p>
    {stages.map(([key,label])=><section key={key} style={card}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}><strong style={{color:gold}}>{label}</strong><span style={{...muted,color:gold}}>{fa(bracket?.[key]?.length||0)} مسابقه</span></div><div style={{overflowX:'auto',marginTop:9}}><table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}><thead><tr><th style={th}>بازی</th><th style={th}>بازیکن اول</th><th style={th}>نتیجه</th><th style={th}>بازیکن دوم</th></tr></thead><tbody>{(bracket?.[key]||[]).map((m,i)=>{const resolved=resolvedBracketSlots[m.id];const result=knockoutResults.find(row=>row.match_id===m.id&&row.result_status==='completed');const slot=(token:Token,side:'a'|'b')=>{const item=resolved?.[side];const title=item?.resolved?item.token.label:token.label;const direction=(item?.resolved?item.token:token).source==='winner'||(item?.resolved?item.token:token).source==='loser'?'ltr':'rtl';return <div style={{display:'grid',gap:3,justifyItems:'center'}}><strong dir={direction} style={{fontSize:11,overflowWrap:'anywhere',unicodeBidi:'plaintext',color:item?.resolved?'#f4dfad':'#e8d8b6'}}>{title}</strong></div>};return <tr key={m.id}><td style={{...td,fontWeight:800,color:gold}}>{fa(i+1)}</td><td style={{...td,whiteSpace:'normal'}}>{slot(m.a,'a')}</td><td style={{...td,color:gold,fontWeight:900}}>{result&&result.score_a!==null&&result.score_b!==null?fa(result.score_a)+' : '+fa(result.score_b):'—'}</td><td style={{...td,whiteSpace:'normal'}}>{slot(m.b,'b')}</td></tr>})}</tbody></table></div></section>)}
   </div>}
  </>}
 </section>;
 if(!archived) return dashboard;
 const stageKeys = {
  round32:'round32', round16:'round16', quarterfinals:'quarter',
  semifinals:'semi', thirdPlace:'third_place', final:'final',
 } as const;
 const archiveMatches: ArchiveMatch[] = [
  ...fixtures.map(row=>({
   stage:'group', group:row.group_name, a:row.player_a_plato_id, b:row.player_b_plato_id,
   score_a:row.score_a, score_b:row.score_b, status:row.result_status,
  })),
  ...Object.entries(stageKeys).flatMap(([key,stage])=>(bracket?.[key as keyof typeof stageKeys] ?? []).map(match=>{
   const result=knockoutResults.find(row=>row.match_id===match.id && row.result_status==='completed');
   const slots=resolvedBracketSlots[match.id];
   return {
    stage, group:null,
    a:result?.player_a_plato_id ?? slots?.a?.token.label ?? match.a.label,
    b:result?.player_b_plato_id ?? slots?.b?.token.label ?? match.b.label,
    score_a:result?.score_a ?? null, score_b:result?.score_b ?? null,
    status:result ? 'completed' as const : 'pending' as const,
   };
  })),
 ];
 return <>
  <PublicTournamentArchive title="آرشیو سری سوم تخته‌نرد" prefix="series3" showHeader={false}
   matches={loading ? null : archiveMatches} failed={Boolean(error && !archiveMatches.length)}
   podium={podiumFromMatches(archiveMatches)} />
  <details>
   <summary className="tarchive-history-summary">رتبه‌بندی، سیدبندی و سوابق سری سوم</summary>
   {dashboard}
  </details>
 </>;

}
