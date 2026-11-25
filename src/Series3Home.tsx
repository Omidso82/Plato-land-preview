import React,{useEffect,useState} from 'react';
import {ArrowLeft} from 'lucide-react';
import Series3Gallery from './Series3Gallery';
import {supabase} from './supabase';

export default function Series3Home() {
  const [showRegistration,setShowRegistration]=useState(false);

  useEffect(()=>{
    const client=supabase;
    if(!client)return;
    let active=true;
    let latestRequest=0;
    async function refresh(){
      if(!client)return;
      const request=++latestRequest;
      try{
        // The manifest contains only active slides and is empty while registration is closed.
        const {data,error}=await client.rpc('series4_registration_rule_slides');
        if(active&&request===latestRequest){
          setShowRegistration(!error&&Array.isArray(data)&&data.length===17);
        }
      }catch{
        if(active&&request===latestRequest)setShowRegistration(false);
      }
    }

    void refresh();
    window.addEventListener('focus',refresh);
    const interval=window.setInterval(refresh,60_000);
    return ()=>{
      active=false;
      window.removeEventListener('focus',refresh);
      window.clearInterval(interval);
    };
  },[]);

  return <Series3Gallery activeCompetitions={showRegistration&&
    <section aria-labelledby="series4-active-title" style={{marginBottom:18,padding:16,border:'1px solid #b18b45',borderRadius:13,background:'linear-gradient(115deg,#322714,#141416)'}}>
      <h2 id="series4-active-title" style={{margin:'0 0 12px',color:'#f0d99f',fontSize:17}}>مسابقات فعال</h2>
      <a href="/series4-registration/" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,padding:12,borderRadius:9,background:'linear-gradient(120deg,#b48b43,#e4c77e)',color:'#17130b',fontWeight:900,textDecoration:'none'}}>
        ثبت‌نام سری چهارم تخته‌نرد <ArrowLeft size={16} aria-hidden="true"/>
      </a>
    </section>
  }/>;
}
