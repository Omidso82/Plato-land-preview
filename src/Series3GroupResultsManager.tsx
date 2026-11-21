import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

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
  setsFor: number; setsAgainst: number; diff: number;
};
const fa = (n:number) => n.toLocaleString('fa-IR');
const panel: React.CSSProperties = { marginTop:14,padding:14,border:'1px solid #8c6a34',borderRadius:13,background:'linear-gradient(145deg,#211b12,#111214)',color:'#f2ead8' };
const card: React.CSSProperties = { border:'1px solid #59472a',borderRadius:10,padding:11,background:'#101112',minWidth:0 };
const muted: React.CSSProperties = { color:'#c9c0b0',fontSize:12,lineHeight:1.8 };
const input: React.CSSProperties = { width:'100%',minWidth:0,boxSizing:'border-box',background:'#0c0d0f',border:'1px solid #6a5a37',borderRadius:8,color:'#fff',padding:'9px 8px' };
const primary: React.CSSProperties = { background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:8,color:'#17130b',padding:'9px 12px',fontWeight:800,cursor:'pointer' };
const secondary: React.CSSProperties = { ...primary,background:'#211b12',color:'#e4c77e',border:'1px solid #806638' };
const groups = 'ABCDEFGHIJKL'.split('');
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
  return [...map.values()].map(x=>({...x,diff:x.setsFor-x.setsAgainst}))
    .sort((a,b)=>b.points-a.points || b.diff-a.diff || b.setsFor-a.setsFor || a.plato_id.localeCompare(b.plato_id,'en'));
}
function tied(a:Standing,b:Standing) {
  return a.points===b.points && a.diff===b.diff && a.setsFor===b.setsFor;
}
export default function Series3GroupResultsManager() {
  const [rows,setRows]=useState<MatchResult[]>([]);
  const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [day,setDay]=useState('');
  const [group,setGroup]=useState('ALL');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const load=useCallback(async()=>{
    if(!supabase){setError('اتصال به دیتابیس اصلی در دسترس نیست.');setLoading(false);return;}
    setLoading(true);setError('');
    const {data,error:readError}=await supabase.from('plato_land_series3_group_match_results')
      .select('match_id,match_date,round_no,group_name,match_no,player_a_registration_id,player_a_plato_id,player_b_registration_id,player_b_plato_id,result_status,score_a,score_b,version,updated_at')
      .order('match_date').order('group_name').order('match_no');
    if(readError){setError('دریافت نتایج سری سوم ناموفق بود: '+readError.message);setLoading(false);return;}
    const next=(data||[]) as MatchResult[];
    setRows(next);
    setDay(current=>current || next[0]?.match_date || 'ALL');
    setDrafts(Object.fromEntries(next.map(r=>[r.match_id,emptyDraft(r)])));
    setLoading(false);
  },[]);
  useEffect(()=>{void load();},[load]);
  const days=useMemo(()=>[...new Set(rows.map(r=>r.match_date))].sort(),[rows]);
  const visible=useMemo(()=>rows.filter(r=>(day==='ALL'||r.match_date===day)&&(group==='ALL'||r.group_name===group)),[rows,day,group]);
  const done=rows.filter(r=>r.result_status==='completed').length;
  const noShows=rows.filter(r=>r.result_status==='double_no_show').length;
  const pending=rows.filter(r=>r.result_status==='pending').length;
  const standings=useMemo(()=>groups.map(g=>({group:g,players:standingsFor(rows,g)})),[rows]);
  async function save(row:MatchResult) {
    if(!supabase)return;
    const d=drafts[row.match_id]||emptyDraft(row);
    let scoreA:number|null=null,scoreB:number|null=null;
    if(d.status==='completed'){
      if(!/^\d+$/.test(d.scoreA)||!/^\d+$/.test(d.scoreB)){setError('برای نتیجه عادی، هر دو امتیاز را با عدد صحیح وارد کن.');setMessage('');return;}
      scoreA=Number(d.scoreA);scoreB=Number(d.scoreB);
      if(!Number.isSafeInteger(scoreA)||!Number.isSafeInteger(scoreB)||scoreA<0||scoreB<0||scoreA===scoreB){
        setError('هر دو امتیاز باید عدد صحیحِ صفر یا بیشتر باشند و نتیجه مساوی نباشد.');setMessage('');return;
      }
    }
    setSaving(row.match_id);setError('');setMessage('');
    const {data:authData,error:authError}=await supabase.auth.getUser();
    if(authError||!authData.user){setError('نشست معتبر مالک پیدا نشد؛ دوباره وارد پنل شو.');setSaving(null);return;}
    const {data,error:saveError}=await supabase.from('plato_land_series3_group_match_results')
      .update({result_status:d.status,score_a:scoreA,score_b:scoreB})
      .eq('match_id',row.match_id).select('match_id,version').maybeSingle();
    if(saveError||!data){setError('ذخیره نتیجه انجام نشد: '+(saveError?.message||'بازی موردنظر پیدا نشد.'));setSaving(null);return;}
    setMessage('نتیجه '+row.match_id+' ذخیره شد. نسخه '+fa(data.version)+'؛ سابقه اصلاحات حفظ شده است.');
    await load();setSaving(null);
  }
  return <details dir="rtl" style={panel}>
    <summary style={{cursor:'pointer',color:'#f3dfad',fontSize:17,fontWeight:800}}>ثبت نتایج و جدول گروهی سری سوم</summary>
    <div style={{marginTop:10}}>
    <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:8,flexWrap:'wrap'}}>
      <div><p style={{...muted,margin:'4px 0 0'}}>متصل به برنامه ثابت ۷۲ بازی · هر برد ۳ امتیاز</p></div>
      <button type="button" style={secondary} disabled={loading} onClick={()=>void load()}>{loading?'در حال دریافت…':'تازه‌سازی'}</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:7,marginTop:12}}>
      {[['کل بازی‌ها',rows.length],['ثبت نتیجه',done],['عدم حضور دوطرفه',noShows],['در انتظار',pending]].map(([label,value])=><div key={String(label)} style={{...card,padding:8}}><div style={{...muted,fontSize:10}}>{label}</div><strong style={{fontSize:20,color:'#e4c77e'}}>{loading?'—':fa(Number(value))}</strong></div>)}
    </div>
    {error&&<p role="alert" style={{color:'#efaaaa',fontSize:12}}>{error}</p>}
    {message&&<p role="status" style={{color:'#b8dfa9',fontSize:12}}>{message}</p>}
    <div style={{...card,marginTop:12,width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box',overflow:'hidden'}}>
      <strong style={{color:'#e4c77e'}}>جدول امتیازات گروه‌ها</strong>
      <p style={muted}>مرتب‌سازی بر اساس امتیاز، تفاضل ست و ست برده‌شده است. اگر این معیارها برابر باشند، رتبه مشترک نمایش داده می‌شود و برنده‌ی تساوی حدس زده نمی‌شود.</p>
      <div style={{display:'grid',gap:10,width:'100%',maxWidth:'100%',minWidth:0}}>
        {standings.map(({group:g,players})=><details key={g} style={{border:'1px solid #55452a',borderRadius:8,padding:8,background:'#141414',width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box'}}>
          <summary style={{cursor:'pointer',color:'#f1d99e',fontWeight:800,overflowWrap:'anywhere'}}>گروه {g} · {fa(players.length)} بازیکن</summary>
          <div style={{width:'100%',maxWidth:'100%',minWidth:0,boxSizing:'border-box',overflowX:'auto',overscrollBehaviorX:'contain',WebkitOverflowScrolling:'touch',marginTop:8}}>
            <table style={{width:'max-content',borderCollapse:'collapse',fontSize:11,minWidth:470}}>
              <thead><tr>{['بازیکن','بازی مختومه','برد','باخت','امتیاز','ست زده','ست خورده','تفاضل'].map(h=><th key={h} style={{padding:6,borderBottom:'1px solid #67532f',whiteSpace:'nowrap',textAlign:'center'}}>{h}</th>)}</tr></thead>
              <tbody>{players.map((p,i)=><tr key={p.plato_id}>
                <td dir="ltr" style={{padding:6,textAlign:'left',whiteSpace:'nowrap'}}>{i>0&&tied(p,players[i-1])?'= ':''}{p.plato_id}</td>
                {[p.played,p.wins,p.losses,p.points,p.setsFor,p.setsAgainst,p.diff].map((v,j)=><td key={j} style={{padding:6,textAlign:'center',color:j===3?'#e4c77e':'#eee'}}>{fa(v)}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        </details>)}
      </div>
    </div>
    <div style={{...card,marginTop:12}}>
      <strong style={{color:'#e4c77e'}}>ثبت نتیجه بازی‌ها</strong>
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
    <p style={{...muted,marginTop:10}}>هر اصلاح، نسخه قبلی را در تاریخچه نگه می‌دارد. برنامه بازی‌ها و جای بازیکنان قابل تغییر نیست.</p>
    </div>
  </details>;
}
