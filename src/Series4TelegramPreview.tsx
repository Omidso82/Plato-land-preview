import React,{useState} from 'react';
import {supabase} from './supabase';
import {resolveSeries4Matches,type buildSeries4Knockout} from './series4Knockout';
import Series4PredictionReport from './Series4PredictionReport';

type ReportKind='schedule'|'results'|'bracket'|'knockout'|'ranking'|'pots'|'groups';

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
  const [group,setGroup]=useState('ALL');
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
    const {players:participants,byId:scored}=resolveSeries4Matches(bracket,results.data??[]);
    return [...participants].flatMap(([id,[a,b]])=>{
      const score=scored.get(id);
      if(kind==='knockout'&&(!a||!b||!score))return [];
      return [id+' · '+(a??'در انتظار صعود')+' — '+(b??'در انتظار صعود')+
        (score?' · '+score.score_a+'–'+score.score_b:'')];
    }).join('\n');
  }
  async function drawReport() {
    if(!supabase)return '';
    const {data,error}=await supabase.from('plato_land_series4_seeding_draws')
      .select('ranking_snapshot,pots_snapshot,groups_snapshot').maybeSingle();
    if(error)throw error;
    if(!data)return '';
    type Player={plato_id:string;games_played:number|null;games_won:number|null};
    if(kind==='ranking')return (data.ranking_snapshot as Player[]).map((player,index)=>{
      const percent=player.games_played&&player.games_won!==null
        ? (100*player.games_won/player.games_played).toLocaleString('fa-IR',{maximumFractionDigits:2})+'٪'
        : '—';
      return (index+1).toLocaleString('fa-IR')+'. '+player.plato_id+' · '+percent;
    }).join('\n');
    if(kind==='pots')return (data.pots_snapshot as Player[][]).map((players,index)=>
      'سید '+(index+1).toLocaleString('fa-IR')+': '+players.map(player=>player.plato_id).join('، ')).join('\n');
    return (data.groups_snapshot as {name:string;players:Player[]}[]).map(group=>
      'گروه '+group.name+': '+group.players.map(player=>player.plato_id).join('، ')).join('\n');
  }
  async function generate(){
    if(!supabase||busy||(isGroupReport&&!date))return;
    setBusy(true);setError('');setPreview('');setCopied(false);setSent(false);setReceipt('');
    try{
      if(!isGroupReport){
        const titles={bracket:'براکت حذفی',knockout:'نتایج حذفی',ranking:'رتبه‌بندی بازیکنان',pots:'سیدبندی',groups:'قرعه‌کشی گروهی'};
        const text=kind==='bracket'||kind==='knockout'?await knockoutReport():await drawReport();
        if(!text){setError('برای این بخش گزارشی وجود ندارد.');return;}
        setPreview('PLATO LAND | سری چهارم تخته‌نرد\n'+titles[kind]+'\n\n'+text);
        return;
      }
      const {data,error}=await supabase.from('plato_land_series4_group_match_results')
        .select('match_date,group_name,player_a_plato_id,player_b_plato_id,result_status,score_a,score_b')
        .eq('match_date',date).order('group_name').order('match_no');
      if(error)throw error;
      const rows=(data??[]) as Row[];
      const selected=rows.filter(row=>(group==='ALL'||row.group_name===group)&&(kind!=='results'||row.result_status!=='pending'));
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
  const [targets,setTargets]=useState<string[]>([]);
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState(false);
  const [receipt,setReceipt]=useState('');
  const [history,setHistory]=useState<Array<{request_id:string;destination:string;status:string;created_at:string}>>([]);
  const destinationLabel=(value:string)=>value==='test_group'?'گروه آزمایشی تلگرام':'کانال اصلی تلگرام';
  const statusLabel=(value:string)=>({
    sent:'ارسال شد',failed:'ناموفق',sending:'در حال ارسال',uncertain:'نیازمند بررسی',unconfigured:'تنظیم نشده',
  }[value]??value);
  async function refreshHistory(){
    if(!supabase)return;
    try{
      const {data,error}=await supabase.from('plato_land_series4_telegram_delivery_history')
        .select('request_id,destination,status,created_at').order('created_at',{ascending:false}).limit(20);
      if(error)throw error;
      setHistory(data??[]);
    }catch{setError('دریافت تاریخچه ارسال‌ها ناموفق بود.');}
  }
  async function send(){
    if(!supabase||sending||sent||!preview||!targets.length)return;
    if(!window.confirm('این گزارش سری چهارم به '+targets.map(destinationLabel).join(' و ')+' ارسال شود؟'))return;
    setSending(true);setSent(true);setError('');setReceipt('');
    try{
      const {data,error}=await supabase.functions.invoke('plato-land-series4-telegram',{
        body:{request_id:crypto.randomUUID(),destinations:targets,message:preview},
      });
      if(error||!Array.isArray(data?.results))throw new Error();
      setReceipt(data.results.map((row:{destination:string;status:string})=>destinationLabel(row.destination)+' · '+statusLabel(row.status)).join(' | '));
      await refreshHistory();
    }catch{setError('ارسال تأیید نشد. قبل از ساخت پیش‌نمایش دوباره، تاریخچه و مقصد تلگرام را بررسی کن.');}
    finally{setSending(false);}
  }
  async function copy(){
    if(!preview)return;
    try{await navigator.clipboard.writeText(preview);setCopied(true);}
    catch{setError('کپی انجام نشد. متن داخل پیش‌نمایش قابل انتخاب است.');}
  }
  return <details dir="rtl" style={{marginTop:14,padding:14,border:'1px solid #8c6a34',borderRadius:13,color:'#f2ead8'}}>
    <summary style={{cursor:'pointer',color:'#e4c77e'}}>مرکز اطلاع‌رسانی تلگرام سری چهارم</summary>
    <div style={{display:'grid',gap:9,marginTop:10}}>
      <label>نوع گزارش <select value={kind} disabled={busy||sending} onChange={event=>{setKind(event.target.value as typeof kind);setPreview('');}}>
        <option value="ranking">رتبه‌بندی بازیکنان</option><option value="pots">سیدبندی</option><option value="groups">قرعه‌کشی گروهی</option>
        <option value="schedule">برنامه گروهی</option><option value="results">نتایج گروهی</option>
        <option value="bracket">براکت حذفی</option><option value="knockout">نتایج حذفی</option>
      </select></label>
      {isGroupReport&&<label>تاریخ <input type="date" value={date} disabled={busy||sending} onChange={event=>{setDate(event.target.value);setPreview('');}}/></label>}
      {isGroupReport&&<label>گروه <select value={group} disabled={busy||sending} onChange={event=>{setGroup(event.target.value);setPreview('');}}>
        <option value="ALL">همه گروه‌ها</option>
        {Array.from('ABCDEFGHIJKL').map(letter=><option key={letter} value={letter}>گروه {letter}</option>)}
      </select></label>}
      <button type="button" disabled={busy||sending||(isGroupReport&&!date)} onClick={()=>void generate()}>{busy?'در حال دریافت…':'ساخت پیش‌نمایش'}</button>
      {error&&<span role="alert">{error}</span>}
      {preview&&<><textarea aria-label="متن اعلان" rows={10} readOnly value={preview}/>
        <button type="button" onClick={()=>void copy()}>{copied?'کپی شد':'کپی متن'}</button>
        <fieldset><legend>مقصد ارسال</legend>
          {['test_group','main_channel'].map(target=><label key={target} style={{display:'block'}}>
            <input type="checkbox" disabled={sending||sent} checked={targets.includes(target)}
              onChange={()=>setTargets(current=>current.includes(target)?current.filter(item=>item!==target):[...current,target])}/>
            {destinationLabel(target)}
          </label>)}
        </fieldset>
        <button type="button" disabled={sending||sent||!targets.length} onClick={()=>void send()}>{sending?'در حال ارسال…':'تأیید و ارسال'}</button>
      </>}
      {receipt&&<span role="status">{receipt}</span>}
      <Series4PredictionReport />
      <details><summary>تاریخچه ارسال‌ها</summary>
        <button type="button" onClick={()=>void refreshHistory()}>تازه‌سازی تاریخچه</button>
        <ul>{history.map(row=><li key={row.request_id+row.destination}>
          {destinationLabel(row.destination)} · {statusLabel(row.status)} · {new Date(row.created_at).toLocaleString('fa-IR')}
        </li>)}</ul>
      </details>
    </div>
  </details>;
}
