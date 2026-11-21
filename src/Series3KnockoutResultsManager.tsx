import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type StageKey = 'round32'|'round16'|'quarterfinals'|'semifinals'|'thirdPlace'|'final';
type BracketToken = { id:string; label:string; source:string; group?:string };
type BracketMatch = { id:string; a:BracketToken; b:BracketToken };
type SavedResult = {
  id:string; stage_key:StageKey; match_id:string; match_no:number;
  player_a_plato_id:string; player_b_plato_id:string;
  score_a:number|null; score_b:number|null; result_status:'pending'|'completed'; version:number; created_by:string;
};
type Draft = { a:string; b:string; scoreA:string; scoreB:string };
const stages:{key:StageKey;label:string;count:number}[]=[
  {key:'round32',label:'یک‌شانزدهم نهایی',count:16},
  {key:'round16',label:'یک‌هشتم نهایی',count:8},
  {key:'quarterfinals',label:'یک‌چهارم نهایی',count:4},
  {key:'semifinals',label:'نیمه‌نهایی',count:2},
  {key:'thirdPlace',label:'رده‌بندی',count:1},
  {key:'final',label:'فینال',count:1},
];
const fa=(n:number)=>n.toLocaleString('fa-IR');
const box:React.CSSProperties={border:'1px solid #514329',borderRadius:9,padding:10,background:'#111214'};
const input:React.CSSProperties={width:'100%',minWidth:0,boxSizing:'border-box',background:'#0b0c0e',color:'#f5ead2',border:'1px solid #705b31',borderRadius:7,padding:'9px 8px'};
const muted:React.CSSProperties={color:'#c9c0b0',fontSize:12,lineHeight:1.8};

