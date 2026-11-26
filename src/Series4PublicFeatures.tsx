import React,{useEffect,useRef,useState} from 'react';
import {supabase} from './supabase';

const rulesVideoUrl='https://plato-land-media-pages.pages.dev/api/series4-media?rules-video=1&asset=rules';

export default function Series4PublicFeatures(){
  const [videoAvailable,setVideoAvailable]=useState(false);
  const [predictionsAvailable,setPredictionsAvailable]=useState(false);
  const [watching,setWatching]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);

  useEffect(()=>{
    const client=supabase;
    if(!client)return;
    let active=true;
    void client.rpc('series4_public_rules_video_key').then(({data,error})=>{
      if(active)setVideoAvailable(!error&&typeof data==='string'&&data.length>0);
    });
    void client.rpc('series4_public_prediction_campaigns').then(({data,error})=>{
      if(active)setPredictionsAvailable(!error&&Array.isArray(data)&&data.length>0);
    });
    return ()=>{active=false;};
  },[]);

  function openVideo(){
    if(!dialog.current||dialog.current.open)return;
    dialog.current.showModal();
    setWatching(true);
    void supabase?.rpc('series4_record_rules_video_open').then(()=>{});
  }

  if(!videoAvailable&&!predictionsAvailable)return null;
  return <nav aria-label="امکانات سری چهارم" style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
    {predictionsAvailable&&<a className="text-link" href="/series4-predictions/">پیش‌بینی‌های سری چهارم</a>}
    {videoAvailable&&<>
      <button type="button" className="text-link" onClick={openVideo}>ویدیوی قوانین سری چهارم</button>
      <dialog dir="rtl" aria-labelledby="series4-rules-video-title" ref={dialog}
        onClose={()=>setWatching(false)} style={{width:'min(90vw,820px)',background:'#151516',color:'#f4ead2',border:'1px solid #8c6a34',borderRadius:12}}>
        <h2 id="series4-rules-video-title">ویدیوی قوانین سری چهارم</h2>
        {watching&&<video controls playsInline preload="metadata" src={rulesVideoUrl} style={{display:'block',width:'100%',maxHeight:'72vh'}}/>}
        <form method="dialog"><button type="submit" className="text-link">بستن</button></form>
      </dialog>
    </>}
  </nav>;
}
