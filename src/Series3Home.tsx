import React,{useEffect,useState} from 'react';
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

  return <Series3Gallery showTournamentEntry tournamentEntries={showRegistration ? [{
    id:'series4',
    title:'سری چهارم تخته‌نرد',
    game:'تخته‌نرد',
    state:'registration',
    href:'/series4-registration/',
  }] : []}/>;
}
