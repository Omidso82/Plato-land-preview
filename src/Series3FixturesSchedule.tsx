import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type Fixture = {
  id: string; group: string; round: number; match_no: number;
  player_a: { registration_id: string; plato_id: string };
  player_b: { registration_id: string; plato_id: string };
  time: string; timezone: string;
};
type Day = { round: number; date: string; persian_date: string; time: string; matches: Fixture[] };
type Knockout = { stage: string; title: string; date: string; persian_date: string; time: string; match_count: number; matches?: Array<{id:string;label_a:string;label_b:string}> };
type Snapshot = { timezone: string; group_stage: { days: Day[]; match_count: number; groups: number; matches_per_group: number }; knockout: Knockout[] };

const fa = (n:number) => n.toLocaleString('fa-IR');
const card: React.CSSProperties = { border:'1px solid #59472a',borderRadius:10,padding:11,background:'#101112',minWidth:0 };
const muted: React.CSSProperties = { color:'#c9c0b0',fontSize:12,lineHeight:1.8 };

export default function Series3FixturesSchedule() {
  const [snapshot,setSnapshot] = useState<Snapshot|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [dayIndex,setDayIndex] = useState(0);
  const [group,setGroup] = useState('ALL');
  const [expanded,setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) { setError('اتصال به دیتابیس اصلی در دسترس نیست.'); setLoading(false); return; }
      setLoading(true); setError('');
      const {data,error:readError} = await supabase.from('plato_land_series3_group_fixtures')
        .select('schedule_snapshot').eq('event_key','series3').maybeSingle();
      if (!active) return;
      if (readError) setError('دریافت برنامه مسابقات ناموفق بود: '+readError.message);
      else if (!data?.schedule_snapshot) setError('برنامه مسابقات هنوز در دیتابیس ثبت نشده است.');
      else setSnapshot(data.schedule_snapshot as Snapshot);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  const day = snapshot?.group_stage.days[dayIndex];
  const matches = useMemo(() => (day?.matches || []).filter(m => group==='ALL' || m.group===group),[day,group]);

  return <section dir="rtl" style={{marginTop:14,padding:12,border:'1px solid #8c6a34',borderRadius:13,background:'linear-gradient(145deg,#211b12,#111214)',color:'#f2ead8'}}>
    <button type="button" onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded}
      style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap',textAlign:'right',background:'transparent',border:0,color:'inherit',padding:4,cursor:'pointer'}}>
      <span><strong style={{display:'block',margin:0,color:'#f3dfad',fontSize:16}}>برنامه رسمی مسابقات سری سوم</strong><span style={{...muted,display:'block',marginTop:3}}>برای مشاهده یا بستن برنامه لمس کن · ساعت ۲۱:۰۰ تهران</span></span>
      <span style={{display:'flex',alignItems:'center',gap:8,color:'#e4c77e',fontSize:12,fontWeight:800}}>{snapshot ? fa(snapshot.group_stage.match_count)+' مسابقه' : 'برنامه مسابقات'} <span aria-hidden="true">{expanded?'▲':'▼'}</span></span>
    </button>
    {expanded&&<>
    {loading?<p style={muted}>در حال دریافت برنامه…</p>:error?<p role="alert" style={{color:'#efaaaa',fontSize:12}}>{error}</p>:snapshot&&<>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:12}}>
        {snapshot.group_stage.days.map((d,i)=><button key={d.date} type="button" onClick={()=>{setDayIndex(i);setGroup('ALL');}} style={{border:'1px solid '+(dayIndex===i?'#e4c77e':'#59472a'),borderRadius:8,padding:'8px 10px',background:dayIndex===i?'#3a2d17':'#171717',color:dayIndex===i?'#f5dfad':'#d8cbb2',cursor:'pointer',fontSize:12}}>{d.persian_date}</button>)}
      </div>
      {day&&<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap',marginTop:12}}>
          <strong style={{color:'#e4c77e'}}>دور {fa(day.round)} · {day.persian_date}</strong>
          <span style={muted}>{fa(matches.length)} مسابقه · ۲۱:۰۰</span>
        </div>
        <div style={{display:'flex',gap:6,overflowX:'auto',padding:'9px 0'}}>
          <button type="button" onClick={()=>setGroup('ALL')} style={{...filterStyle(group==='ALL')}}>همه گروه‌ها</button>
          {'ABCDEFGHIJKL'.split('').map(g=><button key={g} type="button" onClick={()=>setGroup(g)} style={filterStyle(group===g)}>گروه {g}</button>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,230px),1fr))',gap:8}}>
          {matches.map(m=><article key={m.id} style={card}>
            <div style={{display:'flex',justifyContent:'space-between',color:'#d4b46a',fontSize:11}}><strong>گروه {m.group}</strong><span>بازی {fa(m.match_no)} · ۲۱:۰۰</span></div>
            <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto minmax(0,1fr)',gap:6,alignItems:'center',marginTop:10}}>
              <strong dir="ltr" style={{fontSize:13,overflowWrap:'anywhere',textAlign:'center'}}>{m.player_a.plato_id}</strong>
              <span style={{color:'#e4c77e',fontWeight:900}}>VS</span>
              <strong dir="ltr" style={{fontSize:13,overflowWrap:'anywhere',textAlign:'center'}}>{m.player_b.plato_id}</strong>
            </div>
          </article>)}
        </div>
      </>}
      <div style={{marginTop:16,borderTop:'1px solid #4d4028',paddingTop:12}}>
        <strong style={{color:'#e4c77e'}}>تقویم مراحل حذفی</strong>
        <div style={{display:'grid',gap:7,marginTop:8}}>
          {snapshot.knockout.map(k=><div key={k.stage} style={{...card,display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
            <strong style={{fontSize:13}}>{k.title}</strong><span style={muted}>{k.persian_date} · ۲۱:۰۰ · {fa(k.match_count)} مسابقه</span>
            {k.matches&&<div style={{width:'100%',...muted}}>رده‌بندی: {k.matches[0].label_a} مقابل {k.matches[0].label_b}<br/>فینال: {k.matches[1].label_a} مقابل {k.matches[1].label_b}</div>}
          </div>)}
        </div>
      </div>
    </>}
    </>}
  </section>;
}

function filterStyle(active:boolean): React.CSSProperties {
  return {flexShrink:0,border:'1px solid '+(active?'#e4c77e':'#51452d'),borderRadius:7,padding:'6px 9px',background:active?'#3a2d17':'#171717',color:active?'#f3dfad':'#c9c0b0',fontSize:11,cursor:'pointer'};
}
