import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { formatIranDateTime } from './iranDate';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';

type Notification={id:string;user_id:string;tournament_id:string|null;notification_type:string;title:string;body:string;read_at:string|null;created_at:string};
export default function NotificationBell({onOpenRegistrations}:{onOpenRegistrations?:()=>void}){
 const [items,setItems]=useState<Notification[]>([]);
 const [open,setOpen]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const unread=items.filter(item=>!item.read_at).length;
 const load=useCallback(async()=>{
  if(!supabase){setLoading(false);return;}
  try{
   const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user){setItems([]);return;}
   const {data,error:queryError}=await supabase.from('user_notifications').select('id,user_id,tournament_id,notification_type,title,body,read_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30);
   if(queryError)throw queryError;setItems((data||[]) as Notification[]);setError('');
  }catch(e:any){setError(e?.message||'دریافت اعلان‌ها ناموفق بود.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();if(!supabase)return;let active=true;let channel:any;supabase.auth.getUser().then(({data})=>{if(!active||!data.user)return;channel=supabase!.channel('player-notifications-'+data.user.id).on('postgres_changes',{event:'*',schema:'public',table:'user_notifications',filter:'user_id=eq.'+data.user.id},()=>void load()).subscribe();});return()=>{active=false;if(channel)void supabase?.removeChannel(channel);};},[load]);
 async function markRead(item:Notification){
  if(!supabase||item.read_at)return;
  const timestamp=new Date().toISOString();
  const {error:updateError}=await supabase.from('user_notifications').update({read_at:timestamp}).eq('id',item.id);
  if(!updateError)setItems(old=>old.map(x=>x.id===item.id?{...x,read_at:timestamp}:x));
 }
 async function markAllRead(){
  if(!supabase||unread===0)return;
  const ids=items.filter(x=>!x.read_at).map(x=>x.id);const timestamp=new Date().toISOString();
  const {error:updateError}=await supabase.from('user_notifications').update({read_at:timestamp}).in('id',ids);
  if(!updateError)setItems(old=>old.map(x=>({...x,read_at:x.read_at||timestamp})));
 }
 return <div className="notification-bell-wrap"><button type="button" className="notification-bell" onClick={()=>{setOpen(v=>!v);if(!open)void load();}} aria-label="اعلان‌ها"><Bell size={18}/>{unread>0&&<span>{unread>9?'۹+':unread.toLocaleString('fa-IR')}</span>}</button>{open&&<><button className="notification-dismiss" aria-label="بستن اعلان‌ها" onClick={()=>setOpen(false)}/><section className="notification-popover" aria-label="اعلان‌های حساب"><div className="notification-popover-head"><strong>اعلان‌های من</strong><button type="button" onClick={()=>void markAllRead()} disabled={!unread}><CheckCheck size={14}/> خواندن همه</button></div>{loading?<p className="form-footnote">در حال دریافت…</p>:error?<p className="auth-inline-error">{error}</p>:items.length===0?<p className="form-footnote">اعلان جدیدی نداری.</p>:<div className="notification-list">{items.map(item=><button type="button" key={item.id} className={'notification-item'+(!item.read_at?' unread':'')} onClick={()=>{void markRead(item);onOpenRegistrations?.();setOpen(false);}}><strong>{item.title}</strong><span>{item.body}</span><small>{formatIranDateTime(item.created_at)}</small>{item.tournament_id&&<em><ExternalLink size={12}/> پیگیری ثبت‌نام</em>}</button>)}</div>}</section></>}</div>;
}