export default function Series3KnockoutResultsManager(){
  const [stage,setStage]=useState<StageKey>('round32');
  const [bracket,setBracket]=useState<Record<string,BracketMatch[]>>({});
  const [saved,setSaved]=useState<SavedResult[]>([]);
  const [players,setPlayers]=useState<string[]>([]);
  const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [loaded,setLoaded]=useState(false);

  async function refresh(){
    if(!supabase){setError('اتصال به دیتابیس اصلی برقرار نیست.');return;}
    setLoading(true);setError('');
    try{
      const [drawResult,resultResult,playersResult]=await Promise.all([
        supabase.from('plato_land_series3_knockout_draws').select('bracket_snapshot').eq('event_key','series3').maybeSingle(),
        supabase.from('plato_land_series3_knockout_match_results').select('id,stage_key,match_id,match_no,player_a_plato_id,player_b_plato_id,score_a,score_b,result_status,version,created_by').eq('event_key','series3').order('stage_key').order('match_no'),
        supabase.from('plato_land_series3_registration_requests').select('plato_id').eq('registration_status','main').order('plato_id'),
      ]);
      if(drawResult.error)throw drawResult.error;
      if(resultResult.error)throw resultResult.error;
      if(playersResult.error)throw playersResult.error;
      if(!drawResult.data?.bracket_snapshot)throw new Error('براکت رسمی حذفی هنوز در دیتابیس ثبت نشده است.');
      const snap=drawResult.data.bracket_snapshot as Record<string,BracketMatch[]>;
      setBracket(snap);
      const rows=(resultResult.data||[]) as SavedResult[];
      setSaved(rows);
      setPlayers([...new Set((playersResult.data||[]).map((x:any)=>String(x.plato_id||'').trim()).filter(Boolean))]);
      const next:Record<string,Draft>={};
      for(const row of rows)next[row.match_id]={a:row.player_a_plato_id,b:row.player_b_plato_id,scoreA:row.score_a===null?'':String(row.score_a),scoreB:row.score_b===null?'':String(row.score_b)};
      setDrafts(next);
      setLoaded(true);
    }catch(e){setError('دریافت براکت یا نتایج حذفی ناموفق بود: '+(e instanceof Error?e.message:'خطای نامشخص'));}
    finally{setLoading(false);}
  }
  useEffect(()=>{void refresh();},[]);
  const matches=useMemo(()=>{
    if(stage==='thirdPlace'&&!Array.isArray(bracket.thirdPlace))return [{id:'TP-1',a:{id:'TP-A',label:'بازیکن اول رده‌بندی',source:'manual'},b:{id:'TP-B',label:'بازیکن دوم رده‌بندی',source:'manual'}}];
    return Array.isArray(bracket[stage])?bracket[stage]:[];
  },[bracket,stage]);
  const savedMap=useMemo(()=>new Map(saved.map(x=>[x.match_id,x])),[saved]);
  function change(id:string,field:keyof Draft,value:string){
    setDrafts(prev=>({ ...prev,[id]:{...(prev[id]||{a:'',b:'',scoreA:'',scoreB:''}),[field]:value} }));
  }
  async function save(match:BracketMatch,index:number){
    if(!supabase)return;
    const draft=drafts[match.id]||{a:'',b:'',scoreA:'',scoreB:''};
    const a=draft.a.trim(),b=draft.b.trim(),sa=draft.scoreA.trim(),sb=draft.scoreB.trim();
    if(!a||!b){setError('برای ثبت نتیجه، Plato ID دقیق هر دو بازیکن را وارد کن.');return;}
    if(a.toLowerCase()===b.toLowerCase()){setError('Plato ID دو بازیکن باید متفاوت باشد.');return;}
    if(!players.some(x=>x.toLowerCase()===a.toLowerCase())||!players.some(x=>x.toLowerCase()===b.toLowerCase())){setError('Plato ID باید دقیقاً در فهرست بازیکنان اصلی ثبت‌نام‌شده سری سوم وجود داشته باشد.');return;}
    if(Boolean(sa)!==Boolean(sb)){setError('هر دو امتیاز را وارد کن یا هر دو را خالی بگذار.');return;}
    let scoreA:number|null=null,scoreB:number|null=null,status:'pending'|'completed'='pending';
    if(sa&&sb){
      scoreA=Number(sa);scoreB=Number(sb);
      if(!Number.isInteger(scoreA)||!Number.isInteger(scoreB)||scoreA<0||scoreB<0){setError('امتیازها باید عدد صحیح و غیرمنفی باشند.');return;}
      if(scoreA===scoreB){setError('نتیجه مساوی برای مسابقه حذفی قابل ثبت نیست.');return;}
      status='completed';
    }
    setSaving(match.id);setError('');setNotice('');
    try{
      const {data:userResult,error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!userResult.user)throw new Error('نشست مالک معتبر نیست؛ دوباره وارد پنل شو.');
      const previous=savedMap.get(match.id);
      const payload={
        event_key:'series3',stage_key:stage,match_id:match.id,match_no:index+1,
        player_a_plato_id:a,player_b_plato_id:b,score_a:scoreA,score_b:scoreB,
        result_status:status,version:(previous?.version||0)+1,updated_at:new Date().toISOString(),
        created_by:previous?.created_by||userResult.user.id,
        updated_by:userResult.user.id,
      };
      const {data,error}=await supabase.from('plato_land_series3_knockout_match_results')
        .upsert(payload,{onConflict:'event_key,match_id'}).select('id,stage_key,match_id,match_no,player_a_plato_id,player_b_plato_id,score_a,score_b,result_status,version,created_by').single();
      if(error)throw error;
      setSaved(prev=>[...prev.filter(x=>x.match_id!==match.id),data as SavedResult]);
      setNotice('نتیجه بازی '+fa(index+1)+' با موفقیت در دیتابیس اصلی ذخیره شد.');
    }catch(e){setError('ذخیره نتیجه انجام نشد: '+(e instanceof Error?e.message:'خطای نامشخص'));}
    finally{setSaving(null);}
  }
  return <details dir="rtl" style={{marginTop:12,border:'1px solid #806638',borderRadius:10,padding:12,background:'#111214'}}>
    <summary style={{cursor:'pointer',color:'#f0d99f',fontWeight:800}}>ثبت و گزارش نتایج مراحل حذفی · سری سوم</summary>
    <p style={{...muted,margin:'8px 0'}}>نتایج این بخش مستقل از نتایج مرحله گروهی ذخیره می‌شوند. Plato ID هر دو بازیکن باید از فهرست ۴۸ بازیکن اصلی باشد. برای اعلام نتیجه، هر دو امتیاز را وارد کن؛ برای ثبت بازی برنامه‌ریزی‌شده بدون نتیجه، امتیازها را خالی بگذار.</p>
    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
      <button type="button" onClick={()=>void refresh()} disabled={loading} style={{background:'#211b12',border:'1px solid #806638',borderRadius:8,color:'#e4c77e',padding:'9px 12px'}}>{loading?'در حال دریافت…':'به‌روزرسانی براکت و نتایج'}</button>
      <span style={muted}>{fa(saved.filter(x=>x.result_status==='completed').length)} نتیجه ثبت‌شده · {fa(saved.length)} بازی ذخیره‌شده</span>
    </div>
    <label style={{display:'grid',gap:6,marginTop:10,color:'#eee5d4',fontSize:12}}>مرحله حذفی
      <select value={stage} onChange={e=>{setStage(e.target.value as StageKey);setError('');setNotice('');}} style={input}>
        {stages.map(x=><option key={x.key} value={x.key}>{x.label} · {fa(x.count)} مسابقه</option>)}
      </select>
    </label>
    {!loaded&&loading?<p style={muted}>در حال بارگذاری…</p>:matches.length===0?<p style={muted}>برای این مرحله مسابقه‌ای در براکت رسمی ثبت نشده است.</p>:
      <div style={{display:'grid',gap:9,marginTop:10}}>
        {matches.map((match,index)=>{
          const draft=drafts[match.id]||{a:'',b:'',scoreA:'',scoreB:''};
          const row=savedMap.get(match.id);
          return <div key={match.id} style={box}>
            <strong style={{color:'#e4c77e'}}>بازی {fa(index+1)} · {match.id}</strong>
            <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:7,marginTop:9}}>
              <label style={muted}>بازیکن اول · {match.a?.label||'جایگاه اول'}
                <input list="series3-knockout-player-ids" value={draft.a} onChange={e=>change(match.id,'a',e.target.value)} placeholder="Plato ID دقیق" style={input} />
              </label>
              <label style={muted}>بازیکن دوم · {match.b?.label||'جایگاه دوم'}
                <input list="series3-knockout-player-ids" value={draft.b} onChange={e=>change(match.id,'b',e.target.value)} placeholder="Plato ID دقیق" style={input} />
              </label>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginTop:8}}>
              <label style={muted}>امتیاز بازیکن اول
                <input type="number" inputMode="numeric" min="0" step="1" value={draft.scoreA} onChange={e=>change(match.id,'scoreA',e.target.value)} placeholder="—" style={input}/>
              </label>
              <label style={muted}>امتیاز بازیکن دوم
                <input type="number" inputMode="numeric" min="0" step="1" value={draft.scoreB} onChange={e=>change(match.id,'scoreB',e.target.value)} placeholder="—" style={input}/>
              </label>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap',marginTop:9}}>
              <span style={muted}>{row?.result_status==='completed'?'نتیجه ثبت‌شده: '+fa(row.score_a??0)+' - '+fa(row.score_b??0):row?'بازیکنان ثبت شده‌اند؛ نتیجه در انتظار است':'هنوز ذخیره نشده'}</span>
              <button type="button" onClick={()=>void save(match,index)} disabled={saving!==null} style={{background:'#a98239',border:'1px solid #e3c77d',borderRadius:8,color:'#17130b',padding:'8px 13px',fontWeight:800}}>{saving===match.id?'در حال ذخیره…':'ذخیره بازی'}</button>
            </div>
          </div>;
        })}
      </div>}
    <datalist id="series3-knockout-player-ids">{players.map(id=><option key={id} value={id}/>)}</datalist>
    {error&&<p role="alert" style={{color:'#ffc8c8',fontSize:12,marginTop:9}}>{error}</p>}
    {notice&&<p role="status" style={{color:'#b8dfa9',fontSize:12,marginTop:9}}>{notice}</p>}
  </details>;
}
