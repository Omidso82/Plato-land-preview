import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime, formatIranJalaliDateInput, formatIranClockInput, iranJalaliDateTimeToIso } from './iranDate';
import { CalendarClock, RefreshCw, Save, Trophy, Plus, Pencil, X, ShieldCheck } from 'lucide-react';

type Section='schedule'|'results';
type Tournament={id:string;title:string;permissions:string[];participation:string};
type Participant={player_id:string;display_name:string;plato_id:string;team_name:string|null;registration_type:string};
type Match={id:string;tournament_id:string;round_name:string|null;player_one_id:string|null;player_two_id:string|null;player_one_score:number|null;player_two_score:number|null;winner_id:string|null;scheduled_at:string|null;status:string};
type Standing={id?:string;tournament_id:string;player_id:string;points:number;wins:number;losses:number;score_for:number;score_against:number;placement:number|null};
const blankStanding=(tournament_id:string,player_id:string):Standing=>({tournament_id,player_id,points:0,wins:0,losses:0,score_for:0,score_against:0,placement:null});

export default function TournamentManagerOperations({section,owner=false}:{section:Section;owner?:boolean}){
 const [tournaments,setTournaments]=useState<Tournament[]>([]);
 const [selectedId,setSelectedId]=useState('');
 const [participants,setParticipants]=useState<Participant[]>([]);
 const [matches,setMatches]=useState<Match[]>([]);
 const [standings,setStandings]=useState<Record<string,Standing>>({});
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [roundName,setRoundName]=useState('');
 const [playerOne,setPlayerOne]=useState('');
 const [playerTwo,setPlayerTwo]=useState('');
 const [scheduleDate,setScheduleDate]=useState('');
 const [scheduleTime,setScheduleTime]=useState('20:00');
 const [editingMatchId,setEditingMatchId]=useState('');
 const [matchDrafts,setMatchDrafts]=useState<Record<string,{score1:string;score2:string;winnerId:string}>>({});
 const [standingDrafts,setStandingDrafts]=useState<Record<string,Standing>>({});

 const selected=tournaments.find(t=>t.id===selectedId);
 const canUse=!!selected&&(owner||selected.permissions.includes(section));
 const players=useMemo(()=>participants.filter(p=>p.registration_type==='individual'),[participants]);
 const playerLabel=(id:string|null)=>{if(!id)return '—';const p=participants.find(x=>x.player_id===id);return p?((p.display_name||'بازیکن')+' · '+(p.plato_id||'')):id.slice(0,8);};

 const loadTournaments=useCallback(async()=>{
  if(!supabase){setError('اتصال پایگاه داده برقرار نیست.');setLoading(false);return;}
  setLoading(true);setError('');
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user)throw new Error('برای دسترسی به این بخش وارد حساب مدیریت شوید.');
   let next:Tournament[]=[];
   if(owner){
    const {data,error:queryError}=await supabase.from('tournaments').select('id,title,platform_settings,game_type,series_name').order('created_at',{ascending:false});
    if(queryError)throw queryError;
    next=(data||[]).map((t:any)=>({id:t.id,title:t.title,permissions:['registrations','groups','schedule','results'],participation:t.platform_settings?.participation||'individual'}));
   }else{
    const {data:assigned,error:assignedError}=await supabase.from('tournament_manager_access').select('tournament_id,permissions_configured').eq('user_id',user.id);
    if(assignedError)throw assignedError;
    const ids=(assigned||[]).map((a:any)=>a.tournament_id);
    const configured=(assigned||[]).filter((a:any)=>a.permissions_configured).map((a:any)=>a.tournament_id);
    let permissionRows:any[]=[];
    if(configured.length){
     const {data,error:permissionError}=await supabase.from('tournament_manager_section_permissions').select('tournament_id,permission_key').eq('user_id',user.id).in('tournament_id',configured);
     if(permissionError)throw permissionError;permissionRows=data||[];
    }
    const {data,error:queryError}=ids.length?await supabase.from('tournaments').select('id,title,platform_settings').in('id',ids):{data:[],error:null};
    if(queryError)throw queryError;
    next=(data||[]).map((t:any)=>{
     const assignment=(assigned||[]).find((a:any)=>a.tournament_id===t.id);
     return {id:t.id,title:t.title,participation:t.platform_settings?.participation||'individual',permissions:assignment?.permissions_configured?permissionRows.filter(p=>p.tournament_id===t.id).map(p=>p.permission_key):['registrations','groups','schedule','results']};
    }).filter(t=>t.permissions.includes(section));
   }
   setTournaments(next);
   if(!selectedId&&next.length)setSelectedId(next[0].id);
   if(selectedId&&!next.some(t=>t.id===selectedId))setSelectedId(next[0]?.id||'');
  }catch(e:any){setError(e?.message||'دریافت فهرست مسابقات ناموفق بود.');}
  finally{setLoading(false);}
 },[owner,section,selectedId]);

 useEffect(()=>{void loadTournaments();},[loadTournaments]);

 const loadSelected=useCallback(async()=>{
  if(!supabase||!selectedId||!canUse)return;
  setBusy('load');setError('');setNotice('');
  try{
   const {data:regRows,error:regError}=await supabase.from('registrations')
    .select('player_id,display_name,plato_id,team_name,registration_type')
    .eq('tournament_id',selectedId).in('status',['approved','registered']).eq('is_reserve',false);
   if(regError)throw regError;
   const people=(regRows||[]) as Participant[];setParticipants(people);
   const {data:matchRows,error:matchError}=await supabase.from('matches')
    .select('id,tournament_id,round_name,player_one_id,player_two_id,player_one_score,player_two_score,winner_id,scheduled_at,status')
    .eq('tournament_id',selectedId).order('scheduled_at',{ascending:true,nullsFirst:false});
   if(matchError)throw matchError;
   const loadedMatches=(matchRows||[]) as Match[];setMatches(loadedMatches);
   setMatchDrafts(Object.fromEntries(loadedMatches.map(m=>[m.id,{score1:m.player_one_score===null?'':String(m.player_one_score),score2:m.player_two_score===null?'':String(m.player_two_score),winnerId:m.winner_id||''}])));
   if(section==='results'){
    const {data:resultRows,error:resultError}=await supabase.from('tournament_results')
     .select('id,tournament_id,player_id,points,wins,losses,score_for,score_against,placement').eq('tournament_id',selectedId);
    if(resultError)throw resultError;
    const saved:Record<string,Standing>={};
    (resultRows||[]).forEach((r:any)=>saved[r.player_id]=r);
    const drafts:Record<string,Standing>={};
    people.filter(p=>p.registration_type==='individual').forEach(p=>drafts[p.player_id]=saved[p.player_id]||blankStanding(selectedId,p.player_id));
    setStandings(saved);setStandingDrafts(drafts);
   }else{setStandings({});setStandingDrafts({});}
  }catch(e:any){setError(e?.message||'بارگذاری برنامه و نتایج مسابقه ناموفق بود.');}
  finally{setBusy('');}
 },[selectedId,canUse,section]);

 useEffect(()=>{void loadSelected();},[loadSelected]);

 function editSchedule(m:Match){
  setEditingMatchId(m.id);setRoundName(m.round_name||'');
  setPlayerOne(m.player_one_id||'');setPlayerTwo(m.player_two_id||'');
  setScheduleDate(m.scheduled_at?formatIranJalaliDateInput(m.scheduled_at):'');
  setScheduleTime(m.scheduled_at?formatIranClockInput(m.scheduled_at):'20:00');
  setNotice('');setError('');
 }
 function resetSchedule(){setEditingMatchId('');setRoundName('');setPlayerOne('');setPlayerTwo('');setScheduleDate('');setScheduleTime('20:00');}

 async function saveSchedule(e:React.FormEvent){
  e.preventDefault();if(!supabase||!selectedId||!canUse)return;
  if(!playerOne||!playerTwo||playerOne===playerTwo){setError('برای مسابقه دو بازیکن متفاوت انتخاب کن.');return;}
  if(!scheduleDate||!iranJalaliDateTimeToIso(scheduleDate,scheduleTime)){setError('تاریخ شمسی یا ساعت ایران معتبر نیست.');return;}
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError||!user){setError(userError?.message||'نشست مدیریت معتبر نیست.');return;}
  setBusy('schedule');setError('');setNotice('');
  try{
   const payload={tournament_id:selectedId,round_name:roundName.trim()||null,player_one_id:playerOne,player_two_id:playerTwo,scheduled_at:iranJalaliDateTimeToIso(scheduleDate,scheduleTime),status:'scheduled',reported_by:user.id,updated_at:new Date().toISOString()};
   const result=editingMatchId
    ? await supabase.from('matches').update(payload).eq('id',editingMatchId)
    : await supabase.from('matches').insert(payload);
   if(result.error)throw result.error;
   resetSchedule();await loadSelected();setNotice('برنامه مسابقه با موفقیت ذخیره شد.');
  }catch(e:any){setError(e?.message||'ذخیره برنامه مسابقه ناموفق بود.');}
  finally{setBusy('');}
 }

 async function saveMatchResult(m:Match){
  if(!supabase||!selectedId||!canUse)return;
  const draft=matchDrafts[m.id];const score1=Number(draft?.score1),score2=Number(draft?.score2),winnerId=draft?.winnerId||'';
  if(!Number.isInteger(score1)||score1<0||!Number.isInteger(score2)||score2<0){setError('نتیجه هر دو بازیکن باید عدد صحیح صفر یا بیشتر باشد.');return;}
  if(!winnerId||![m.player_one_id,m.player_two_id].includes(winnerId)){setError('برنده این مسابقه را مشخص کن.');return;}
  setBusy(m.id);setError('');setNotice('');
  try{
   const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('نشست مدیریت معتبر نیست.');
   const {error:updateError}=await supabase.from('matches').update({player_one_score:score1,player_two_score:score2,winner_id:winnerId,status:'completed',reported_by:user.id,updated_at:new Date().toISOString()}).eq('id',m.id);
   if(updateError)throw updateError;
   await loadSelected();setNotice('نتیجه بازی ذخیره شد. جدول امتیازات بر اساس قوانین اختصاصی مسابقه جداگانه تنظیم می‌شود.');
  }catch(e:any){setError(e?.message||'ثبت نتیجه بازی ناموفق بود.');}
  finally{setBusy('');}
 }

 async function saveStanding(playerId:string){
  if(!supabase||!selectedId||!canUse)return;
  const draft=standingDrafts[playerId];if(!draft)return;
  const numeric=['points','wins','losses','score_for','score_against'] as const;
  for(const key of numeric){if(!Number.isFinite(Number(draft[key]))||Number(draft[key])<0){setError('امتیازها و آمار باید عدد صفر یا بیشتر باشند.');return;}}
  if(draft.placement!==null&&(!Number.isInteger(Number(draft.placement))||Number(draft.placement)<1)){setError('رتبه نهایی باید عدد صحیح مثبت باشد.');return;}
  setBusy(playerId);setError('');setNotice('');
  try{
   const payload={tournament_id:selectedId,player_id:playerId,points:Number(draft.points),wins:Number(draft.wins),losses:Number(draft.losses),score_for:Number(draft.score_for),score_against:Number(draft.score_against),placement:draft.placement===null?null:Number(draft.placement),updated_at:new Date().toISOString()};
   const {error:saveError}=await supabase.from('tournament_results').upsert(payload,{onConflict:'tournament_id,player_id'});
   if(saveError)throw saveError;
   await loadSelected();setNotice('جدول نتایج این بازیکن ذخیره شد.');
  }catch(e:any){setError(e?.message||'ذخیره جدول نتایج ناموفق بود.');}
  finally{setBusy('');}
 }

 return <section className="panel tournament-operations-panel">
  <div className="admin-toolbar"><div><span className="section-kicker">{section==='schedule'?'زمان‌بندی مسابقات':'ثبت نتایج مسابقات'}</span><h2>{section==='schedule'?'برنامه و زمان‌بندی':'مدیریت نتایج و جدول'}</h2><p>همه تاریخ‌ها شمسی و ساعت‌ها بر اساس منطقه زمانی ایران هستند.</p></div>{section==='schedule'?<CalendarClock size={23}/>:<Trophy size={23}/>}</div>
  {loading?<p className="empty-state">در حال دریافت مسابقات مجاز…</p>:error&&!tournaments.length?<p className="auth-inline-error" role="alert">{error}</p>:!tournaments.length?<p className="info-note"><ShieldCheck size={16}/> هیچ مسابقه‌ای با دسترسی این بخش به حساب شما واگذار نشده است.</p>:<>
   <div className="admin-toolbar operations-toolbar"><label>انتخاب مسابقه<select value={selectedId} onChange={e=>{setSelectedId(e.target.value);resetSchedule();}}>{tournaments.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label><button type="button" className="outline-button" onClick={()=>void loadSelected()} disabled={busy==='load'}><RefreshCw size={15}/> بروزرسانی</button></div>
   {selected?.participation!=='individual'&&<p className="info-note">این ابزار در حال حاضر برای ثبت برنامه و نتایج بازیکنان انفرادی طراحی شده است؛ مدیریت نتایج تیمی تا تکمیل ساختار اختصاصی تیم‌ها غیرفعال است.</p>}
   {section==='schedule'?<>
    <form className="panel form-panel operations-form" onSubmit={saveSchedule}>
     <div className="section-heading"><h3>{editingMatchId?'ویرایش برنامه بازی':'افزودن بازی به برنامه'}</h3>{editingMatchId&&<button type="button" className="outline-button" onClick={resetSchedule}><X size={14}/> انصراف</button>}</div>
     <label>مرحله یا گروه<input value={roundName} onChange={e=>setRoundName(e.target.value)} placeholder="مثلاً مرحله گروهی، گروه A یا نیمه‌نهایی"/></label>
     <div className="form-grid"><label>بازیکن اول<select required value={playerOne} onChange={e=>setPlayerOne(e.target.value)}><option value="">انتخاب بازیکن</option>{players.map(p=><option key={p.player_id} value={p.player_id}>{p.display_name} · {p.plato_id}</option>)}</select></label><label>بازیکن دوم<select required value={playerTwo} onChange={e=>setPlayerTwo(e.target.value)}><option value="">انتخاب بازیکن</option>{players.map(p=><option key={p.player_id} value={p.player_id}>{p.display_name} · {p.plato_id}</option>)}</select></label></div>
     <div className="form-grid"><label>تاریخ شمسی<input required dir="ltr" inputMode="numeric" placeholder="۱۴۰۵/۰۸/۱۴" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))))}/></label><label>ساعت ایران<input required dir="ltr" inputMode="numeric" placeholder="۲۰:۰۰" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)}/></label></div>
     <button type="submit" className="gold-button" disabled={busy==='schedule'||players.length<2}><Save size={15}/> {busy==='schedule'?'در حال ذخیره…':editingMatchId?'ذخیره تغییرات برنامه':'افزودن به برنامه'}</button>
     {players.length<2&&<p className="form-footnote">برای برنامه‌ریزی بازی، حداقل دو بازیکن انفرادی تأییدشده لازم است.</p>}
    </form>
    <div className="operations-list"><h3>بازی‌های برنامه‌ریزی‌شده</h3>{matches.length?matches.map(m=><article className="operation-match-row" key={m.id}><div><strong>{m.round_name||'بازی'}</strong><span>{playerLabel(m.player_one_id)} در برابر {playerLabel(m.player_two_id)}</span><small>{m.scheduled_at?formatIranDateTime(m.scheduled_at):'زمان تعیین نشده'} · {m.status==='completed'?'انجام‌شده':'برنامه‌ریزی‌شده'}</small></div><button type="button" className="outline-button" onClick={()=>editSchedule(m)}><Pencil size={14}/> ویرایش</button></article>):<p className="empty-state">هنوز بازی‌ای در برنامه ثبت نشده است.</p>}</div>
   </>:<>
    <div className="operations-list"><h3>ثبت نتیجه بازی‌ها</h3>{matches.length?matches.map(m=>{const d=matchDrafts[m.id]||{score1:'',score2:'',winnerId:''};return <article className="operation-result-row" key={m.id}><div className="operation-match-title"><strong>{m.round_name||'بازی'}</strong><small>{playerLabel(m.player_one_id)} در برابر {playerLabel(m.player_two_id)}</small><small>{m.scheduled_at?formatIranDateTime(m.scheduled_at):'بدون زمان‌بندی'}</small></div><div className="form-grid"><label>امتیاز بازیکن اول<input type="number" min="0" step="1" value={d.score1} onChange={e=>setMatchDrafts(old=>({...old,[m.id]:{...d,score1:e.target.value}}))}/></label><label>امتیاز بازیکن دوم<input type="number" min="0" step="1" value={d.score2} onChange={e=>setMatchDrafts(old=>({...old,[m.id]:{...d,score2:e.target.value}}))}/></label></div><label>برنده<select value={d.winnerId} onChange={e=>setMatchDrafts(old=>({...old,[m.id]:{...d,winnerId:e.target.value}}))}><option value="">انتخاب برنده</option><option value={m.player_one_id||''}>{playerLabel(m.player_one_id)}</option><option value={m.player_two_id||''}>{playerLabel(m.player_two_id)}</option></select></label><button type="button" className="gold-button" disabled={busy===m.id} onClick={()=>void saveMatchResult(m)}><Save size={14}/> {busy===m.id?'در حال ذخیره…':'ذخیره نتیجه بازی'}</button></article>;}):<p className="empty-state">برای این مسابقه هنوز بازی‌ای ثبت نشده است. ابتدا برنامه بازی‌ها را در بخش زمان‌بندی بساز.</p>}</div>
    <div className="operations-list"><h3>جدول امتیازات و رتبه‌بندی</h3><p className="form-footnote">امتیاز و رتبه به‌صورت دستی و مطابق قوانین همین مسابقه وارد می‌شود؛ هیچ فرمول عمومی یا امتیاز پیش‌فرضی اعمال نمی‌شود.</p>{players.length?players.map(p=>{const d=standingDrafts[p.player_id]||blankStanding(selectedId,p.player_id);return <article className="standing-editor-row" key={p.player_id}><div><strong>{p.display_name}</strong><small>{p.plato_id}</small></div><div className="standing-fields">{([['points','امتیاز'],['wins','برد'],['losses','باخت'],['score_for','امتیاز گرفته'],['score_against','امتیاز از دست‌رفته'],['placement','رتبه']] as const).map(([key,label])=><label key={key}>{label}<input type="number" min={key==='placement'?'1':'0'} step="1" value={d[key]??''} onChange={e=>setStandingDrafts(old=>({...old,[p.player_id]:{...d,[key]:e.target.value===''?(key==='placement'?null:0):Number(e.target.value)}}))}/></label>)}</div><button type="button" className="outline-button" disabled={busy===p.player_id} onClick={()=>void saveStanding(p.player_id)}><Save size={14}/> ذخیره جدول</button></article>;}):<p className="empty-state">بازیکن انفرادی تأییدشده‌ای برای ثبت جدول وجود ندارد.</p>}</div>
   </>}
  </>}
  {error&&<p className="auth-inline-error" role="alert">{error}</p>}{notice&&<p className="success-note" role="status">{notice}</p>}
 </section>;
}
