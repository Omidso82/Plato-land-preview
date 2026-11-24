import React,{useState} from 'react';
import {supabase} from './supabase';
import {resolveSeries4Matches,type buildSeries4Knockout} from './series4Knockout';

type Campaign={id:string;title:string;status:string;campaign_type:string;questions:{id:string;label:string;match?:{matchId?:string}}[]};
type Answer={question:string;prediction:string;actual?:string;status:string};
type Report={id:string;player:string;answers:Answer[];correct:number};
const normalize=(value:string)=>value.trim().toLowerCase();

export default function Series4PredictionReport(){
  const [campaigns,setCampaigns]=useState<Campaign[]|null>(null);
  const [selected,setSelected]=useState('');
  const [reports,setReports]=useState<Report[]>([]);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function loadCampaigns(){
    if(!supabase||busy)return;
    setBusy(true);setError('');
    try{
      const {data,error}=await supabase.from('plato_land_prediction_campaigns')
        .select('id,title,status,campaign_type,questions').eq('event_key','series4')
        .in('status',['published','closed']).order('created_at',{ascending:false});
      if(error)throw error;
      setCampaigns(data??[]);
      setSelected('');setReports([]);
    }catch{setError('دریافت فهرست پیش‌بینی‌های سری چهارم ناموفق بود.');}
    finally{setBusy(false);}
  }
  async function loadReport(id:string){
    const campaign=campaigns?.find(item=>item.id===id);
    setSelected(id);setReports([]);setError('');
    if(!supabase||!campaign||busy)return;
    setBusy(true);
    try{
      const entriesQuery=supabase.from('plato_land_prediction_entries')
        .select('id,voter_plato_id,response').eq('campaign_id',campaign.id)
        .or('result_status.is.null,result_status.neq.disqualified').order('submitted_at');
      const isMatch=campaign.campaign_type==='match_predictions';
      const [entries,groups,draw,knockout]=await Promise.all([
        entriesQuery,
        isMatch?supabase.from('plato_land_series4_group_match_results').select('match_id,player_a_plato_id,player_b_plato_id,score_a,score_b,result_status'):null,
        isMatch?supabase.from('plato_land_series4_knockout_draw').select('bracket').maybeSingle():null,
        isMatch?supabase.from('plato_land_series4_knockout_scores').select('match_id,score_a,score_b'):null,
      ]);
      if(entries.error||groups?.error||draw?.error||knockout?.error)throw new Error();
      const winners=new Map<string,string>();
      const excluded=new Set<string>();
      for(const row of groups?.data??[]){
        if(row.result_status==='double_no_show')excluded.add(row.match_id);
        if(row.result_status==='completed'&&row.score_a!==null&&row.score_b!==null)
          winners.set(row.match_id,row.score_a>row.score_b?row.player_a_plato_id:row.player_b_plato_id);
      }
      if(draw?.data?.bracket){
        const {players,byId}=resolveSeries4Matches(draw.data.bracket as ReturnType<typeof buildSeries4Knockout>,knockout?.data??[]);
        for(const [id,score] of byId){
          const winner=players.get(id)?.[score.score_a>score.score_b?0:1];
          if(winner)winners.set(id,winner);
        }
      }
      setReports((entries.data??[]).map(entry=>{
        const answers=(campaign.questions??[]).map(question=>{
          const prediction=String(entry.response?.[question.id]??'');
          const id=question.match?.matchId;
          const actual=id?winners.get(id):undefined;
          const status=id&&excluded.has(id)?'حذف‌شده از امتیازدهی':
            !actual?'در انتظار ارزیابی':!prediction?'بدون پاسخ':
            normalize(prediction)===normalize(actual)?'درست':'نادرست';
          return {question:question.label,prediction,actual,status};
        });
        return {id:entry.id,player:entry.voter_plato_id,answers,correct:answers.filter(answer=>answer.status==='درست').length};
      }).sort((a,b)=>b.correct-a.correct||a.player.localeCompare(b.player)));
    }catch{setError('دریافت گزارش امتیازدهی سری چهارم ناموفق بود.');}
    finally{setBusy(false);}
  }
  return <details style={{marginTop:10}}>
    <summary>گزارش پیش‌بینی‌های سری چهارم</summary>
    <button type="button" disabled={busy} onClick={()=>void loadCampaigns()}>دریافت فهرست پیش‌بینی‌ها</button>
    {error&&<p role="alert">{error}</p>}
    {campaigns?.length===0&&<p>پیش‌بینی منتشرشده یا بسته‌شده‌ای برای سری چهارم وجود ندارد.</p>}
    {!!campaigns?.length&&<label>انتخاب پیش‌بینی <select value={selected} disabled={busy} onChange={event=>void loadReport(event.target.value)}>
      <option value="">انتخاب کن</option>
      {campaigns.map(campaign=><option key={campaign.id} value={campaign.id}>{campaign.title} · {campaign.status==='closed'?'بسته‌شده':'منتشرشده'}</option>)}
    </select></label>}
    {selected&&!busy&&!error&&reports.length===0&&<p>پاسخی برای این پیش‌بینی ثبت نشده است.</p>}
    {reports.map(report=><details key={report.id}>
      <summary><bdi>{report.player}</bdi>{campaigns?.find(item=>item.id===selected)?.campaign_type==='match_predictions'&&
        ' · '+report.correct.toLocaleString('fa-IR')+' پاسخ درست'}</summary>
      <ul>{report.answers.map((answer,index)=><li key={index}>{answer.question} · <bdi>{answer.prediction||'—'}</bdi>
        {answer.actual&&<> · برنده <bdi>{answer.actual}</bdi></>} · {answer.status}</li>)}</ul>
    </details>)}
  </details>;
}
