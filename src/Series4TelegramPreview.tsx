import React,{useState} from 'react';
import {supabase} from './supabase';
import type {buildSeries4Knockout} from './series4Knockout';

type ReportKind='schedule'|'results'|'bracket'|'knockout';

type Row = {
  match_date:string;
  group_name:string;
  player_a_plato_id:string;
  player_b_plato_id:string;
  result_status:string;
  score_a:number|null;
  score_b:number|null;
};

export default function Series4TelegramPreview(){
  const [kind,setKind]=useState<ReportKind>('schedule');
  const [date,setDate]=useState('');
  const [preview,setPreview]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);
  const isGroupReport=kind==='schedule'||kind==='results';
  async function knockoutReport() {
    if(!supabase)return '';
    const [draw,results]=await Promise.all([
      supabase.from('plato_land_series4_knockout_draw').select('bracket').maybeSingle(),
      supabase.from('plato_land_series4_knockout_scores').select('match_id,score_a,score_b'),
    ]);
    if(draw.error||results.error)throw Error('دریافت نتایج حذفی ناموفق بود.');
    const bracket=draw.data?.bracket as ReturnType<typeof buildSeries4Knockout>|undefined;
    if(!bracket)return '';
    const scored=new Map((results.data??[]).map(row=>[row.match_id,row]));
    const participants=new Map<string,[string|undefined,string|undefined]>();
    for(const match of bracket.firstRound)participants.set(match.id,[match.a.plato_id,match.b.plato_id]);
    function advance(id:string,loser=false) {
      const score=scored.get(id);
      return score?participants.get(id)?.[(score.score_a>score.score_b)!==loser?0:1]:undefined;
    }
    for(const round of bracket.laterRounds) {
      for(const match of round)participants.set(match.id,[advance(match.fromA),advance(match.fromB)]);
    }
    const third=bracket.thirdPlace;
    participants.set(third.id,[advance(third.fromA,true),advance(third.fromB,true)]);
    return [...participants].flatMap(([id,[a,b]])=>{
      const score=scored.get(id);
      if(kind==='knockout'&&(!a||!b||!score))return [];
      return [id+' · '+(a??'در انتظار صعود')+' — '+(b??'در انتظار صعود')+
        (score?' · '+score.score_a+'–'+score.score_b:'')];
    }).join('\n');
  }
  async function generate(){
    if(!supabase||busy||(isGroupReport&&!date))return;
    setBusy(true);setError('');setPreview('');setCopied(false);
    try{
      if(!isGroupReport){
        const text=await knockoutReport();
        if(!text){setError('برای این بخش گزارشی وجود ندارد.');return;}
        setPreview('PLATO LAND | سری چهارم تخته‌نرد\n'+(kind==='bracket'?'براکت حذفی':'نتایج حذفی')+'\n\n'+text);
        return;
      }
      const {data,error}=await supabase.from('plato_land_series4_group_match_results')
        .select('match_date,group_name,player_a_plato_id,player_b_plato_id,result_status,score_a,score_b')
        .eq('match_date',date).order('group_name').order('match_no');
      if(error)throw error;
      const rows=(data??[]) as Row[];
      const selected=kind==='results'?rows.filter(row=>row.result_status!=='pending'):rows;
      if(!selected.length){setError('برای این تاریخ گزارشی وجود ندارد.');return;}
      const lines=selected.map(row=>{
        const players=row.player_a_plato_id+' — '+row.player_b_plato_id;
        const result=row.result_status==='double_no_show'?' · عدم حضور دوطرفه':
          ' · '+String(row.score_a)+'–'+String(row.score_b);
        return 'گروه '+row.group_name+' · '+players+(kind==='results'?result:'');
      });
      const label=new Date(date+'T12:00:00').toLocaleDateString('fa-IR',{dateStyle:'long'});
      setPreview('PLATO LAND | سری چهارم تخته‌نرد\n'+(kind==='results'?'نتایج گروهی':'برنامه بازی‌های گروهی')+' · '+label+'\n\n'+lines.join('\n'));
    }catch{setError('دریافت داده‌های سری چهارم ناموفق بود.');}
    finally{setBusy(false);}
  }
  async function copy(){
    if(!preview)return;
    try{await navigator.clipboard.writeText(preview);setCopied(true);}
    catch{setError('کپی انجام نشد. متن داخل پیش‌نمایش قابل انتخاب است.');}
  }
  return <details dir="rtl" style={{marginTop:14,padding:14,border:'1px solid #8c6a34',borderRadius:13,color:'#f2ead8'}}>
    <summary style={{cursor:'pointer',color:'#e4c77e'}}>پیش‌نمایش اعلان تلگرام سری چهارم</summary>
    <div style={{display:'grid',gap:9,marginTop:10}}>
      <label>نوع گزارش <select value={kind} disabled={busy} onChange={event=>{setKind(event.target.value as typeof kind);setPreview('');}}>
        <option value="schedule">برنامه گروهی</option><option value="results">نتایج گروهی</option>
        <option value="bracket">براکت حذفی</option><option value="knockout">نتایج حذفی</option>
      </select></label>
      {isGroupReport&&<label>تاریخ <input type="date" value={date} disabled={busy} onChange={event=>{setDate(event.target.value);setPreview('');}}/></label>}
      <button type="button" disabled={busy||(isGroupReport&&!date)} onClick={()=>void generate()}>{busy?'در حال دریافت…':'ساخت پیش‌نمایش'}</button>
      {error&&<span role="alert">{error}</span>}
      {preview&&<><textarea aria-label="متن اعلان" rows={10} readOnly value={preview}/>
        <button type="button" onClick={()=>void copy()}>{copied?'کپی شد':'کپی متن'}</button></>}
    </div>
  </details>;
}
