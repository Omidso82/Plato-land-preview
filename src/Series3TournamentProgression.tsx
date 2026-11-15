import React,{useState} from 'react';
import {Crown,Trophy,Users,Shuffle,Layers3,CalendarDays,Medal,GitBranch,Table2} from 'lucide-react';

type Section='seeding'|'draw'|'groups'|'schedule'|'bracket';
const sections:{id:Section;label:string;icon:React.ComponentType<any>}[]=[
 {id:'seeding',label:'سیدبندی و سبدها',icon:Layers3},
 {id:'draw',label:'قرعه‌کشی و گروه‌ها',icon:Shuffle},
 {id:'groups',label:'جدول گروه‌ها',icon:Table2},
 {id:'schedule',label:'برنامه مسابقات',icon:CalendarDays},
 {id:'bracket',label:'مرحله حذفی تا فینال',icon:GitBranch},
];
const rounds=[['round16','یک‌هشتم نهایی'],['quarter','یک‌چهارم نهایی'],['semi','نیمه‌نهایی'],['third_place','رده‌بندی'],['final','فینال']] as const;
const shell:React.CSSProperties={marginTop:22,padding:16,border:'1px solid #8b6d38',borderRadius:16,background:'linear-gradient(145deg,#1b1711,#101114)',color:'#f4ead2',boxShadow:'0 14px 36px #0005'};
const tabStyle:React.CSSProperties={display:'flex',alignItems:'center',gap:8,padding:'11px 12px',border:'1px solid #5e4a2c',borderRadius:10,background:'#171719',color:'#d9c69e',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'};
const empty:React.CSSProperties={padding:'28px 16px',border:'1px dashed #80663a',borderRadius:12,textAlign:'center',background:'#101113',color:'#b9ad97',lineHeight:1.9};
const roundsStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(125px,1fr))',gap:8,marginBottom:14};
export default function Series3TournamentProgression(){
 const [active,setActive]=useState<Section>('seeding');
 const [round,setRound]=useState<(typeof rounds)[number][0]>('round16');
 const activeSection=sections.find(x=>x.id===active)!;
 const Icon=activeSection.icon;
 return <section dir="rtl" style={shell} aria-label="ساختار مسابقات سری سوم">
  <header style={{textAlign:'center',marginBottom:16}}>
   <Crown size={27} color="#d6b46d" strokeWidth={1.5}/>
   <div style={{fontSize:11,letterSpacing:2,color:'#b99a5b',marginTop:5}}>PLATO LAND · SERIES 3</div>
   <h2 style={{fontSize:21,margin:'8px 0 4px',color:'#f3dfb3'}}>مسیر مسابقات تا فینال</h2>
   <p style={{fontSize:12,color:'#b9ad97',lineHeight:1.8,margin:0}}>قالب رسمی نمایش سیدبندی، قرعه‌کشی، گروه‌ها، نتایج و مراحل حذفی سری سوم</p>
  </header>
  <nav aria-label="بخش‌های مسابقات سری سوم" style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8,marginBottom:14}}>
   {sections.map(item=>{const I=item.icon;return <button key={item.id} type="button" aria-pressed={active===item.id} onClick={()=>setActive(item.id)} style={{...tabStyle,background:active===item.id?'linear-gradient(120deg,#9b7435,#d9b96f)':'#171719',color:active===item.id?'#17120a':'#d9c69e',borderColor:active===item.id?'#e4c77e':'#5e4a2c'}}><I size={16}/>{item.label}</button>})}
  </nav>
  <div style={{border:'1px solid #4c3c25',borderRadius:12,padding:14,background:'#151516'}}>
   <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:12}}>
    <Icon size={20} color="#d6b46d"/>
    <h3 style={{fontSize:16,margin:0,color:'#f0d99f'}}>{activeSection.label}</h3>
   </div>
   {active==='seeding'&&<div style={empty}><Layers3 size={27} color="#b99a5b"/><strong style={{display:'block',marginTop:9,color:'#e8d8b5'}}>اطلاعات سیدبندی هنوز ثبت نشده است.</strong><span>پس از نهایی‌شدن فهرست بازیکنان و آمار مبنا، سبدهای سیدبندی اینجا نمایش داده می‌شوند.</span></div>}
   {active==='draw'&&<div style={empty}><Shuffle size={27} color="#b99a5b"/><strong style={{display:'block',marginTop:9,color:'#e8d8b5'}}>قرعه‌کشی گروه‌ها هنوز انجام نشده است.</strong><span>پس از ثبت قرعه‌کشی رسمی، ترکیب گروه‌ها در همین بخش نمایش داده خواهد شد.</span></div>}
   {active==='groups'&&<><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}><span style={{fontSize:12,color:'#b9ad97'}}>گروه‌ها و جدول امتیازات</span></div><div style={{overflowX:'auto',border:'1px solid #4c3c25',borderRadius:10}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:560,textAlign:'center',fontSize:12}}><thead><tr>{['رتبه','Plato ID','بازی','برد','باخت','امتیاز','ست برده','تفاضل'].map(label=><th key={label} style={{padding:11,color:'#e8d8b5',background:'#211b12',borderBottom:'1px solid #6b542e',whiteSpace:'nowrap'}}>{label}</th>)}</tr></thead><tbody><tr><td colSpan={8} style={{padding:22,color:'#b9ad97'}}>هنوز گروه یا بازیکنی برای نمایش ثبت نشده است.</td></tr></tbody></table></div><p style={{fontSize:11,color:'#8f836d',margin:'9px 0 0'}}>جدول‌ها پس از ثبت قرعه‌کشی و نتایج، به تفکیک گروه نمایش داده می‌شوند.</p></>}
   {active==='schedule'&&<><div style={{overflowX:'auto',border:'1px solid #4c3c25',borderRadius:10}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:520,textAlign:'center',fontSize:12}}><thead><tr>{['شناسه بازی','گروه','روز / زمان','بازیکن اول','نتیجه','بازیکن دوم','وضعیت'].map(label=><th key={label} style={{padding:11,color:'#e8d8b5',background:'#211b12',borderBottom:'1px solid #6b542e',whiteSpace:'nowrap'}}>{label}</th>)}</tr></thead><tbody><tr><td colSpan={7} style={{padding:22,color:'#b9ad97'}}>برنامه مسابقات هنوز ثبت نشده است.</td></tr></tbody></table></div></>}
   {active==='bracket'&&<><div style={roundsStyle}>{rounds.map(([id,label])=><button key={id} type="button" onClick={()=>setRound(id)} style={{...tabStyle,justifyContent:'center',background:round===id?'#a98239':'#111214',color:round===id?'#17120a':'#d9c69e'}}>{label}</button>)}</div><div style={empty}><Trophy size={28} color="#d6b46d"/><strong style={{display:'block',marginTop:9,color:'#e8d8b5'}}>{rounds.find(x=>x[0]===round)?.[1]}؛ هنوز مسابقه‌ای ثبت نشده است.</strong><span>پس از مشخص‌شدن صعودکنندگان، جدول حذفی و مسیر رسیدن به فینال در این بخش نمایش داده می‌شود.</span></div></>}
  </div>
  <footer style={{display:'flex',justifyContent:'center',alignItems:'center',gap:7,marginTop:13,color:'#8f836d',fontSize:10}}><Medal size={13}/> PLATO LAND · بازی، رقابت، قهرمانی</footer>
 </section>;
}
