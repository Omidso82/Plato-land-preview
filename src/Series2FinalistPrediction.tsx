import React,{useEffect,useState} from "react";
type S={is_open:boolean;candidates:string[]};
const api="https://dfrppbapaaydbjeflozw.supabase.co/functions/v1/plato-land-series2-finalist-prediction";
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",marginTop:7,padding:12,borderRadius:9,border:"1px solid #80683d",background:"#090a0c",color:"#fff",fontSize:15};
const btn:React.CSSProperties={width:"100%",padding:13,borderRadius:9,border:"1px solid #e3c77d",background:"linear-gradient(120deg,#a98239,#e4c77e)",color:"#17130b",fontWeight:800,cursor:"pointer"};
export default function Series2FinalistPrediction(){
 const [s,setS]=useState<S|null>(null),[loading,L]=useState(true),[voter,V]=useState(""),[a,A]=useState(""),[b,B]=useState(""),[champ,C]=useState(""),[busy,Q]=useState(false),[msg,M]=useState(""),[done,D]=useState(false);
 useEffect(()=>{let live=true;const load=async()=>{try{const r=await fetch(api,{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error||"دریافت وضعیت ناموفق بود.");if(live)setS(d);}catch(e){if(live)M(e instanceof Error?e.message:"خطا");}finally{if(live)L(false);}};void load();const t=window.setInterval(load,30000);return()=>{live=false;window.clearInterval(t);};},[]);
 useEffect(()=>{if(champ!==a&&champ!==b)C("");},[a,b]);
 async function submit(e:React.FormEvent){e.preventDefault();Q(true);M("");try{const r=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plato_id:voter.trim(),finalist_one_plato_id:a,finalist_two_plato_id:b,champion_plato_id:champ})});const d=await r.json();if(!r.ok)throw Error(d.error||"ثبت انجام نشد.");D(true);M("پیش‌بینی با موفقیت ثبت شد. امکان تغییر یا ثبت مجدد وجود ندارد.");}catch(e){M(e instanceof Error?e.message:"خطا در ثبت");}finally{Q(false);}}
 if(loading)return <section style={wrap}>در حال دریافت وضعیت پیش‌بینی…</section>;
 if(!s?.is_open)return null;
 const pick=(id:string,selected:boolean,disabled:boolean,fn:()=>void)=><button type="button" disabled={disabled} onClick={fn} style={{padding:11,borderRadius:8,border:selected?"1px solid #e3c77d":"1px solid #51452d",background:selected?"#5b4825":"#1a1b1d",color:selected?"#ffe6a6":"#eee5d4",fontWeight:750,fontSize:12,direction:"ltr",overflowWrap:"anywhere",opacity:disabled?.42:1,cursor:disabled?"not-allowed":"pointer"}}>{id}</button>;
 const selected=[a,b].filter(Boolean);
 function toggle(id:string){if(a===id){A(b);B("");C("");return;}if(b===id){B("");C("");return;}if(!a){A(id);return;}if(!b){B(id);return;}}
 return <section dir="rtl" style={wrap}><header style={{textAlign:"center",marginBottom:16}}><small style={{color:"#c9a85e",letterSpacing:2}}>PLATO LAND · SERIES 2</small><h2 style={{color:"#f0d99f",fontSize:22,margin:"7px 0"}}>پیش‌بینی فینالیست‌ها و قهرمان</h2><p style={{color:"#c9c4b8",fontSize:12,lineHeight:1.9}}>دو بازیکن فینالیست را انتخاب کن و قهرمان را از میان همان دو نفر مشخص کن.</p></header>
 {done?<p role="status" style={{color:"#c8e8bd",textAlign:"center"}}>{msg}</p>:<form onSubmit={submit} style={{display:"grid",gap:13}}>
 <label style={label}>Plato ID شما<input style={input} dir="ltr" autoCapitalize="none" autoCorrect="off" maxLength={30} pattern="[A-Za-z0-9_]{2,30}" required value={voter} onChange={e=>V(e.target.value)} placeholder="Your Plato ID"/></label>
 <div style={card}><strong>انتخاب دو فینالیست</strong><small style={{color:"#c9c4b8"}}>از میان چهار بازیکن، دو نفر را انتخاب کن ({selected.length} از ۲)</small><div style={choices}>{s.candidates.map(id=>pick(id,selected.includes(id),selected.length===2&&!selected.includes(id),()=>toggle(id)))}</div></div>
 <div style={card}><strong>قهرمان پیش‌بینی‌شده</strong>{selected.length===2?<div style={choices}>{selected.map(id=>pick(id,champ===id,false,()=>C(id)))}</div>:<small>ابتدا دو فینالیست را از فهرست بالا انتخاب کن.</small>}</div>
 <button style={btn} disabled={busy||!voter.trim()||!a||!b||!champ}>{busy?"در حال ثبت…":"ثبت نهایی پیش‌بینی"}</button><small style={{color:"#a99e89",fontSize:10}}>هر Plato ID فقط یک بار رأی می‌دهد؛ پس از ثبت امکان تغییر وجود ندارد.</small></form>}
 {msg&&!done&&<p role="alert" style={{color:"#ffc8c8",fontSize:12}}>{msg}</p>}</section>;
}
const wrap:React.CSSProperties={margin:"18px 0",padding:18,border:"1px solid #b18b45",borderRadius:15,background:"linear-gradient(145deg,#211b12,#111214)",color:"#f4f0e8"};
const label:React.CSSProperties={display:"block",color:"#e7dcc5",fontSize:12};
const card:React.CSSProperties={padding:12,border:"1px solid #705b31",borderRadius:10,background:"#101113",display:"grid",gap:10,color:"#f0d99f"};
const choices:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8};