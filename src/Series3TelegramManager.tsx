import React, { useEffect, useMemo, useState } from 'react';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabase } from './supabase';

type SectionOption = { id: string; label: string };
type PredictionCampaign = { id:string; title:string; description:string; campaign_type:string; status:string; is_open:boolean; opens_at:string|null; closes_at:string|null; questions:Array<{id:string;label:string;type?:string;options?:string[]}>; prize_rules:any };
type PreviewMessage = { section_id: string; title: string; text: string; plain_text: string; item_count: number };
type ApiResult = { ok?: boolean; error?: string; messages?: PreviewMessage[]; sent?: boolean; destination?: 'test_group'|'series3_channel'; results?: Array<{section_id:string;message_id:number}>; sent_count?: number; failed_section?: string };

const groups = 'ABCDEFGHIJKL'.split('');
const sections: { title: string; description: string; items: SectionOption[] }[] = [
  { title: 'رتبه‌بندی و آمار ۴۸ بازیکن', description: 'فهرست کامل بر اساس درصد برد و معیارهای ثبت‌شده', items: [{ id: 'ranking', label: 'جدول کامل رتبه‌بندی ۴۸ نفر' }] },
  { title: 'سیدبندی', description: 'هر سید جداگانه قابل انتشار است', items: [1,2,3,4].map(n => ({ id: 'pot:'+n, label: 'سید '+n+' · ۱۲ بازیکن' })) },
  { title: 'گروه‌بندی', description: 'هر گروه A تا L یک پیام مستقل دارد', items: groups.map(g => ({ id: 'group:'+g, label: 'گروه '+g })) },
  { title: 'برنامه روزانه مرحله گروهی', description: 'پیش‌نمایش و ارسال برنامه کامل هر روز یا فقط برنامه یک گروه', items: [1,2,3].flatMap(day => [
    { id: 'fixtures:day:'+day+':ALL', label: 'روز '+day+' · همه گروه‌ها (۲۴ بازی)' },
    ...groups.map(g => ({ id: 'fixtures:day:'+day+':'+g, label: 'روز '+day+' · گروه '+g+' (۲ بازی)' }))
  ]) },
  { title: 'مراحل حذفی', description: 'هر مرحله جداگانه و بر اساس براکت ذخیره‌شده', items: [
    { id: 'bracket:round32', label: 'مرحله ۳۲ نفره · ۱۶ مسابقه' },
    { id: 'bracket:round16', label: 'مرحله ۱۶ نفره · ۸ مسابقه' },
    { id: 'bracket:quarterfinals', label: 'یک‌چهارم نهایی · ۴ مسابقه' },
    { id: 'bracket:semifinals', label: 'نیمه‌نهایی · ۲ مسابقه' },
    { id: 'bracket:final', label: 'فینال · ۱ مسابقه' },
  ] },
];

const allIds = sections.flatMap(s => s.items.map(i => i.id));
const goldButton: React.CSSProperties = { background:'linear-gradient(120deg,#a98239,#e4c77e)', border:'1px solid #e3c77d', borderRadius:8, color:'#17130b', padding:'11px 14px', fontWeight:800, cursor:'pointer' };
const darkButton: React.CSSProperties = { background:'#211b12', border:'1px solid #806638', borderRadius:8, color:'#e4c77e', padding:'10px 12px', cursor:'pointer' };
const panel: React.CSSProperties = { marginTop:18, padding:16, border:'1px solid #8c6a34', borderRadius:14, background:'linear-gradient(145deg,#211b12,#111214)', color:'#f2ead8' };
const muted: React.CSSProperties = { color:'#c9c0b0', fontSize:12, lineHeight:1.8 };
const fa = (n:number) => n.toLocaleString('fa-IR');

