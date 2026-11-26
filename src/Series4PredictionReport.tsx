import React,{useEffect,useState} from 'react';
import {series4PredictionPageCount,series4PredictionPng} from './series4PredictionImage';
import {supabase} from './supabase';
import {resolveSeries4Matches,type buildSeries4Knockout} from './series4Knockout';

type ResultDraft={winner_plato_ids:string[];prize_winner_plato_id:string;correct_count:number;
  total_questions:number;wrong_count:number;total_participants:number;prize_description:string};
type Campaign={id:string;title:string;status:string;campaign_type:string;updated_at:string;
  questions:{id:string;label:string;match?:{matchId?:string}}[];
  prize_rules?:{description?:string};public_config?:{result_draft?:ResultDraft;result?:ResultDraft&{status:'published'}}};
const destinations={test_group:'گروه آزمایشی تلگرام',main_channel:'کانال اصلی تلگرام'} as const;
type Answer={questionId:string;question:string;prediction:string;actual?:string;status:string};
type Report={id:string;player:string;answers:Answer[];correct:number};
const normalize=(value:string)=>value.trim().toLowerCase();

export default function Series4PredictionReport({onDelivery}:{onDelivery:()=>Promise<void>}){
  const [campaigns,setCampaigns]=useState<Campaign[]|null>(null);
  const [publicEnabled,setPublicEnabled]=useState(false);
  useEffect(()=>{
    if(!supabase)return;
    let active=true;
    void supabase.rpc('series4_public_features_status').then(({data,error})=>{
      if(active)setPublicEnabled(!error&&data===true);
    });
    return ()=>{active=false;};
  },[]);
  const [selected,setSelected]=useState('');
  const [reports,setReports]=useState<Report[]>([]);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [imagePage,setImagePage]=useState(0);
  const [imageUrl,setImageUrl]=useState('');
  const [imageBusy,setImageBusy]=useState(false);
  const [imageBlob,setImageBlob]=useState<Blob|null>(null);
  const [destination,setDestination]=useState<keyof typeof destinations|''>('');
  const [attempt,setAttempt]=useState('');
  const [delivery,setDelivery]=useState('');
  const [prizeWinner,setPrizeWinner]=useState('');
  const [resultNotice,setResultNotice]=useState('');
  function resetImage(){
    setImageUrl('');setImageBlob(null);setDestination('');setAttempt('');setDelivery('');
  }
  const campaign=campaigns?.find(item=>item.id===selected);
  const imageRows=campaign?.campaign_type==='champion'
    ? reports.flatMap(report=>{
        const answer=report.answers.find(item=>item.questionId==='champion'&&item.prediction);
        return answer?[{player:report.player,value:answer.prediction}]:[];
      })
    : campaign?.campaign_type==='match_predictions'
      ? reports.map(report=>({player:report.player,value:report.correct.toLocaleString('fa-IR')+' پاسخ درست'}))
      : [];
  const imagePages=series4PredictionPageCount(imageRows.length);
  const resultReady=campaign&&campaign.campaign_type!=='custom'&&reports.length>0&&
    reports.every(report=>report.answers.some(answer=>answer.actual)&&
      report.answers.every(answer=>answer.actual||answer.status==='حذف‌شده از امتیازدهی'));
  const winners=resultReady?reports.filter(report=>report.correct===reports[0].correct).map(report=>report.player):[];
  async function saveResultDraft(publish=false){
    if(!supabase||!campaign||!resultReady||busy||imageBusy||!winners.length)return;
    const winner=winners.length===1?winners[0]:prizeWinner;
    if(!winners.includes(winner))return;
    if(publish&&(!publicEnabled||campaign.status!=='closed'||!window.confirm('نتیجهٔ پیش‌بینی سری چهارم برای همه منتشر شود؟')))return;
    setBusy(true);setError('');setResultNotice('');
    try{
      const total=reports[0].answers.filter(answer=>answer.actual).length;
      const resultDraft={
        winner_plato_ids:winners,prize_winner_plato_id:winner,correct_count:reports[0].correct,
        total_questions:total,wrong_count:total-reports[0].correct,total_participants:reports.length,
        prize_description:campaign.prize_rules?.description??'',
      };
      const {data,error}=await supabase.from('plato_land_prediction_campaigns')
        .update({public_config:{
          ...campaign.public_config,result_draft:resultDraft,
          ...(publish?{result:{...resultDraft,status:'published'}}:{}),
        },updated_at:new Date().toISOString()})
        .eq('event_key','series4').eq('id',campaign.id).eq('updated_at',campaign.updated_at)
        .select('public_config,updated_at').single();
      if(error)throw error;
      setCampaigns(previous=>previous?.map(item=>item.id===campaign.id?{...item,public_config:data.public_config,updated_at:data.updated_at}:item)??null);
      setResultNotice(publish?'نتیجهٔ پیش‌بینی منتشر شد.':'پیش‌نویس نتیجه ذخیره شد.');
    }catch{setError('ذخیره پیش‌نویس نتیجه ناموفق بود.');}
    finally{setBusy(false);}
  }
  async function sendImage(){
    if(!supabase||!imageBlob||!campaign||!destination||imageBusy||attempt)return;
    if(!window.confirm('همین تصویر گزارش سری چهارم به '+destinations[destination]+' ارسال شود؟'))return;
    const target=destination;
    const requestId=crypto.randomUUID();
    setAttempt(requestId);setImageBusy(true);setDelivery('');setError('');
    try{
      const form=new FormData();
      form.set('request_id',requestId);
      form.set('message','PLATO LAND | سری چهارم تخته‌نرد\n'+campaign.title.slice(0,850)+
        ' · صفحه '+(imagePage+1).toLocaleString('fa-IR'));
      form.append('destinations',target);
      form.set('photo',imageBlob,'plato-land-series4-predictions.png');
      const {data,error}=await supabase.functions.invoke('plato-land-series4-telegram',{body:form});
      if(error||!Array.isArray(data?.results))throw new Error();
      const status=data.results.find((item:{destination:string})=>item.destination===target)?.status;
      setDelivery(status==='sent'?'ارسال تصویر تأیید شد.':
        status==='failed'?'ارسال تصویر ناموفق بود.':
        status==='unconfigured'?'مقصد تلگرام تنظیم نشده است.':'وضعیت ارسال را در تاریخچه بررسی کن.');
      await onDelivery();
    }catch{setDelivery('ارسال تأیید نشد. قبل از تلاش دوباره، تاریخچه و مقصد تلگرام را بررسی کن.');}
    finally{setImageBusy(false);}
  }
  useEffect(()=>()=>{if(imageUrl)URL.revokeObjectURL(imageUrl);},[imageUrl]);
  async function previewImage(){
    if(!campaign||!imagePages||imageBusy)return;
    setImageBusy(true);setError('');setImageUrl('');
    try{
      const png=await series4PredictionPng(campaign.title,imageRows,imagePage);
      setImageBlob(png);
      setImageUrl(URL.createObjectURL(png));
    }
    catch(error){setError(error instanceof Error?error.message:'ساخت تصویر ناموفق بود.');}
    finally{setImageBusy(false);}
  }
  async function loadCampaigns(){
    if(!supabase||busy)return;
    setBusy(true);setError('');
    try{
      const {data,error}=await supabase.from('plato_land_prediction_campaigns')
        .select('id,title,status,campaign_type,questions,prize_rules,public_config,updated_at').eq('event_key','series4')
        .neq('status','archived').order('created_at',{ascending:false});
      if(error)throw error;
      setCampaigns(data??[]);
      setSelected('');setReports([]);setImagePage(0);resetImage();
    }catch{setError('دریافت فهرست پیش‌بینی‌های سری چهارم ناموفق بود.');}
    finally{setBusy(false);}
  }
  async function loadReport(id:string){
    const campaign=campaigns?.find(item=>item.id===id);
    setSelected(id);setReports([]);setError('');setImagePage(0);resetImage();
    setPrizeWinner(campaign?.public_config?.result_draft?.prize_winner_plato_id??'');setResultNotice('');
    if(!supabase||!campaign||busy)return;
    setBusy(true);
    try{
      const entriesQuery=supabase.from('plato_land_prediction_entries')
        .select('id,voter_plato_id,response').eq('campaign_id',campaign.id)
        .or('result_status.is.null,result_status.neq.disqualified').order('submitted_at');
      const isMatch=campaign.campaign_type==='match_predictions';
      const usesKnockout=isMatch||campaign.campaign_type==='champion';
      const [entries,groups,draw,knockout]=await Promise.all([
        entriesQuery,
        isMatch?supabase.from('plato_land_series4_group_match_results').select('match_id,player_a_plato_id,player_b_plato_id,score_a,score_b,result_status'):null,
        usesKnockout?supabase.from('plato_land_series4_knockout_draw').select('bracket').maybeSingle():null,
        usesKnockout?supabase.from('plato_land_series4_knockout_scores').select('match_id,score_a,score_b'):null,
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
          const id=question.match?.matchId??(campaign.campaign_type==='champion'?'R2-1':undefined);
          const actual=id?winners.get(id):undefined;
          const status=id&&excluded.has(id)?'حذف‌شده از امتیازدهی':
            !actual?'در انتظار ارزیابی':!prediction?'بدون پاسخ':
            normalize(prediction)===normalize(actual)?'درست':'نادرست';
          return {questionId:question.id,question:question.label,prediction,actual,status};
        });
        return {id:entry.id,player:entry.voter_plato_id,answers,correct:answers.filter(answer=>answer.status==='درست').length};
      }).sort((a,b)=>b.correct-a.correct||a.player.localeCompare(b.player)));
    }catch{setError('دریافت گزارش امتیازدهی سری چهارم ناموفق بود.');}
    finally{setBusy(false);}
  }
  return <details style={{marginTop:10}}>
    <summary>گزارش پیش‌بینی‌های سری چهارم</summary>
    <button type="button" disabled={busy||imageBusy} onClick={()=>void loadCampaigns()}>دریافت فهرست پیش‌بینی‌ها</button>
    {error&&<p role="alert">{error}</p>}
    {campaigns?.length===0&&<p>هنوز پیش‌بینی‌ای برای سری چهارم ثبت نشده است.</p>}
    {!!campaigns?.length&&<label>انتخاب پیش‌بینی <select value={selected} disabled={busy||imageBusy} onChange={event=>void loadReport(event.target.value)}>
      <option value="">انتخاب کن</option>
      {campaigns.map(campaign=><option key={campaign.id} value={campaign.id}>{campaign.title} · {campaign.status==='closed'?'بسته‌شده':campaign.status==='draft'?'پیش‌نویس':'منتشرشده'}</option>)}
    </select></label>}
    {selected&&!busy&&!error&&reports.length===0&&<p>پاسخی برای این پیش‌بینی ثبت نشده است.</p>}
    {resultReady&&<details>
      <summary>پیش‌نمایش نتیجه پیش‌بینی</summary>
      <p>نفرات برتر · {winners.join('، ')} · {reports[0].correct.toLocaleString('fa-IR')} پاسخ درست</p>
      <p>تعداد شرکت‌کنندگان · {reports.length.toLocaleString('fa-IR')}</p>
      {campaign.prize_rules?.description&&<p>جایزه · {campaign.prize_rules.description}</p>}
      {winners.length>1&&<label>برنده جایزه پس از قرعه‌کشی <select value={prizeWinner}
        disabled={busy||imageBusy} onChange={event=>setPrizeWinner(event.target.value)}>
        <option value="">انتخاب کن</option>{winners.map(winner=><option key={winner}>{winner}</option>)}
      </select></label>}
      <button type="button" disabled={busy||imageBusy||winners.length>1&&!winners.includes(prizeWinner)}
        onClick={()=>void saveResultDraft()}>ذخیره پیش‌نویس نتیجه</button>
      {publicEnabled&&campaign.status==='closed'&&<button type="button"
        disabled={busy||imageBusy||winners.length>1&&!winners.includes(prizeWinner)}
        onClick={()=>void saveResultDraft(true)}>انتشار نتیجه</button>}
      {resultNotice&&<p role="status">{resultNotice}</p>}
    </details>}
    {imagePages>0&&<div>
      {imagePages>1&&<label>صفحه تصویر <select disabled={imageBusy} value={imagePage} onChange={event=>{setImagePage(Number(event.target.value));resetImage();}}>
        {Array.from({length:imagePages},(_,i)=><option key={i} value={i}>{(i+1).toLocaleString('fa-IR')}</option>)}
      </select></label>}
      <button type="button" disabled={busy||imageBusy} onClick={()=>void previewImage()}>{imageBusy?'در حال ساخت…':'پیش‌نمایش تصویر PNG'}</button>
      {imageUrl&&<><img src={imageUrl} alt="تصویر گزارش پیش‌بینی سری چهارم" style={{display:'block',maxWidth:'100%'}}/>
        <a href={imageUrl} download={'plato-series4-predictions-'+(imagePage+1)+'.png'}>دانلود PNG</a>
        <label>مقصد تصویر <select value={destination} disabled={imageBusy||!!attempt}
          onChange={event=>setDestination(event.target.value as typeof destination)}>
          <option value="">انتخاب کن</option>
          {Object.entries(destinations).map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select></label>
        <button type="button" disabled={!destination||imageBusy||!!attempt} onClick={()=>void sendImage()}>
          تأیید و ارسال تصویر
        </button>
        {delivery&&<p role="status">{delivery}</p>}
      </>}
    </div>}
    {reports.map(report=><details key={report.id}>
      <summary><bdi>{report.player}</bdi>{campaigns?.find(item=>item.id===selected)?.campaign_type==='match_predictions'&&
        ' · '+report.correct.toLocaleString('fa-IR')+' پاسخ درست'}</summary>
      <ul>{report.answers.map((answer,index)=><li key={index}>{answer.question} · <bdi>{answer.prediction||'—'}</bdi>
        {answer.actual&&<> · برنده <bdi>{answer.actual}</bdi></>} · {answer.status}</li>)}</ul>
    </details>)}
  </details>;
}
