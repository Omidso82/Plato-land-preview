import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Gamepad2, Pencil, Plus, Save, RefreshCw, Layers3 } from 'lucide-react';

type GameItem = { id:string; slug:string; name:string; description:string; image_url:string|null; enabled:boolean; is_mixed:boolean; included_game_slugs:string[]; sort_order:number; created_at:string; updated_at:string };
const emptyForm = { slug:'', name:'', description:'', image_url:'', enabled:true, is_mixed:false, included_game_slugs:[], sort_order:'0' };

export default function GameCatalog({ owner=false, selectedGame='', onSelect, showEditor=false, activeCounts={} }: { owner?:boolean; selectedGame?:string; onSelect?:(game:string)=>void; showEditor?:boolean; activeCounts?:Record<string,number> }) {
  const [items,setItems]=useState<GameItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [editingId,setEditingId]=useState('');
  const [form,setForm]=useState(emptyForm);

  const load=useCallback(async()=>{
    if(!supabase){setLoading(false);setError('اتصال به پایگاه داده برقرار نیست.');return;}
    setLoading(true);setError('');
    try{
      let result;
      if(owner) result=await supabase.from('site_games').select('id,slug,name,description,image_url,enabled,is_mixed,included_game_slugs,sort_order,created_at,updated_at').order('sort_order').order('name');
      else result=await supabase.from('site_games').select('id,slug,name,description,image_url,enabled,is_mixed,sort_order,created_at,updated_at').eq('enabled',true).order('sort_order').order('name');
      if(result.error)throw result.error;
      setItems((result.data||[]) as GameItem[]);
    }catch(e:any){setError(e?.message||'بارگذاری فهرست بازی‌ها ناموفق بود.');}
    finally{setLoading(false);}
  },[owner]);

  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    if(!supabase)return;
    const channel=supabase.channel('site-games-catalog').on('postgres_changes',{event:'*',schema:'public',table:'site_games'},()=>void load()).subscribe();
    return ()=>{void supabase?.removeChannel(channel);};
  },[load]);

  function edit(item:GameItem){setEditingId(item.id);setForm({slug:item.slug,name:item.name,description:item.description||'',image_url:item.image_url||'',enabled:item.enabled,is_mixed:item.is_mixed,included_game_slugs:item.included_game_slugs||[],sort_order:String(item.sort_order)});setError('');}
  function reset(){setEditingId('');setForm(emptyForm);setError('');}

  async function save(event:React.FormEvent){
    event.preventDefault();if(!owner||!supabase)return;
    const slug=form.slug.trim().toLowerCase();
    if(!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug)){setError('شناسه بازی باید با حروف انگلیسی کوچک، عدد و خط تیره باشد و ابتدا و انتهای آن حرف یا عدد باشد.');return;}
    if(!form.name.trim()){setError('نام بازی الزامی است.');return;}
    const included = form.is_mixed ? [...new Set(form.included_game_slugs)] : [];
    if(form.is_mixed && included.length < 2){setError('برای ساخت مسابقه ترکیبی، حداقل دو بازی مستقل انتخاب کن.');return;}
    if(form.is_mixed && included.some(slug=>!items.some(item=>item.slug===slug&&!item.is_mixed))){setError('فقط بازی‌های مستقل و ثبت‌شده قابل انتخاب هستند.');return;}
    if(form.image_url.trim()&&!/^https:\/\//i.test(form.image_url.trim())){setError('لینک تصویر باید با https شروع شود.');return;}
    setBusy(true);setError('');
    try{
      const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user)throw new Error('نشست مالک معتبر نیست.');
      const payload={slug,name:form.name.trim(),description:form.description.trim(),image_url:form.image_url.trim()||null,enabled:form.enabled,is_mixed:form.is_mixed,included_game_slugs:included,sort_order:Number.parseInt(form.sort_order,10)||0,created_by:user.id,updated_at:new Date().toISOString()};
      const result=editingId?await supabase.from('site_games').update(payload).eq('id',editingId):await supabase.from('site_games').insert(payload);
      if(result.error)throw result.error;reset();await load();
    }catch(e:any){setError(e?.message||'ذخیره بازی ناموفق بود.');}
    finally{setBusy(false);}
  }



  return <section className="game-catalog">
    {owner&&showEditor&&<section className="panel game-admin-panel"><div className="admin-toolbar"><div><span className="section-kicker">مدیریت بازی‌ها</span><h2>{editingId?'ویرایش بازی':'افزودن بازی جدید'}</h2><p>بازی غیرفعال از فهرست عمومی پنهان می‌شود؛ سابقه مسابقات آن حذف نخواهد شد.</p></div><Gamepad2 size={24}/></div><form className="form-panel game-editor" onSubmit={save}>
      <label>نام بازی<input required maxLength={80} value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></label>
      <label>شناسه انگلیسی (Slug)<input required dir="ltr" value={form.slug} onChange={e=>setForm(v=>({...v,slug:e.target.value}))} placeholder="backgammon"/></label>
      <label>توضیحات کوتاه<textarea rows={3} maxLength={500} value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))}/></label>
      <label>لینک تصویر (HTTPS)<input type="url" dir="ltr" value={form.image_url} onChange={e=>setForm(v=>({...v,image_url:e.target.value}))} placeholder="https://…"/></label>
      <label>ترتیب نمایش<input type="number" value={form.sort_order} onChange={e=>setForm(v=>({...v,sort_order:e.target.value}))}/></label>
      <label className="check-row"><input type="checkbox" checked={form.enabled} onChange={e=>setForm(v=>({...v,enabled:e.target.checked}))}/><span>نمایش در سایت عمومی</span></label>
      <label className="check-row"><input type="checkbox" checked={form.is_mixed} onChange={e=>setForm(v=>({...v,is_mixed:e.target.checked}))}/><span>مسابقات ترکیبی</span></label>
      {form.is_mixed&&<fieldset className="mixed-game-picker"><legend>بازی‌های تشکیل‌دهندهٔ رقابت ترکیبی</legend><p>حداقل دو بازی مستقل را انتخاب کن. این رقابت در دستهٔ جداگانه نمایش داده می‌شود.</p>{items.filter(item=>!item.is_mixed&&item.id!==editingId).map(item=><label className="check-row" key={item.slug}><input type="checkbox" checked={form.included_game_slugs.includes(item.slug)} onChange={e=>setForm(v=>({...v,included_game_slugs:e.target.checked?[...v.included_game_slugs,item.slug]:v.included_game_slugs.filter(slug=>slug!==item.slug)}))}/><span>{item.name}</span></label>)}</fieldset>}
      {error&&<p className="auth-inline-error" role="alert">{error}</p>}
      <button className="gold-button full-button" type="submit" disabled={busy}>{busy?'در حال ذخیره…':<><Save size={16}/>{editingId?'ذخیره تغییرات':'افزودن بازی'}</>}</button>
      {editingId&&<button type="button" className="outline-button full-button" onClick={reset} disabled={busy}>لغو ویرایش</button>}
    </form></section>}
    {selectedGame&&onSelect?(()=>{const chosen=items.find(item=>item.is_mixed?selectedGame==='__mixed__':item.name===selectedGame);return chosen?<div className="selected-game-banner">{chosen.image_url?<img src={chosen.image_url} alt={chosen.name}/>:<div className="game-card-placeholder"><Gamepad2 size={30}/></div>}<div><span className="section-kicker">مسابقات اختصاصی بازی</span><h2>{chosen.name}</h2>{chosen.description&&<p>{chosen.description}</p>}</div><button type="button" className="outline-button" onClick={()=>onSelect('')}>بازگشت به بازی‌ها</button></div>:<div className="game-catalog-heading"><div><span className="section-kicker">بازی‌ها و رقابت‌ها</span><h2>انتخاب بازی</h2></div><button type="button" className="outline-button" onClick={()=>onSelect('')}>بازگشت به بازی‌ها</button></div>})():<div className="game-catalog-heading"><div><span className="section-kicker">بازی‌ها و رقابت‌ها</span><h2>انتخاب بازی</h2></div></div>}
    {loading?<div className="panel empty-state">در حال دریافت فهرست بازی‌ها…</div>:error&&!owner?<p className="auth-inline-error" role="alert">{error}</p>:items.length===0?<div className="panel empty-state"><Gamepad2 size={28}/><strong>هنوز بازی فعالی ثبت نشده است</strong><span>{owner?'از فرم بالا بازی جدید اضافه کن.':'بازی‌ها هنوز توسط مالک سایت تعریف نشده‌اند.'}</span></div>:selectedGame&&onSelect?null:<div className="game-catalog-grid">{items.map(item=><article className="panel game-catalog-card" key={item.id} onClick={()=>onSelect?.(item.is_mixed?'__mixed__':item.name)} role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} onKeyDown={e=>{if(onSelect&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onSelect(item.is_mixed?'__mixed__':item.name);}}}>{item.image_url?<img src={item.image_url} alt="" loading="lazy"/>:<div className="game-card-placeholder">{item.is_mixed?<Layers3 size={32}/>:<Gamepad2 size={32}/>}</div>}<div className="game-card-copy"><h3>{item.name}</h3>{item.description&&<p>{item.description}</p>}<small>{(activeCounts[item.name]||0).toLocaleString('fa-IR')} مسابقه فعال</small>{item.is_mixed&&<><small>مسابقات ترکیبی</small><div className="mixed-game-tags">{(item.included_game_slugs||[]).map(slug=>{const game=items.find(entry=>entry.slug===slug);return <span key={slug}>{game?.image_url?<img src={game.image_url} alt="" loading="lazy"/>:<Gamepad2 size={14}/>} {game?.name||slug}</span>;})}</div></>}{owner&&!item.enabled&&<small>غیرفعال · فقط مالک</small>}</div>{owner&&<div className="game-admin-actions" onClick={e=>e.stopPropagation()}><button type="button" className="outline-button" onClick={()=>edit(item)} disabled={busy}><Pencil size={14}/> ویرایش</button></div>}</article>)}</div>}
    {owner&&error&&<p className="auth-inline-error" role="alert">{error}</p>}
  </section>;
}
