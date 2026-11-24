import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';
import { buildSeries4Knockout, selectSeries4Qualifiers } from './series4Knockout';
type ResultStatus = 'pending' | 'completed' | 'double_no_show';
type MatchResult = {
  match_id: string; match_date: string; round_no: number; group_name: string; match_no: number;
  player_a_registration_id: string; player_a_plato_id: string;
  player_b_registration_id: string; player_b_plato_id: string;
  result_status: ResultStatus; score_a: number | null; score_b: number | null;
  version: number; updated_at: string;
};
type Draft = { status: ResultStatus; scoreA: string; scoreB: string };
type Standing = {
  plato_id: string; played: number; wins: number; losses: number; points: number;
  setsFor: number; setsAgainst: number; diff: number; rank?: number;
};
const fa = (n:number) => n.toLocaleString('fa-IR');
const panel: React.CSSProperties = { marginTop:14,padding:14,border:'1px solid #8c6a34',borderRadius:13,background:'linear-gradient(145deg,#211b12,#111214)',color:'#f2ead8' };
const card: React.CSSProperties = { border:'1px solid #59472a',borderRadius:10,padding:11,background:'#101112',minWidth:0 };
const muted: React.CSSProperties = { color:'#c9c0b0',fontSize:12,lineHeight:1.8 };
const input: React.CSSProperties = { width:'100%',minWidth:0,boxSizing:'border-box',background:'#0c0d0f',border:'1px solid #6a5a37',borderRadius:8,color:'#fff',padding:'9px 8px' };
const primary: React.CSSProperties = { background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:8,color:'#17130b',padding:'9px 12px',fontWeight:800,cursor:'pointer' };
const secondary: React.CSSProperties = { ...primary,background:'#211b12',color:'#e4c77e',border:'1px solid #806638' };
const emptyDraft = (row:MatchResult):Draft => ({
  status: row.result_status,
  scoreA: row.score_a === null ? '' : String(row.score_a),
  scoreB: row.score_b === null ? '' : String(row.score_b),
});
function standingsFor(rows:MatchResult[], group:string):Standing[] {
  const map = new Map<string,Standing>();
  const ensure = (id:string) => {
    if (!map.has(id)) map.set(id,{plato_id:id,played:0,wins:0,losses:0,points:0,setsFor:0,setsAgainst:0,diff:0});
    return map.get(id)!;
  };
  rows.filter(r=>r.group_name===group).forEach(r=>{
    const a=ensure(r.player_a_plato_id), b=ensure(r.player_b_plato_id);
    if (r.result_status==='completed' || r.result_status==='double_no_show') { a.played++; b.played++; }
    if (r.result_status==='completed' && r.score_a!==null && r.score_b!==null) {
      a.setsFor+=r.score_a; a.setsAgainst+=r.score_b;
      b.setsFor+=r.score_b; b.setsAgainst+=r.score_a;
      if (r.score_a>r.score_b) { a.wins++;a.points+=3;b.losses++; }
      else { b.wins++;b.points+=3;a.losses++; }
    }
  });
  const ranked = [...map.values()].map(x=>({...x,diff:x.setsFor-x.setsAgainst}))
    .sort((a,b)=>b.points-a.points || b.diff-a.diff || b.setsFor-a.setsFor);
  const groupResults = rows.filter(row=>row.group_name===group);
  const standings:Standing[] = [];
  for (let start=0; start<ranked.length;) {
    let end=start+1;
    while(end<ranked.length && tied(ranked[start],ranked[end])) end++;
    const tiedPlayers=ranked.slice(start,end);
    if(tiedPlayers.length===2) {
      const [a,b]=tiedPlayers;
      const direct=groupResults.find(row=>row.result_status==='completed' &&
        ((row.player_a_plato_id===a.plato_id && row.player_b_plato_id===b.plato_id) ||
         (row.player_b_plato_id===a.plato_id && row.player_a_plato_id===b.plato_id)));
      if(direct && direct.score_a!==null && direct.score_b!==null) {
        const winner=direct.score_a>direct.score_b ? direct.player_a_plato_id : direct.player_b_plato_id;
        if(winner===b.plato_id) tiedPlayers.reverse();
        standings.push({...tiedPlayers[0],rank:start+1},{...tiedPlayers[1],rank:start+2});
        start=end;
        continue;
      }
    }
    standings.push(...tiedPlayers.map(player=>({...player,rank:start+1})));
    start=end;
  }
  return standings;
}
function tied(a:Standing,b:Standing) {
  return a.points===b.points && a.diff===b.diff && a.setsFor===b.setsFor;
}
export default function Series4GroupResultsManager() {
  const [rows,setRows]=useState<MatchResult[]>([]);
  const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [day,setDay]=useState('');
  const [group,setGroup]=useState('ALL');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const lockedRef=useRef(false);
  const load=useCallback(async()=>{
    if(!supabase){setError('اتصال به دیتابیس اصلی در دسترس نیست.');setLoading(false);return;}
    setLoading(true);setError('');
    const {data,error:readError}=await supabase.from('plato_land_series4_group_match_results')
      .select('match_id,match_date,round_no,group_name,match_no,player_a_registration_id,player_a_plato_id,player_b_registration_id,player_b_plato_id,result_status,score_a,score_b,version,updated_at')
      .order('match_date').order('group_name').order('match_no');
    if(readError){setError('دریافت نتایج سری چهارم ناموفق بود: '+readError.message);setLoading(false);return;}
    const next=(data||[]) as MatchResult[];
    setRows(next);
    setKnockout(previous=>lockedRef.current?previous:null);
    setDay(current=>current || next[0]?.match_date || 'ALL');
    setDrafts(Object.fromEntries(next.map(r=>[r.match_id,emptyDraft(r)])));
    setLoading(false);
  },[]);
  useEffect(()=>{void load();},[load]);
  const [dates,setDates]=useState(['','','']);
  const [creating,setCreating]=useState(false);
  async function createSchedule() {
    if(!supabase || creating || rows.length || !dates.every(Boolean))return;
    setCreating(true);setError('');setMessage('');
    try {
      const {data,error}=await supabase.rpc('series4_owner_init_group_results',{p_dates:dates});
      if(error)throw error;
      await load();
      setMessage(fa(Number(data))+' بازی گروهی ذخیره شد.');
    } catch(error) {
      setError((error as {message?:string}).message || 'ذخیره برنامه ناموفق بود.');
    } finally {setCreating(false);}
  }
  const groups=useMemo(()=>[...new Set(rows.map(row=>row.group_name))].sort(),[rows]);
  const days=useMemo(()=>[...new Set(rows.map(r=>r.match_date))].sort(),[rows]);
  const visible=useMemo(()=>rows.filter(r=>(day==='ALL'||r.match_date===day)&&(group==='ALL'||r.group_name===group)),[rows,day,group]);
  const done=rows.filter(r=>r.result_status==='completed').length;
  const noShows=rows.filter(r=>r.result_status==='double_no_show').length;
  const pending=rows.filter(r=>r.result_status==='pending').length;
  const standings=useMemo(()=>groups.map(g=>({group:g,players:standingsFor(rows,g)})),[rows,groups]);
  const [knockout,setKnockout]=useState<ReturnType<typeof buildSeries4Knockout>|null>(null);
  const [knockoutError,setKnockoutError]=useState('');
  const [locked,setLocked]=useState(false);
  const [knockoutBusy,setKnockoutBusy]=useState(false);
  const [scores,setScores]=useState<Record<string,{score_a:number;score_b:number;version:number}>>({});
  const [scoreDrafts,setScoreDrafts]=useState<Record<string,string>>({});
  const loadKnockout=useCallback(async()=>{
    if(!supabase)return;
    const [draw,result]=await Promise.all([
      supabase.from('plato_land_series4_knockout_draw').select('bracket').maybeSingle(),
      supabase.from('plato_land_series4_knockout_scores').select('match_id,score_a,score_b,version'),
    ]);
    if(draw.error||result.error){setKnockoutError('دریافت براکت یا نتایج حذفی ناموفق بود.');return;}
    lockedRef.current=Boolean(draw.data);
    setLocked(lockedRef.current);
    setKnockout(draw.data?.bracket ?? null);
    setScores(Object.fromEntries((result.data??[]).map(row=>[row.match_id,row])));
    setScoreDrafts({});
    setKnockoutError('');
  },[]);
  useEffect(()=>{void loadKnockout();},[loadKnockout]);
  const groupStageComplete=standings.length>0 && pending===0 &&
    standings.every(({group,players})=>players.length===4 && rows.filter(row=>row.group_name===group).length===6);
  function previewKnockout() {
    try {
      setKnockoutError('');
      const qualifiers=selectSeries4Qualifiers(standings.map(({group,players})=>
        players.map(player=>({...player,group,rank:player.rank!}))));
      setKnockout(buildSeries4Knockout(qualifiers));
    } catch(error) {
      setKnockout(null);
      setKnockoutError((error as Error).message);
    }
  }
  async function persistKnockout() {
    if(!supabase||!knockout||locked||knockoutBusy||!groupStageComplete)return;
    if(!window.confirm('این قرعه به‌عنوان براکت قطعی سری چهارم ذخیره شود؟'))return;
    setKnockoutBusy(true);
    try {
      const {error}=await supabase.rpc('series4_owner_save_knockout',{
        p_bracket:knockout,p_group_versions:Object.fromEntries(rows.map(row=>[row.match_id,row.version])),
      });
      if(error)throw error;
      await loadKnockout();
    } catch(error) {
      setKnockoutError((error as {message?:string}).message||'ذخیره براکت ناموفق بود.');
    } finally {setKnockoutBusy(false);}
  }
  async function scoreKnockout(id:string) {
    if(!supabase||!locked||knockoutBusy)return;
    const value=scoreDrafts[id]?.trim()??'';
    if(!/^(5-[0-4]|[0-4]-5)$/.test(value)){setKnockoutError('نتیجه را مانند ۵-۳ با اعداد انگلیسی وارد کن.');return;}
    const [a,b]=value.split('-').map(Number);
    setKnockoutBusy(true);
    setKnockoutError('');
    try {
      const {error}=await supabase.rpc('series4_owner_score_knockout',{
        p_match_id:id,p_score_a:a,p_score_b:b,p_version:scores[id]?.version??0,
      });
      if(error)throw error;
      await loadKnockout();
    } catch(error) {
      setKnockoutError((error as {message?:string}).message||'ثبت نتیجه ناموفق بود.');
    } finally {setKnockoutBusy(false);}
  }
  const participants=new Map<string,[string|undefined,string|undefined]>();
  for(const match of knockout?.firstRound??[]) participants.set(match.id,[match.a.plato_id,match.b.plato_id]);
  function advance(id:string,loser=false) {
    const score=scores[id];
    const pair=participants.get(id);
    if(!score||!pair)return undefined;
    return pair[(score.score_a>score.score_b)!==loser?0:1];
  }
  for(const round of knockout?.laterRounds??[]) {
    for(const match of round) participants.set(match.id,[advance(match.fromA),advance(match.fromB)]);
  }
  if(knockout)participants.set(knockout.thirdPlace.id,[advance(knockout.thirdPlace.fromA,true),advance(knockout.thirdPlace.fromB,true)]);
  function scoreForm(id:string) {
    if(!locked)return null;
    const pair=participants.get(id);
    const score=scores[id];
    if(!pair?.[0]||!pair[1])return <span style={muted}> · در انتظار تعیین بازیکنان</span>;
    return <div style={{margin:'5px 0 10px'}}>
      <bdi>{pair[0]}</bdi> در برابر <bdi>{pair[1]}</bdi>
      <input aria-label={'نتیجه '+id} dir="ltr" placeholder="5-3" style={{...input,width:85,margin:'0 8px'}}
        value={scoreDrafts[id]??(score?score.score_a+'-'+score.score_b:'')}
        onChange={event=>setScoreDrafts(previous=>({...previous,[id]:event.target.value}))}/>
      <button type="button" style={secondary} disabled={knockoutBusy} onClick={()=>void scoreKnockout(id)}>ذخیره نتیجه</button>
    </div>;
  }
  async function save(row:MatchResult) {
    if(!supabase)return;
    const d=drafts[row.match_id]||emptyDraft(row);
    let scoreA:number|null=null,scoreB:number|null=null;
    if(d.status==='completed'){
      if(!/^\d+$/.test(d.scoreA)||!/^\d+$/.test(d.scoreB)){setError('برای نتیجه عادی، هر دو امتیاز را با عدد صحیح وارد کن.');setMessage('');return;}
      scoreA=Number(d.scoreA);scoreB=Number(d.scoreB);
      if(!Number.isSafeInteger(scoreA)||!Number.isSafeInteger(scoreB)||scoreA<0||scoreB<0||Math.max(scoreA,scoreB)!==5||scoreA===scoreB){
        setError('نتیجه باید پنج‌امتیازی باشد؛ برنده ۵ و بازنده ۰ تا ۴.');setMessage('');return;
      }
    }
    setSaving(row.match_id);setError('');setMessage('');
    const {data:authData,error:authError}=await supabase.auth.getUser();
    if(authError||!authData.user){setError('نشست معتبر مالک پیدا نشد؛ دوباره وارد پنل شو.');setSaving(null);return;}
    const {data,error:saveError}=await supabase.from('plato_land_series4_group_match_results')
      .update({result_status:d.status,score_a:scoreA,score_b:scoreB})
      .eq('match_id',row.match_id).eq('version',row.version).select('match_id,version').maybeSingle();
    if(saveError||!data){setError('ذخیره نتیجه انجام نشد: '+(saveError?.message||'نتیجه در همین زمان تغییر کرده است؛ ابتدا تازه‌سازی کن.'));setSaving(null);return;}
    setMessage('نتیجه '+row.match_id+' ذخیره شد. نسخه '+fa(data.version)+'؛ سابقه اصلاحات حفظ شده است.');
    await load();setSaving(null);
  }
  return <details dir="rtl" style={panel}>
    <summary style={{cursor:'pointer',color:'#f3dfad',fontSize:17,fontWeight:800}}>ثبت نتایج بازی‌های گروهی سری چهارم</summary>
    <div style={{marginTop:10}}>
    <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:8,flexWrap:'wrap'}}>
      <div><p style={{...muted,margin:'4px 0 0'}}>هر برد ۳ امتیاز</p></div>
      <button type="button" style={secondary} disabled={loading} onClick={()=>void load()}>{loading?'در حال دریافت…':'تازه‌سازی'}</button>
    </div>
    {!loading && rows.length===0 && <div style={{...card,marginTop:10}}>
      <p style={muted}>پس از ذخیره قرعه گروهی، تاریخ هر سه دور را وارد کن.</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {dates.map((date,index)=><label key={index} style={muted}>تاریخ دور {fa(index+1)}
          <input type="date" value={date} disabled={creating} style={input}
            onChange={event=>setDates(previous=>previous.map((value,i)=>i===index?event.target.value:value))}/>
        </label>)}
      </div>
      <button type="button" style={primary} disabled={creating||!dates.every(Boolean)} onClick={()=>void createSchedule()}>
        {creating?'در حال ذخیره…':'ذخیره برنامه گروهی'}
      </button>
    </div>}
    <details style={{...card,marginTop:12}}>
      <summary style={{cursor:'pointer',color:'#e4c77e',fontWeight:800}}>برنامه رسمی مسابقات گروهی</summary>
      {!loading&&days.length===0&&<p style={muted}>برنامه گروهی هنوز ذخیره نشده است.</p>}
      {days.map(date=><details key={date} style={{...card,marginTop:8}}>
        <summary>{new Date(date+'T12:00:00').toLocaleDateString('fa-IR',{dateStyle:'long'})}
          {' · '+fa(rows.filter(row=>row.match_date===date).length)+' بازی'}</summary>
        <ul style={{paddingInlineStart:20}}>
          {rows.filter(row=>row.match_date===date).map(row=><li key={row.match_id}>
            گروه {row.group_name} · دور {fa(row.round_no)} · بازی {fa(row.match_no)}
            {' · '}<bdi>{row.player_a_plato_id}</bdi> در برابر <bdi>{row.player_b_plato_id}</bdi>
          </li>)}
        </ul>
        <button type="button" style={secondary} onClick={()=>{setDay(date);setGroup('ALL');}}>فیلتر نتایج همین روز</button>
      </details>)}
    </details>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:7,marginTop:12}}>
      {[['کل بازی‌ها',rows.length],['ثبت نتیجه',done],['عدم حضور دوطرفه',noShows],['در انتظار',pending]].map(([label,value])=><div key={String(label)} style={{...card,padding:8}}><div style={{...muted,fontSize:10}}>{label}</div><strong style={{fontSize:20,color:'#e4c77e'}}>{loading?'—':fa(Number(value))}</strong></div>)}
    </div>
    {error&&<p role="alert" style={{color:'#efaaaa',fontSize:12}}>{error}</p>}
    {message&&<p role="status" style={{color:'#b8dfa9',fontSize:12}}>{message}</p>}
    <div style={{...card,marginTop:12,width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box',overflow:'hidden'}}>
      <strong style={{color:'#e4c77e'}}>جدول امتیازات گروه‌ها</strong>
      <p style={muted}>مرتب‌سازی بر اساس امتیاز، تفاضل ست و ست برده‌شده است. در تساوی دو بازیکن، نتیجه رودررو تعیین‌کننده است. تساوی حل‌نشده با رتبه مشترک نمایش داده می‌شود.</p>
      <div style={{display:'grid',gap:10,width:'100%',maxWidth:'100%',minWidth:0}}>
        {standings.map(({group:g,players})=><details key={g} style={{border:'1px solid #55452a',borderRadius:8,padding:8,background:'#141414',width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box'}}>
          <summary style={{cursor:'pointer',color:'#f1d99e',fontWeight:800,overflowWrap:'anywhere'}}>گروه {g} · {fa(players.length)} بازیکن</summary>
          <div style={{width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box',overflowX:'auto',overscrollBehaviorX:'contain',WebkitOverflowScrolling:'touch',marginTop:8}}>
            <table style={{width:'max-content',borderCollapse:'collapse',fontSize:11,minWidth:470}}>
              <thead><tr>{['بازیکن','بازی مختومه','برد','باخت','امتیاز','ست زده','ست خورده','تفاضل'].map(h=><th key={h} style={{padding:6,borderBottom:'1px solid #67532f',whiteSpace:'nowrap',textAlign:'center'}}>{h}</th>)}</tr></thead>
              <tbody>{players.map((p,i)=><tr key={p.plato_id}>
                <td dir="ltr" style={{padding:6,textAlign:'left',whiteSpace:'nowrap'}}>{i>0&&p.rank===players[i-1].rank?'= ':''}{p.plato_id}</td>
                {[p.played,p.wins,p.losses,p.points,p.setsFor,p.setsAgainst,p.diff].map((v,j)=><td key={j} style={{padding:6,textAlign:'center',color:j===3?'#e4c77e':'#eee'}}>{fa(v)}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        </details>)}
      </div>
    </div>
    <div style={{...card,marginTop:12}}>
      <strong style={{color:'#e4c77e'}}>ثبت نتیجه بازی‌های مرحله گروهی</strong>
      <div style={{display:'flex',gap:7,overflowX:'auto',padding:'9px 0'}}>
        <button type="button" style={day==='ALL'?primary:secondary} onClick={()=>setDay('ALL')}>همه روزها</button>
        {days.map(d=><button type="button" key={d} style={day===d?primary:secondary} onClick={()=>setDay(d)}>{new Date(d+'T12:00:00').toLocaleDateString('fa-IR')}</button>)}
      </div>
      <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:9}}>
        <button type="button" style={group==='ALL'?primary:secondary} onClick={()=>setGroup('ALL')}>همه گروه‌ها</button>
        {groups.map(g=><button type="button" key={g} style={group===g?primary:secondary} onClick={()=>setGroup(g)}>گروه {g}</button>)}
      </div>
      {loading?<p style={muted}>در حال بارگذاری بازی‌ها…</p>:<div style={{display:'grid',gap:8}}>
        {visible.map(row=>{
          const d=drafts[row.match_id]||emptyDraft(row);
          return <details key={row.match_id} style={card}>
            <summary style={{cursor:'pointer',display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',color:'#e4c77e',fontSize:11}}>
              <strong>گروه {row.group_name} · بازی {fa(row.match_no)} · {new Date(row.match_date+'T12:00:00').toLocaleDateString('fa-IR')}</strong>
              <span>{row.result_status==='completed'?'نتیجه ثبت‌شده':row.result_status==='double_no_show'?'عدم حضور دوطرفه':'در انتظار نتیجه'}</span>
            </summary>
            <div style={{marginTop:10}}> 
            <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:8,marginTop:9}}>
              <div style={{minWidth:0}}>
                <strong dir="ltr" style={{display:'block',fontSize:12,overflowWrap:'anywhere',textAlign:'center',minHeight:32}}>{row.player_a_plato_id}</strong>
                <label style={muted}>امتیاز
                  <input type="number" inputMode="numeric" min="0" step="1" value={d.scoreA} onChange={e=>setDrafts(p=>({...p,[row.match_id]:{...d,scoreA:e.target.value}}))} disabled={d.status!=='completed'} style={input}/>
                </label>
              </div>
              <div style={{minWidth:0}}>
                <strong dir="ltr" style={{display:'block',fontSize:12,overflowWrap:'anywhere',textAlign:'center',minHeight:32}}>{row.player_b_plato_id}</strong>
                <label style={muted}>امتیاز
                  <input type="number" inputMode="numeric" min="0" step="1" value={d.scoreB} onChange={e=>setDrafts(p=>({...p,[row.match_id]:{...d,scoreB:e.target.value}}))} disabled={d.status!=='completed'} style={input}/>
                </label>
              </div>
            </div>
            <label style={{display:'block',...muted,marginTop:8}}>وضعیت بازی
              <select value={d.status} onChange={e=>setDrafts(p=>({...p,[row.match_id]:{...d,status:e.target.value as ResultStatus}}))} style={input}>
                <option value="pending">در انتظار نتیجه</option><option value="completed">نتیجه عادی ثبت شود</option><option value="double_no_show">عدم حضور هر دو بازیکن</option>
              </select>
            </label>
            {d.status==='double_no_show'&&<p style={{...muted,color:'#e4c77e'}}>این بازی مختومه می‌شود؛ برای هیچ بازیکنی برد، باخت، امتیاز یا ست ثبت نمی‌شود.</p>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginTop:9}}>
              <span style={muted}>{row.result_status==='completed'?'نتیجه ثبت شده':row.result_status==='double_no_show'?'عدم حضور دوطرفه ثبت شده':'هنوز نتیجه‌ای ثبت نشده'}</span>
              <button type="button" style={primary} disabled={saving!==null} onClick={()=>void save(row)}>{saving===row.match_id?'ذخیره…':'ذخیره نتیجه'}</button>
            </div>
            </div>
          </details>;
        })}
      </div>}
    </div>

    <details style={{...card,marginTop:12}}>
      <summary>مرحله حذفی سری چهارم</summary>
      <p style={muted}>پس از تکمیل نتایج گروهی، مسیر صعود و بازی‌های حذفی قابل پیش‌نمایش است.</p>
      {!locked&&<button type="button" style={primary} disabled={loading||knockoutBusy||!groupStageComplete} onClick={previewKnockout}>ساخت پیش‌نمایش براکت</button>}
      {!locked&&knockout&&<button type="button" style={secondary} disabled={knockoutBusy||!groupStageComplete} onClick={()=>void persistKnockout()}>ذخیره قطعی قرعه</button>}
      <button type="button" style={secondary} disabled={knockoutBusy} onClick={()=>void loadKnockout()}>تازه‌سازی براکت</button>
      {knockoutError&&<p role="alert">{knockoutError}</p>}
      {knockout&&<>
        <ul>{knockout.firstRound.map(match=><li key={match.id}>
          <bdi>{match.id}</bdi> · <bdi>{match.a.plato_id}</bdi> در برابر <bdi>{match.b.plato_id}</bdi>{scoreForm(match.id)}
        </li>)}</ul>
        {knockout.laterRounds.map(stage=><ul key={stage[0].id}>{stage.map(match=><li key={match.id}>
          <bdi>{match.id}</bdi> · برنده <bdi>{match.fromA}</bdi> در برابر برنده <bdi>{match.fromB}</bdi>{scoreForm(match.id)}
        </li>)}</ul>)}
        <p>رده‌بندی · بازنده <bdi>{knockout.thirdPlace.fromA}</bdi> در برابر بازنده <bdi>{knockout.thirdPlace.fromB}</bdi></p>
        {scoreForm(knockout.thirdPlace.id)}
      </>}
    </details>
    <p style={{...muted,marginTop:10}}>هر اصلاح، نسخه قبلی را در تاریخچه نگه می‌دارد. برنامه بازی‌ها و جای بازیکنان قابل تغییر نیست.</p>
    </div>
  </details>;
}
