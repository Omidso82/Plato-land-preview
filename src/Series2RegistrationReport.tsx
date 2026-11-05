import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type RequestRow = { id:string; plato_id:string; created_at:string; games_played:number|null; games_won:number|null };
type Draft = { gamesPlayed:string; gamesWon:string };

export default function Series2RegistrationReport() {
  const [rows,setRows]=useState<RequestRow[]>([]);
  const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [saving,setSaving]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [updatedAt,setUpdatedAt]=useState<Date|null>(null);
  const [showWinRateReport,setShowWinRateReport]=useState(false);

  const load=useCallback(async()=>{
    if(!supabase){setError('اتصال به پایگاه داده برقرار نیست.');setLoading(false);return;}
    setLoading(true);setError('');setNotice('');
    const {data,error:queryError}=await supabase.functions.invoke('plato-land-series2-registration-report',{body:{}});
    if(queryError){setError('دریافت گزارش ناموفق بود: '+queryError.message);setRows([]);}
    else{
      const next=(data?.requests||[]) as RequestRow[];
      setRows(next);
      setDrafts(Object.fromEntries(next.map(row=>[row.id,{gamesPlayed:row.games_played==null?'':String(row.games_played),gamesWon:row.games_won==null?'':String(row.games_won)}])));
      setUpdatedAt(new Date());
    }
    setLoading(false);
  },[]);
  useEffect(()=>{void load();},[load]);

  const updateDraft=(id:string,key:keyof Draft,value:string)=>{
    if(!/^\d*$/.test(value))return;
    setDrafts(old=>({...old,[id]:{...(old[id]||{gamesPlayed:'',gamesWon:''}),[key]:value}}));
  };
  const saveStats=async(row:RequestRow)=>{
    if(!supabase||saving)return;
    const draft=drafts[row.id]||{gamesPlayed:'',gamesWon:''};
    const gamesPlayed=draft.gamesPlayed===''?0:Number(draft.gamesPlayed);
    const gamesWon=draft.gamesWon===''?0:Number(draft.gamesWon);
    if(!Number.isSafeInteger(gamesPlayed)||!Number.isSafeInteger(gamesWon)||gamesPlayed<0||gamesWon<0||gamesWon>gamesPlayed){
      setError('برای '+row.plato_id+'، تعداد برد باید عدد صحیح و کمتر یا مساوی تعداد بازی باشد.');return;
    }
    setSaving(row.id);setError('');setNotice('');
    const {data,error:saveError}=await supabase.functions.invoke('plato-land-series2-registration-report',{body:{action:'save_stats',requestId:row.id,gamesPlayed,gamesWon}});
    if(saveError||data?.error)setError('ذخیره آمار '+row.plato_id+' ناموفق بود: '+(data?.error||saveError?.message||'خطای نامشخص'));
    else{
      setRows(old=>old.map(item=>item.id===row.id?{...item,games_played:gamesPlayed,games_won:gamesWon}:item));
      setNotice('آمار '+row.plato_id+' با موفقیت ذخیره شد.');
    }
    setSaving(null);
  };

  const capacity=48,remaining=Math.max(0,capacity-rows.length);
  const fa=(value:number)=>value.toLocaleString('fa-IR');
  const date=(value:string)=>new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Copenhagen'}).format(new Date(value));
  const winRateRows=useMemo(()=>rows.map(row=>{
    const played=row.games_played,won=row.games_won;
    const hasRate=played!==null&&won!==null&&played>0&&won>=0&&won<=played;
    return {...row,hasRate,rate:hasRate?(won!/played!*100):null};
  }).sort((a,b)=>{
    if(a.hasRate!==b.hasRate)return a.hasRate?-1:1;
    if(a.rate!==null&&b.rate!==null&&a.rate!==b.rate)return b.rate-a.rate;
    // When win rates tie, fewer games ranks higher; then more wins; finally Plato ID.
    if(a.games_played!==null&&b.games_played!==null&&a.games_played!==b.games_played)return a.games_played-b.games_played;
    if(a.games_won!==null&&b.games_won!==null&&a.games_won!==b.games_won)return b.games_won-a.games_won;
    return a.plato_id.localeCompare(b.plato_id,'en',{sensitivity:'base'});
  }),[rows]);

  return <section dir="rtl" aria-labelledby="series2-report-title" style={{marginTop:28,border:'1px solid #705b31',borderRadius:14,padding:18,background:'#171819'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
      <div><h2 id="series2-report-title" style={{margin:'0 0 6px',color:'#f6e8c5',fontSize:20}}>گزارش ثبت‌نام و آمار بازیکنان سری دوم</h2>
      <p style={{margin:0,color:'#c9c4b8',fontSize:12,lineHeight:1.8}}>گزارش خصوصی مالک · آمار بازی و برد برای هر Plato ID قابل ویرایش و ذخیره است.</p></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button type="button" onClick={()=>setShowWinRateReport(value=>!value)} disabled={loading||rows.length===0} style={secondary}>{showWinRateReport?'بستن گزارش درصد برد':'مشاهده گزارش درصد برد'}</button>
        <button type="button" onClick={()=>void load()} disabled={loading||saving!==null} style={secondary}>{loading?'در حال به‌روزرسانی…':'به‌روزرسانی فهرست'}</button>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:10,margin:'18px 0'}}>
      <Metric label="تعداد درخواست‌ها" value={fa(rows.length)}/><Metric label="ظرفیت اولیه" value={fa(capacity)}/><Metric label="ظرفیت باقی‌مانده تا ۴۸" value={fa(remaining)}/>
    </div>
    <p style={{fontSize:11,color:'#b9b2a4',margin:'0 0 12px',lineHeight:1.9}}>تعداد بازی و برد را به‌صورت عدد صحیح وارد کن. درصد برد خودکار محاسبه می‌شود. برای ذخیره هر بازیکن، دکمهٔ همان ردیف را بزن. مقدار خالی هنگام ذخیره صفر محسوب می‌شود؛ برد نمی‌تواند از بازی بیشتر باشد.</p>
    {error&&<p role="alert" style={{color:'#ffc5c5',background:'#301819',padding:10,borderRadius:8}}>{error}</p>}
    {notice&&<p role="status" style={{color:'#bce8c9',background:'#14281d',padding:10,borderRadius:8}}>{notice}</p>}
    {showWinRateReport&&<section aria-label="گزارش درصد برد بازیکنان" style={{margin:'16px 0',padding:10,border:'1px solid #8a7445',borderRadius:11,background:'#101113'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:10}}>
        <strong style={{color:'#f3d58d',fontSize:16}}>جدول رتبه‌بندی بازیکنان</strong>
        <small style={{color:'#b9b2a4'}}>مرتب‌سازی بر اساس درصد برد</small>
      </div>
      {winRateRows.length===0?<p style={muted}>اطلاعاتی برای نمایش وجود ندارد.</p>:
        <div role="table" aria-label="جدول رتبه‌بندی درصد برد" style={{display:'grid',gap:5}}>
          <div role="row" style={{display:'grid',gridTemplateColumns:'minmax(0,1.8fr) repeat(3,minmax(0,1fr))',gap:4,padding:'7px 5px',color:'#d9c38f',fontSize:10,fontWeight:700,textAlign:'center',borderBottom:'1px solid #8a7445'}}>
            <span role="columnheader" style={{textAlign:'right'}}>رتبه · Plato ID</span><span role="columnheader">بازی</span><span role="columnheader">برد</span><span role="columnheader">درصد</span>
          </div>
          {winRateRows.map((row,index)=><div role="row" key={row.id} style={{display:'grid',gridTemplateColumns:'minmax(0,1.8fr) repeat(3,minmax(0,1fr))',gap:4,alignItems:'center',minWidth:0,padding:'8px 5px',border:'1px solid #393329',borderRadius:7,background:index<8?'#201c14':'#171819'}}>
            <div role="cell" style={{display:'flex',alignItems:'center',gap:5,minWidth:0,textAlign:'right'}}>
              <strong style={{flex:'0 0 20px',color:index<8?'#f3d58d':'#aaa08d',fontSize:11,textAlign:'center'}}>{fa(index+1)}</strong>
              <strong dir="ltr" style={{minWidth:0,color:'#f3d58d',fontSize:11,overflowWrap:'anywhere',lineHeight:1.35}}>{row.plato_id}</strong>
            </div>
            <strong role="cell" style={{color:'#eee',fontSize:11,textAlign:'center',overflowWrap:'anywhere'}}>{row.games_played===null?'—':fa(row.games_played)}</strong>
            <strong role="cell" style={{color:'#eee',fontSize:11,textAlign:'center',overflowWrap:'anywhere'}}>{row.games_won===null?'—':fa(row.games_won)}</strong>
            <strong role="cell" style={{color:row.rate===null?'#aaa':'#f3d58d',fontSize:11,textAlign:'center',overflowWrap:'anywhere'}}>{row.rate===null?'—':row.rate.toLocaleString('fa-IR',{maximumFractionDigits:2})+'٪'}</strong>
          </div>)}
        </div>}
      <small style={{display:'block',color:'#918a7b',marginTop:9,lineHeight:1.8,fontSize:10}}>بازیکنانی که هنوز آمار بازی ندارند، با صفر نمایش داده می‌شوند و در انتهای جدول قرار می‌گیرند. این جدول فقط‌خواندنی است.</small>
    </section>}
    {loading&&rows.length===0?<p style={muted}>در حال دریافت فهرست…</p>:rows.length===0?<p style={muted}>هنوز درخواستی ثبت نشده است.</p>:
      <div style={{display:'grid',gap:10}}>
        {rows.map((row,index)=>{
          const draft=drafts[row.id]||{gamesPlayed:'',gamesWon:''};
          const played=Number(draft.gamesPlayed||0),won=Number(draft.gamesWon||0);
          const valid=Number.isSafeInteger(played)&&Number.isSafeInteger(won)&&won<=played;
          const rate=played>0&&valid?(won/played*100).toLocaleString('fa-IR',{maximumFractionDigits:2})+'٪':'—';
          return <article key={row.id} style={{border:'1px solid #51452d',borderRadius:11,padding:12,background:'#101113'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}><span style={{color:'#b9a77d',fontSize:12}}>{fa(index+1)}.</span><strong dir="ltr" style={{color:'#f3d58d',fontSize:16}}>{row.plato_id}</strong></div>
              <small style={{color:'#a9a08e'}}>{date(row.created_at)}</small>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(125px,1fr))',gap:9,alignItems:'end'}}>
              <label style={labelStyle}>تعداد بازی<input type="number" min="0" step="1" inputMode="numeric" value={draft.gamesPlayed} onChange={e=>updateDraft(row.id,'gamesPlayed',e.target.value)} style={numberStyle}/></label>
              <label style={labelStyle}>تعداد برد<input type="number" min="0" step="1" inputMode="numeric" value={draft.gamesWon} onChange={e=>updateDraft(row.id,'gamesWon',e.target.value)} style={numberStyle}/></label>
              <div style={{padding:'9px 11px',border:'1px solid #51452d',borderRadius:8,background:'#1b1a16'}}><small style={{display:'block',color:'#b9a77d'}}>درصد برد</small><strong style={{color:'#f3d58d',fontSize:18}}>{rate}</strong></div>
              <button type="button" disabled={saving!==null||!valid} onClick={()=>void saveStats(row)} style={{...primary,opacity:saving===row.id?0.65:1}}>{saving===row.id?'در حال ذخیره…':'ذخیره آمار'}</button>
            </div>
            {!valid&&<small style={{display:'block',color:'#ffc5c5',marginTop:7}}>تعداد برد نمی‌تواند بیشتر از تعداد بازی باشد.</small>}
          </article>;
        })}
      </div>}
    {updatedAt&&<small style={{display:'block',color:'#918a7b',marginTop:12}}>آخرین به‌روزرسانی: {new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Copenhagen'}).format(updatedAt)}</small>}
  </section>;
}
function Metric({label,value}:{label:string;value:string}){return <div style={{padding:13,borderRadius:10,background:'#101113',border:'1px solid #51452d'}}><small style={{color:'#b9a77d'}}>{label}</small><strong style={{display:'block',fontSize:25,color:'#f3d58d'}}>{value}</strong></div>}
const labelStyle:React.CSSProperties={display:'block',color:'#d9c38f',fontSize:12,lineHeight:1.8};
const numberStyle:React.CSSProperties={boxSizing:'border-box',display:'block',width:'100%',marginTop:5,background:'#090a0c',border:'1px solid #6a5a37',borderRadius:8,color:'#fff',padding:'10px 9px',font:'inherit',fontSize:15};
const primary:React.CSSProperties={minHeight:40,background:'linear-gradient(120deg,#a98239,#e4c77e)',border:'1px solid #e3c77d',borderRadius:8,color:'#17130b',padding:'9px 12px',fontWeight:700,cursor:'pointer'};
const secondary:React.CSSProperties={background:'#252525',border:'1px solid #8a7445',color:'#f2dfb1',borderRadius:8,padding:'10px 14px',cursor:'pointer'};
const muted:React.CSSProperties={color:'#c9c4b8',fontSize:13,lineHeight:1.9};
const reportCell:React.CSSProperties={padding:'10px 8px',borderBottom:'1px solid #34312a',whiteSpace:'nowrap'};