export default function Series3TelegramManager() {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [campaigns, setCampaigns] = useState<PredictionCampaign[]>([]);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState('');

  useEffect(() => { if (expanded) void refreshCampaigns(); }, [expanded]);

  const selectedCount = selected.length;
  const previewCount = useMemo(() => preview.length, [preview]);
  async function refreshCampaigns() {
    if (!supabase) { setPredictionError('اتصال به دیتابیس برقرار نیست.'); return; }
    setPredictionLoading(true); setPredictionError('');
    try {
      const {data,error}=await supabase.from('plato_land_prediction_campaigns').select('id,title,description,campaign_type,status,is_open,opens_at,closes_at,questions,prize_rules').eq('event_key','series3').eq('status','published').order('created_at',{ascending:false});
      if (error) throw error;
      setCampaigns((data||[]) as PredictionCampaign[]);
    } catch (e) { setPredictionError('دریافت پیش‌بینی‌های منتشرشده ناموفق بود: '+(e instanceof Error?e.message:'خطای نامشخص')); }
    finally { setPredictionLoading(false); }
  }

  function toggle(id:string) {
    setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current,id]);
    setPreview([]);
    setNotice('');
  }
  function toggleCategory(items:SectionOption[]) {
    const ids=items.map(x=>x.id);
    const all=ids.every(id=>selected.includes(id));
    setSelected(current=>all?current.filter(id=>!ids.includes(id)):[...new Set([...current,...ids])]);
    setPreview([]);
    setNotice('');
  }
  function selectAll() {
    const availableIds=[...allIds,...campaigns.map(c=>'prediction:'+c.id)];
    setSelected(current=>current.length===availableIds.length?[]:availableIds);
    setPreview([]);
    setNotice('');
  }

  async function callApi(action:'preview'|'send') {
    if(!supabase){setError('اتصال به حساب مدیریت برقرار نیست.');return null;}
    const {data,error:sessionError}=await supabase.auth.getSession();
    if(sessionError)throw sessionError;
    const token=data.session?.access_token;
    if(!token)throw new Error('نشست مالک معتبر نیست؛ دوباره وارد پنل شو.');
    const response=await fetch(SUPABASE_URL+'/functions/v1/plato-land-series3-telegram',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({action,sections:selected}),
      cache:'no-store',
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok){
      const partial=result.sent_count>0?' · '+fa(Number(result.sent_count))+' پیام پیش از بروز خطا ارسال شده است.':'';
      throw new Error((result.error||'درخواست به سرویس تلگرام ناموفق بود.')+partial);
    }
    return result as ApiResult;
  }

  async function makePreview() {
    if(selected.length===0){setError('حداقل یک مورد را برای پیش‌نمایش انتخاب کن.');return;}
    setBusy(true);setError('');setNotice('');setPreview([]);
    try{
      const result=await callApi('preview');
      if(!result?.ok||!result.messages?.length)throw new Error(result?.error||'برای انتخاب‌های فعلی پیام قابل تهیه نیست.');
      setPreview(result.messages);
      const target=result.destination==='series3_channel'?'کانال سری سوم':'گروه آزمایشی PLATO LAND';
      setNotice('پیش‌نمایش آماده شد. مقصد تعیین‌شده: '+target+'؛ هر مورد یک پیام مستقل است.');
    }catch(e){setError(e instanceof Error?e.message:'تهیه پیش‌نمایش ناموفق بود.');}
    finally{setBusy(false);}
  }

  async function sendSelected() {
    if(selected.length===0){setError('ابتدا موارد موردنظر را انتخاب کن.');return;}
    if(preview.length===0){setError('قبل از ارسال، ابتدا پیش‌نمایش را تهیه و بررسی کن.');return;}
    const target=selected.some(id=>id.startsWith('prediction:'))?'کانال سری سوم':'گروه آزمایشی PLATO LAND';
    const approved=window.confirm('آیا ارسال '+fa(preview.length)+' پیام انتخاب‌شده به '+target+' را تأیید می‌کنی؟');
    if(!approved)return;
    setSending(true);setError('');setNotice('');
    try{
      const result=await callApi('send');
      if(!result?.sent)throw new Error(result?.error||'ارسال تلگرام کامل نشد.');
      setNotice('ارسال انجام شد: '+fa(result.sent_count||0)+' پیام به '+(result.destination==='series3_channel'?'کانال سری سوم':'گروه آزمایشی PLATO LAND')+'. شناسه پیام‌ها ثبت شد.');
      setPreview([]);
    }catch(e){setError(e instanceof Error?e.message:'ارسال پیام ناموفق بود.');}
    finally{setSending(false);}
  }

  return <section dir="rtl" style={panel}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
      <div style={{minWidth:0}}>
        <h2 style={{color:'#f6e8c5',fontSize:20,margin:'0 0 5px'}}>مرکز اطلاع‌رسانی تلگرام · سری سوم</h2>
        <p style={{...muted,margin:0}}>انتخاب بخش‌ها، بررسی متن نهایی و ارسال دستی به گروه آزمایشی PLATO LAND</p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><span style={{fontSize:11,color:'#d9bd7d',border:'1px solid #705b31',borderRadius:20,padding:'6px 10px'}}>فقط گروه آزمایشی</span><button type="button" style={darkButton} onClick={()=>setExpanded(v=>!v)}>{expanded?'بستن مرکز تلگرام':'ورود به مرکز تلگرام'}</button></div>
    </div>

    {expanded&&<>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>
      <button type="button" style={darkButton} onClick={selectAll}>{selectedCount===allIds.length?'لغو انتخاب همه':'انتخاب همه موارد'}</button>
      <span style={{...muted,alignSelf:'center'}}>انتخاب‌شده: {fa(selectedCount)} مورد</span>
    </div>

    <div style={{display:'grid',gap:11,marginTop:14}}>
      {sections.map(section=><details key={section.title} style={{border:'1px solid #5a482a',borderRadius:10,padding:12,background:'#151515'}}>
        <summary style={{cursor:'pointer',color:'#f0d99f',fontSize:14,fontWeight:800}}>{section.title}<div style={muted}>{section.description}</div></summary>
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:9}}>
          <button type="button" style={darkButton} onClick={()=>toggleCategory(section.items)}>
            {section.items.every(item=>selected.includes(item.id))?'لغو این بخش':'انتخاب این بخش'}
          </button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:7,marginTop:10}}>
          {section.items.map(item=><label key={item.id} style={{display:'flex',alignItems:'center',gap:8,minWidth:0,padding:'9px 8px',border:'1px solid '+(selected.includes(item.id)?'#b18b45':'#39352d'),borderRadius:8,background:selected.includes(item.id)?'#352a17':'#101112',fontSize:12,color:'#eee5d4',cursor:'pointer'}}>
            <input type="checkbox" checked={selected.includes(item.id)} onChange={()=>toggle(item.id)} style={{accentColor:'#d6b35f',width:17,height:17,flexShrink:0}}/>
            <span>{item.label}</span>
          </label>)}
        </div>
      </details>)}
    </div>

    <details open style={{...panel,marginTop:12,padding:12,background:'#111214'}}>
      <summary style={{cursor:'pointer',color:'#f0d99f',fontWeight:800}}>پیش‌بینی‌های منتشرشده سری سوم</summary>
      <p style={{...muted,margin:'8px 0'}}>کمپین‌های منتشرشده مستقیماً از دیتابیس اصلی خوانده می‌شوند. هر کمپین را انتخاب کن تا متن کامل و فهرست نامزدها برای تلگرام آماده شود.</p>
      <button type="button" style={darkButton} disabled={predictionLoading} onClick={()=>void refreshCampaigns()}>{predictionLoading?'در حال به‌روزرسانی…':'به‌روزرسانی فهرست پیش‌بینی‌ها'}</button>
      {predictionLoading?<p style={muted}>در حال دریافت پیش‌بینی‌ها…</p>:predictionError?<p role="alert" style={{color:'#ffc8c8',fontSize:12}}>{predictionError}</p>:campaigns.length===0?<p style={muted}>در حال حاضر پیش‌بینی منتشرشده‌ای برای سری سوم وجود ندارد.</p>:
        <div style={{display:'grid',gap:8,marginTop:10}}>{campaigns.map(c=>{
          const id='prediction:'+c.id; const checked=selected.includes(id);
          const questionCount=(c.questions||[]).reduce((n,q)=>n+(q.options?.length||0),0);
          return <label key={c.id} style={{display:'flex',alignItems:'flex-start',gap:9,padding:11,border:'1px solid '+(checked?'#b18b45':'#39352d'),borderRadius:8,background:checked?'#352a17':'#101112',cursor:'pointer'}}>
            <input type="checkbox" checked={checked} onChange={()=>toggle(id)} style={{accentColor:'#d6b35f',width:18,height:18,marginTop:2,flexShrink:0}}/>
            <span style={{minWidth:0}}><strong style={{display:'block',color:'#f0d99f',fontSize:13}}>{c.title}</strong><small style={{display:'block',...muted}}>{c.is_open?'دریافت پاسخ باز است':'دریافت پاسخ بسته است'} · {fa(questionCount)} گزینه</small></span>
          </label>;
        })}</div>}
    </details>

    <details style={{...panel,marginTop:12,padding:12,background:'#111214'}}>
      <summary style={{cursor:'pointer',color:'#f0d99f',fontWeight:800}}>برنامه و نتایج روزانه سری سوم</summary>
      <div style={{marginTop:8}}>
      <strong style={{color:'#f0d99f'}}>برنامه و نتایج روزانه سری سوم</strong>
      <p style={{...muted,margin:'5px 0 0'}}>بخش آماده برای اتصال به ثبت برنامه و نتایج سری سوم؛ پس از فعال‌شدن منبع رسمی مسابقات، انتخاب تاریخ شمسی، ارسال کل برنامه روز یا فقط گروه انتخابی و انتشار نتایج همان روز در همین کارت فعال می‌شود. در حال حاضر هیچ داده‌ای از سری دوم خوانده نمی‌شود.</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
        <span style={{fontSize:11,color:'#9d927d',border:'1px solid #4a4030',borderRadius:7,padding:'6px 9px'}}>تاریخ شمسی · در انتظار منبع سری سوم</span>
        <span style={{fontSize:11,color:'#9d927d',border:'1px solid #4a4030',borderRadius:7,padding:'6px 9px'}}>کل روز / گروه A تا L</span>
        <span style={{fontSize:11,color:'#9d927d',border:'1px solid #4a4030',borderRadius:7,padding:'6px 9px'}}>نتایج ثبت‌شده</span>
      </div>
      </div>
    </details>

    {error&&<div role="alert" style={{marginTop:12,padding:10,borderRadius:8,background:'#301819',color:'#ffc8c8',fontSize:12,lineHeight:1.8}}>{error}</div>}
    {notice&&<div role="status" style={{marginTop:12,padding:10,borderRadius:8,background:'#1c2b1c',color:'#b9e0b5',fontSize:12,lineHeight:1.8}}>{notice}</div>}

    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:13}}>
      <button type="button" style={goldButton} disabled={busy||sending||selectedCount===0} onClick={()=>void makePreview()}>{busy?'در حال آماده‌سازی…':'تهیه پیش‌نمایش پیام‌ها'}</button>
      <button type="button" style={darkButton} disabled={busy||sending||previewCount===0} onClick={()=>void sendSelected()}>{sending?'در حال ارسال…':'ارسال پیام‌های پیش‌نمایش‌شده'}</button>
      <button type="button" style={darkButton} disabled={busy||sending} onClick={()=>{setPreview([]);setError('');setNotice('');}}>پاک‌کردن پیش‌نمایش</button>
    </div>

    {preview.length>0&&<div style={{display:'grid',gap:10,marginTop:15}}>
      <div style={{color:'#e4c77e',fontWeight:800,fontSize:13}}>پیش‌نمایش · {fa(preview.length)} پیام مستقل</div>
      {preview.map((message,index)=><details key={message.section_id} style={{border:'1px solid #65512f',borderRadius:9,padding:12,background:'#0d0e10'}}>
        <summary style={{cursor:'pointer',display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}>
          <strong style={{color:'#f0d99f',fontSize:12}}>{fa(index+1)}. {message.title}</strong>
          <span style={{color:'#9e927b',fontSize:10}}>{fa(message.item_count)} مورد</span>
        </summary>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'inherit',fontSize:12,lineHeight:1.9,color:'#eee5d4',margin:'10px 0 0'}}>{message.plain_text}</pre>
      </details>)}
    </div>}
    <small style={{display:'block',color:'#9e927b',fontSize:10,lineHeight:1.8,marginTop:13}}>ارسال فقط پس از پیش‌نمایش و تأیید نهایی انجام می‌شود. پیام‌های پیش‌بینی به کانال سری سوم و سایر اطلاعیه‌ها به گروه آزمایشی می‌روند. مقصد از تنظیمات امن سرور خوانده می‌شود و از این پنل قابل تغییر نیست.</small>
    </>}
  </section>;
}
