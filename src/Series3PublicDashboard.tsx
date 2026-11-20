import React,{useEffect,useMemo,useState} from 'react';
import {supabase} from './supabase';

type Player={plato_id:string;games_played:number|null;games_won:number|null};
type Group={name:string;players:Player[]};
type Draw={ranking_snapshot:Player[];pots_snapshot:Player[][];groups_snapshot:Group[]};
type Fixture={match_id:string;match_date:string;round_no:number;group_name:string;match_no:number;player_a_plato_id:string;player_b_plato_id:string;result_status:'pending'|'completed'|'double_no_show';score_a:number|null;score_b:number|null};
type Token={id:string;label:string;source:string;group?:string};
type Match={id:string;a:Token;b:Token};
type Bracket={tokens:Token[];round32:Match[];round16:Match[];quarterfinals:Match[];semifinals:Match[];final:Match[]};
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
const stages:[keyof Bracket,string][]=[['round32','دور ۳۲ نفره'],['round16','یک‌هشتم نهایی'],['quarterfinals','یک‌چهارم نهایی'],['semifinals','نیمه‌نهایی'],['final','فینال']];
export default function Series3PublicDashboard(){
 const [draw,setDraw]=useState<Draw|null>(null);
 const [fixtures,setFixtures]=useState<Fixture[]>([]);
 const [bracket,setBracket]=useState<Bracket|null>(null);
 const [tab,setTab]=useState<'overview'|'ranking'|'groups'|'bracket'>('overview');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{let active=true;(async()=>{
  if(!supabase){setError('اتصال به اطلاعات مسابقات در دسترس نیست.');setLoading(false);return;}
  const [d,f,b]=await Promise.all([
   supabase.from('plato_land_series3_public_draw').select('ranking_snapshot,pots_snapshot,groups_snapshot').eq('event_key','series3').maybeSingle(),
   supabase.from('plato_land_series3_public_fixtures').select('match_id,match_date,round_no,group_name,match_no,player_a_plato_id,player_b_plato_id,result_status,score_a,score_b').eq('event_key','series3').order('match_date').order('group_name').order('match_no'),
   supabase.from('plato_land_series3_public_bracket').select('bracket_snapshot,created_at').eq('event_key','series3').maybeSingle()
  ]);
  if(!active)return;
  const failure=d.error||f.error||b.error;
  if(failure){setError('بارگذاری اطلاعات مسابقات ناموفق بود. لطفاً کمی بعد دوباره تلاش کنید.');}
  else{
   setDraw(d.data as Draw|null);setFixtures((f.data||[]) as Fixture[]);
   setBracket((b.data?.bracket_snapshot||null) as Bracket|null);
   if(!d.data||!b.data)setError('اطلاعات قرعه‌کشی هنوز کامل در دسترس نیست.');
  }
  setLoading(false);
 })();return()=>{active=false}},[]);
 const ranking=draw?.ranking_snapshot||[];
 const pots=draw?.pots_snapshot||[];
 const groupDraw=draw?.groups_snapshot||[];
 const completed=fixtures.filter(x=>x.result_status==='completed').length;
 const noShows=fixtures.filter(x=>x.result_status==='double_no_show').length;
 const pending=fixtures.filter(x=>x.result_status==='pending').length;
 const standings=useMemo(()=>groups.map(g=>({group:g,players:standingsFor(g,fixtures)})),[fixtures]);
 const tabs:[typeof tab,string][]=[['overview','خلاصه مسابقات'],['ranking','رتبه‌بندی و سیدها'],['groups','گروه‌ها و نتایج'],['bracket','مسیر قهرمانی']];
 const th:React.CSSProperties={padding:'7px 5px',borderBottom:'1px solid #67532f',whiteSpace:'nowrap',textAlign:'center',fontSize:10,color:'#e6d3a7'};
 const td:React.CSSProperties={padding:'7px 5px',borderBottom:'1px solid #30291d',textAlign:'center',fontSize:11,whiteSpace:'nowrap'};
 return <section dir="rtl" style={panel} aria-label="داشبورد عمومی مسابقات سری سوم">
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
   <div><div style={{fontSize:19,fontWeight:900,color:'#f3dfad'}}>مسیر قهرمانی · سری سوم</div><div style={{...muted,marginTop:3}}>رتبه‌بندی رسمی، گروه‌ها، نتایج و جدول حذفی</div></div>
   <span style={{border:'1px solid #806638',borderRadius:30,padding:'6px 11px',fontSize:11,color:gold}}>۴۸ بازیکن · ۱۲ گروه</span>
  </div>
  <nav aria-label="بخش‌های داشبورد" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:5,marginTop:14}}>
   {tabs.map(([key,label])=><button key={key} type="button" onClick={()=>setTab(key)} style={{minWidth:0,padding:'9px 3px',borderRadius:8,border:'1px solid '+(tab===key?'#e4c77e':'#57472d'),background:tab===key?'linear-gradient(120deg,#a98239,#e4c77e)':'#151515',color:tab===key?'#17130b':'#e8d8b6',fontWeight:800,fontSize:11,cursor:'pointer'}}>{label}</button>)}
  </nav>
  {loading?<p style={muted}>در حال دریافت اطلاعات رسمی مسابقات…</p>:error?<p role="status" style={{color:'#e9c98a',fontSize:12,lineHeight:1.9}}>{error}</p>:<>
   {tab==='overview'&&<div style={{display:'grid',gap:9,marginTop:12}}>
    <div style={card}><strong style={{color:gold}}>مرحله گروهی</strong><p style={muted}>۴۸ بازیکن در ۱۲ گروه چهار‌نفره · ۷۲ بازی برنامه‌ریزی‌شده · هر برد ۳ امتیاز · بازی پنج‌امتیازی</p><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{groups.map(g=><span key={g} style={{border:'1px solid #5c4a2d',borderRadius:7,padding:'4px 8px',fontSize:11,color:'#ead7ac'}}>گروه {g}</span>)}</div></div>
    <div style={card}><strong style={{color:gold}}>مراحل حذفی</strong><div style={{display:'grid',gap:7,marginTop:8}}>{stages.map(([key,label])=><div key={key} style={{display:'flex',justifyContent:'space-between',gap:8,borderBottom:'1px solid #30291d',paddingBottom:6}}><span style={{fontSize:12}}>{label}</span><span style={{...muted,color:gold}}>{bracket?.[key]?.length||0} مسابقه</span></div>)}<div style={{display:'flex',justifyContent:'space-between',gap:8,paddingTop:3}}><span style={{fontSize:12}}>مسابقه رده‌بندی</span><span style={{...muted,color:gold}}>بازنده نیمه‌نهایی ۱ × بازنده نیمه‌نهایی ۲</span></div></div></div>
   </div>}
   {tab==='ranking'&&<div style={{display:'grid',gap:12,marginTop:12}}>
    <div style={card}><strong style={{color:gold}}>رتبه‌بندی ۴۸ بازیکن</strong><p style={muted}>مبنای رتبه‌بندی: درصد برد، سپس تعداد بازی کمتر، برد بیشتر و Plato ID. آمار از تصویر ذخیره‌شده قرعه استخراج شده است.</p><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:420}}><thead><tr>{['رتبه','Plato ID','بازی','برد','درصد برد'].map(x=><th style={th} key={x}>{x}</th>)}</tr></thead><tbody>{ranking.map((p,i)=><tr key={p.plato_id}><td style={td}>{fa(i+1)}</td><td dir="ltr" style={{...td,textAlign:'left',fontWeight:800,color:'#f0d99f'}}>{p.plato_id}</td><td style={td}>{p.games_played==null?'—':fa(p.games_played)}</td><td style={td}>{p.games_won==null?'—':fa(p.games_won)}</td><td style={{...td,color:gold}}>{p.games_played&&p.games_won!==null?(p.games_won/p.games_played*100).toLocaleString('fa-IR',{maximumFractionDigits:2})+'٪':'—'}</td></tr>)}</tbody></table></div></div>
    <div style={card}><strong style={{color:gold}}>چهار سید قرعه‌کشی</strong><div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:9}}>{pots.map((pot,i)=><div key={i} style={{border:'1px solid #514128',borderRadius:9,padding:8}}><strong style={{color:'#e9d29e',fontSize:12}}>سید {fa(i+1)}</strong>{pot.map(p=><div key={p.plato_id} dir="ltr" style={{fontSize:11,textAlign:'left',padding:'5px 2px',borderBottom:'1px solid #2d281e'}}>{p.plato_id}</div>)}</div>)}</div></div>
   </div>}
   {tab==='groups'&&<div style={{display:'grid',gap:9,marginTop:12}}>
    <p style={muted}>جدول‌ها فقط با نتایج تأییدشده به‌روزرسانی می‌شوند. ترتیب: امتیاز، تفاضل ست، ست برده‌شده؛ در تساوی کامل رتبه مشترک حفظ می‌شود.</p>
    {standings.map(({group,players})=><details key={group} style={card}><summary style={{cursor:'pointer',color:gold,fontWeight:900}}>گروه {group} · {fa(groupDraw.find(x=>x.name===group)?.players.length||4)} بازیکن</summary><div style={{overflowX:'auto',marginTop:8}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:430}}><thead><tr>{['Plato ID','بازی','برد','باخت','امتیاز','تفاضل ست'].map(x=><th style={th} key={x}>{x}</th>)}</tr></thead><tbody>{players.map((p,i)=><tr key={p.plato_id}><td dir="ltr" style={{...td,textAlign:'left',color:'#f0d99f'}}>{i+1}. {p.plato_id}</td>{[p.played,p.wins,p.losses,p.points,p.diff].map((v,j)=><td style={td} key={j}>{fa(v)}</td>)}</tr>)}</tbody></table></div><div style={{display:'grid',gap:6,marginTop:10}}>{fixtures.filter(x=>x.group_name===group).sort((a,b)=>a.round_no-b.round_no||a.match_no-b.match_no).map(m=><div key={m.match_id} style={{padding:8,borderRadius:8,background:'#171717',border:'1px solid #30291d'}}><div style={{...muted,display:'flex',justifyContent:'space-between',gap:6,marginBottom:6}}><span>روز {fa(m.round_no)} · بازی {fa(m.match_no)}</span><span>{new Date(m.match_date+'T12:00:00').toLocaleDateString('fa-IR')}</span></div><div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto minmax(0,1fr)',gap:5,alignItems:'center'}}><span dir="ltr" style={{fontSize:11,overflowWrap:'anywhere',textAlign:'center'}}>{m.player_a_plato_id}</span><strong style={{fontSize:11,color:gold}}>{m.result_status==='completed'?fa(m.score_a??0)+' : '+fa(m.score_b??0):m.result_status==='double_no_show'?'عدم حضور دوطرفه':'VS'}</strong><span dir="ltr" style={{fontSize:11,overflowWrap:'anywhere',textAlign:'center'}}>{m.player_b_plato_id}</span></div></div>)}</div></details>)}
   </div>}
   {tab==='bracket'&&<div style={{display:'grid',gap:10,marginTop:12}}>
    <p style={muted}>قرعه حذفی ذخیره‌شده بدون تغییر نمایش داده می‌شود. جایگاه‌های صعودکنندگان سوم برتر تا پایان گروه‌ها به‌صورت جایگاه موقت باقی می‌ماند.</p>
    {stages.map(([key,label])=><section key={key} style={card}><strong style={{color:gold}}>{label}</strong><div style={{display:'grid',gap:7,marginTop:8}}>{(bracket?.[key]||[]).map((m,i)=><div key={m.id} style={{border:'1px solid #3d3424',borderRadius:8,padding:8,background:'#151515'}}><div style={{...muted,marginBottom:5}}>{fa(i+1)} · {m.id}</div><div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:6,alignItems:'center'}}><span style={{fontSize:11,textAlign:'center'}}>{m.a.label}</span><b style={{color:gold,fontSize:10}}>VS</b><span style={{fontSize:11,textAlign:'center'}}>{m.b.label}</span></div></div>)}</div></section>)}
    <section style={{...card,borderColor:'#b18b45',background:'linear-gradient(130deg,#2a2114,#141416)'}}><strong style={{color:'#f3dfad'}}>مسابقه رده‌بندی · تعیین مقام سوم و چهارم</strong><div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:6,alignItems:'center',marginTop:12}}><span style={{textAlign:'center',fontSize:12}}>بازنده نیمه‌نهایی ۱</span><b style={{color:gold}}>VS</b><span style={{textAlign:'center',fontSize:12}}>بازنده نیمه‌نهایی ۲</span></div><p style={muted}>این مسابقه در کنار فینال برگزار می‌شود. نام بازیکنان و نتیجه پس از مشخص‌شدن دو بازنده نیمه‌نهایی اعلام خواهد شد.</p></section>
   </div>}
  </>}
 </section>;
}
