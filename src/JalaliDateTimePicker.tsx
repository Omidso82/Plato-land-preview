import React,{useEffect,useMemo,useState} from 'react';
import {isoToJalaliInput} from './predictionDateTime';

type Props={label:string;value:string;onChange:(value:string)=>void};
type JalaliDate={year:number;month:number;day:number};
const calendarParts=new Intl.DateTimeFormat('en-u-ca-persian-nu-latn',{timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric'});
const monthName=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',month:'long'});
const weekDays=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const pad=(n:number)=>String(n).padStart(2,'0');
const normalizeDigits=(value:string)=>value.replace(/[۰-۹٠-٩]/g,d=>{const p='۰۱۲۳۴۵۶۷۸۹'.indexOf(d);return String(p>=0?p:'٠١٢٣٤٥٦٧٨٩'.indexOf(d));});
const jalaliText=(value:string)=>isoToJalaliInput(value)||normalizeDigits(value.trim());

function jalaliParts(date:Date):JalaliDate{
 const parts=Object.fromEntries(calendarParts.formatToParts(date).map(p=>[p.type,p.value]));
 return {year:Number(parts.year),month:Number(parts.month),day:Number(parts.day)};
}
function parseValue(value:string):{date:JalaliDate|null;hour:string;minute:string}{
 if(!value)return {date:null,hour:'00',minute:'00'};
 const text=jalaliText(value);
 const m=/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/.exec(text);
 return m?{date:{year:Number(m[1]),month:Number(m[2]),day:Number(m[3])},hour:m[4],minute:m[5]}:{date:null,hour:'00',minute:'00'};
}
function monthDays(year:number,month:number){
 const found:{day:number;weekday:number;date:Date}[]=[];
 const start=Date.UTC(year+621,2,14,12);
 for(let i=0;i<390;i++){
  const date=new Date(start+i*86400000);
  const p=jalaliParts(date);
  if(p.year===year&&p.month===month)found.push({day:p.day,weekday:(date.getUTCDay()+1)%7,date});
 }
 return found;
}
function currentJalali(){return jalaliParts(new Date());}

export default function JalaliDateTimePicker({label,value,onChange}:Props){
 const selected=parseValue(value);
 const initial=selected.date||currentJalali();
 const [visibleYear,setVisibleYear]=useState(initial.year);
 const [visibleMonth,setVisibleMonth]=useState(initial.month);
 const [hour,setHour]=useState(selected.hour);
 const [minute,setMinute]=useState(selected.minute);
 const [expanded,setExpanded]=useState(false);
 useEffect(()=>{
  const next=parseValue(value);
  if(next.date){setVisibleYear(next.date.year);setVisibleMonth(next.date.month);}
  setHour(next.hour);setMinute(next.minute);
 },[value]);
 const days=useMemo(()=>monthDays(visibleYear,visibleMonth),[visibleYear,visibleMonth]);
 const firstOffset=days[0]?.weekday??0;
 const cells=[...Array(firstOffset).fill(null),...days];
 const currentDate=parseValue(value).date;
 const selectedLabel=currentDate?isoToJalaliInput(value).split(' ')[0]:'تاریخ و ساعت را انتخاب کنید';
 function changeMonth(delta:number){
  let y=visibleYear,m=visibleMonth+delta;
  if(m<1){m=12;y--;}else if(m>12){m=1;y++;}
  setVisibleYear(y);setVisibleMonth(m);
 }
 function chooseDay(day:number){
  onChange(`${visibleYear}/${pad(visibleMonth)}/${pad(day)} ${hour}:${minute}`);
 }
 function changeTime(nextHour:string,nextMinute:string){
  setHour(nextHour);setMinute(nextMinute);
  if(currentDate)onChange(`${currentDate.year}/${pad(currentDate.month)}/${pad(currentDate.day)} ${nextHour}:${nextMinute}`);
 }
 const firstDate=days[0]?.date;
 const title=firstDate?monthName.format(firstDate):'';
 const selectStyle:React.CSSProperties={width:'100%',padding:'10px 8px',border:'1px solid #66532f',borderRadius:8,background:'#0c0d0f',color:'#f7edda',font:'inherit'};
 return <section style={{display:'grid',gap:8}}>
  <span style={{fontWeight:600,color:'#ead9b7',fontSize:14}}>{label}</span>
  <button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,width:'100%',padding:12,border:'1px solid #806637',borderRadius:9,background:'#0c0d0f',color:'#f4e5c5',font:'inherit',textAlign:'right',cursor:'pointer'}}>
   <span><strong dir="ltr" style={{display:'block',textAlign:'right'}}>{value?jalaliText(value):selectedLabel}</strong><small style={{display:'block',color:'#bdb19a',marginTop:4}}>تقویم شمسی · ساعت تهران</small></span>
   <span aria-hidden="true">{expanded?'▲':'▼'}</span>
  </button>
  {expanded&&<div style={{display:'grid',gap:12,padding:12,border:'1px solid #66532f',borderRadius:10,background:'#101112'}}>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
    <button type="button" onClick={()=>changeMonth(1)} aria-label="ماه بعد" style={{...selectStyle,width:42,cursor:'pointer'}}>‹</button>
    <strong>{title} {visibleYear.toLocaleString('fa-IR')}</strong>
    <button type="button" onClick={()=>changeMonth(-1)} aria-label="ماه قبل" style={{...selectStyle,width:42,cursor:'pointer'}}>›</button>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:3}}>
    {weekDays.map(day=><div key={day} style={{textAlign:'center',fontSize:10,color:'#bdb19a',padding:'5px 0'}}>{day}</div>)}
    {cells.map((item,index)=>item?<button key={item.day} type="button" onClick={()=>chooseDay(item.day)} aria-pressed={currentDate?.year===visibleYear&&currentDate.month===visibleMonth&&currentDate.day===item.day} style={{minWidth:0,padding:'9px 0',borderRadius:7,border:'1px solid '+(currentDate?.year===visibleYear&&currentDate.month===visibleMonth&&currentDate.day===item.day?'#e2bd70':'#39342a'),background:currentDate?.year===visibleYear&&currentDate.month===visibleMonth&&currentDate.day===item.day?'#b48b43':'#191a1b',color:currentDate?.year===visibleYear&&currentDate.month===visibleMonth&&currentDate.day===item.day?'#17130b':'#f4e5c5',font:'inherit',fontSize:13,cursor:'pointer'}}>{item.day.toLocaleString('fa-IR')}</button>:<span key={'blank-'+index}/>)}
   </div>
   <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
    <label style={{display:'grid',gap:5,color:'#d8c9a9',fontSize:12}}>ساعت
     <select value={hour} onChange={e=>changeTime(e.target.value,minute)} style={selectStyle}>{Array.from({length:24},(_,i)=><option key={i} value={pad(i)}>{pad(i)}</option>)}</select>
    </label>
    <label style={{display:'grid',gap:5,color:'#d8c9a9',fontSize:12}}>دقیقه
     <select value={minute} onChange={e=>changeTime(hour,e.target.value)} style={selectStyle}>{Array.from({length:60},(_,i)=><option key={i} value={pad(i)}>{pad(i)}</option>)}</select>
    </label>
   </div>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
    <small style={{color:'#bdb19a'}}>زمان انتخابی به وقت تهران ذخیره می‌شود.</small>
    <div style={{display:'flex',gap:7}}>
     {value&&<button type="button" onClick={()=>{onChange('');setExpanded(false);}} style={{...selectStyle,width:'auto',cursor:'pointer'}}>پاک کردن</button>}
     <button type="button" onClick={()=>setExpanded(false)} style={{...selectStyle,width:'auto',background:'#b48b43',color:'#17130b',fontWeight:700,cursor:'pointer'}}>تأیید</button>
    </div>
   </div>
  </div>}
 </section>;
}
