import React, { useEffect, useMemo, useState } from 'react';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabase } from './supabase';

type SectionOption = { id: string; label: string };
type PredictionCampaign = { id:string; title:string; description:string; campaign_type:string; status:string; is_open:boolean; opens_at:string|null; closes_at:string|null; questions:Array<{id:string;label:string;type?:string;options?:string[]}>; prize_rules:any };
type PreviewMessage = { section_id: string; title: string; text: string; plain_text: string; item_count: number };
type ReportVoter = { id:string; voter_plato_id:string };
type PredictionRanking = { title:string; total_questions:number; rows:Array<{plato_id:string;correct:number;incorrect:number;remaining:number}> };
type ApiResult = { ok?: boolean; error?: string; messages?: PreviewMessage[]; ranking?: PredictionRanking; sent?: boolean; destination?: 'test_group'; results?: Array<{section_id:string;message_id:number}>; sent_count?: number; failed_section?: string; destination_results?: Array<{destination:string;label:string;status:'sent'|'partial'|'failed';sent_count:number;total_count:number;failed_section:string|null;error:string|null;results:Array<{section_id:string;message_id:number}>}>; history_saved?: boolean };

const groups = 'ABCDEFGHIJKL'.split('');
const sections: { title: string; description: string; items: SectionOption[] }[] = [
  { title: 'رتبه‌بندی و آمار ۴۸ بازیکن', description: 'فهرست کامل بر اساس درصد برد و معیارهای ثبت‌شده', items: [{ id: 'ranking', label: 'جدول کامل رتبه‌بندی ۴۸ نفر' }] },
  { title: 'سیدبندی', description: 'هر سید جداگانه قابل انتشار است', items: [1,2,3,4].map(n => ({ id: 'pot:'+n, label: 'سید '+n+' · ۱۲ بازیکن' })) },
  { title: 'گروه‌بندی', description: 'هر گروه A تا L یک پیام مستقل دارد', items: groups.map(g => ({ id: 'group:'+g, label: 'گروه '+g })) },
  { title: 'برنامه روزانه مرحله گروهی', description: 'پیش‌نمایش و ارسال برنامه کامل هر روز یا فقط برنامه یک گروه', items: [1,2,3].flatMap(day => [
    { id: 'fixtures:day:'+day+':ALL', label: 'روز '+day+' · همه گروه‌ها (۲۴ بازی)' },
    ...groups.map(g => ({ id: 'fixtures:day:'+day+':'+g, label: 'روز '+day+' · گروه '+g+' (۲ بازی)' }))
  ]) },
  { title: 'گزارش بازی‌ها و نتایج مراحل حذفی', description: 'هر دور یک گزارش مستقل؛ همه بازی‌ها، Plato ID بازیکنان، نتایج ثبت‌شده، برنده و بازی‌های در انتظار نتیجه', items: [
    { id: 'bracket:round32', label: 'سه‌شنبه ۳ آذر · یک‌شانزدهم نهایی · ۱۶ مسابقه' },
    { id: 'bracket:round16', label: 'چهارشنبه ۴ آذر · یک‌هشتم نهایی · ۸ مسابقه' },
    { id: 'bracket:quarterfinals', label: 'شنبه ۷ آذر · یک‌چهارم نهایی · ۴ مسابقه' },
    { id: 'bracket:semifinals', label: 'یکشنبه ۸ آذر · نیمه‌نهایی · ۲ مسابقه' },
    { id: 'bracket:thirdPlace', label: 'دوشنبه ۹ آذر · بازی رده‌بندی · ۱ مسابقه' },
    { id: 'bracket:final', label: 'دوشنبه ۹ آذر · فینال · ۱ مسابقه' },
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
  const [reportCampaigns, setReportCampaigns] = useState<PredictionCampaign[]>([]);
  const [destinations, setDestinations] = useState<string[]>(['test_group']);
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState('');
  const [reportCampaignId, setReportCampaignId] = useState('');
  const [reportVoters, setReportVoters] = useState<ReportVoter[]>([]);
  const [selectedReportVoters, setSelectedReportVoters] = useState<string[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [rankingImageData, setRankingImageData] = useState('');
  const [rankingImageBase64, setRankingImageBase64] = useState('');
  const [rankingImageBusy, setRankingImageBusy] = useState(false);
  const [dailySchedule, setDailySchedule] = useState<any>(null);
  const [dailyResults, setDailyResults] = useState<Array<{match_id:string;result_status:string;score_a:number|null;score_b:number|null}>>([]);
  const [dailyDay, setDailyDay] = useState('');
  const [dailyGroup, setDailyGroup] = useState('ALL');
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState('');

  useEffect(() => { if (expanded) { void refreshCampaigns(); void refreshDeliveryHistory(); void refreshDailyFixtures(); } }, [expanded]);

  async function refreshDailyFixtures() {
    if (!supabase) { setDailyError('اتصال به دیتابیس اصلی در دسترس نیست.'); return; }
    setDailyLoading(true); setDailyError('');
    try {
      const [scheduleResult, resultsResult] = await Promise.all([
        supabase.from('plato_land_series3_group_fixtures').select('schedule_snapshot').eq('event_key','series3').maybeSingle(),
        supabase.from('plato_land_series3_group_match_results').select('match_id,result_status,score_a,score_b').eq('event_key','series3'),
      ]);
      if (scheduleResult.error) throw scheduleResult.error;
      if (resultsResult.error) throw resultsResult.error;
      const snapshot = scheduleResult.data?.schedule_snapshot;
      if (!snapshot?.group_stage?.days?.length) throw new Error('برنامه رسمی مسابقات در دیتابیس پیدا نشد.');
      setDailySchedule(snapshot);
      setDailyResults((resultsResult.data || []) as Array<{match_id:string;result_status:string;score_a:number|null;score_b:number|null}>);
      setDailyDay((current:string) => current || snapshot.group_stage.days[0].date);
    } catch (e) {
      setDailyError('دریافت برنامه و نتایج روزانه ناموفق بود: '+(e instanceof Error?e.message:'خطای نامشخص'));
    } finally { setDailyLoading(false); }
  }

  function addDailyFixtureSelection() {
    if (!dailyDay || !dailySchedule) { setDailyError('ابتدا تاریخ مسابقات را انتخاب کن.'); return; }
    const day = dailySchedule.group_stage.days.find((item:any)=>item.date===dailyDay);
    if (!day) { setDailyError('تاریخ انتخاب‌شده در برنامه رسمی پیدا نشد.'); return; }
    const id = 'fixtures:day:'+day.round+':'+dailyGroup;
    setSelected(current=>current.includes(id)?current:[...current,id]);
    setPreview([]); setRankingImageData(''); setRankingImageBase64('');
    setDailyError('');
    setNotice('برنامه و نتایج '+day.persian_date+' · '+(dailyGroup==='ALL'?'همه گروه‌ها':'گروه '+dailyGroup)+' به فهرست پیش‌نمایش اضافه شد.');
  }

  async function refreshDeliveryHistory() {
    if (!supabase) return;
    setHistoryError('');
    const {data,error}=await supabase.from('plato_land_series3_telegram_delivery_history')
      .select('id,destination,status,total_count,sent_count,failed_section,error_message,created_at')
      .order('created_at',{ascending:false}).limit(20);
    if (error) { setHistoryError('تاریخچه در دسترس نیست؛ ابتدا مهاجرت دیتابیس باید اعمال شود.'); return; }
    setDeliveryHistory(data||[]);
  }

  const selectedCount = selected.length;
  const previewCount = useMemo(() => preview.length + (rankingImageBase64 ? 1 : 0), [preview, rankingImageBase64]);
  async function refreshCampaigns() {
    if (!supabase) { setPredictionError('اتصال به دیتابیس برقرار نیست.'); return; }
    setPredictionLoading(true); setPredictionError('');
    try {
      const [publishedResult, reportResult] = await Promise.all([
        supabase.from('plato_land_prediction_campaigns').select('id,title,description,campaign_type,status,is_open,opens_at,closes_at,questions,prize_rules').eq('event_key','series3').eq('status','published').order('created_at',{ascending:false}),
        supabase.from('plato_land_prediction_campaigns').select('id,title,description,campaign_type,status,is_open,opens_at,closes_at,questions,prize_rules').eq('event_key','series3').in('status',['published','closed']).order('created_at',{ascending:false}),
      ]);
      if (publishedResult.error) throw publishedResult.error;
      if (reportResult.error) throw reportResult.error;
      setCampaigns((publishedResult.data||[]) as PredictionCampaign[]);
      setReportCampaigns((reportResult.data||[]) as PredictionCampaign[]);
    } catch (e) { setPredictionError('دریافت پیش‌بینی‌های منتشرشده ناموفق بود: '+(e instanceof Error?e.message:'خطای نامشخص')); }
    finally { setPredictionLoading(false); }
  }

  async function loadReportVoters(campaignId:string) {
    setReportCampaignId(campaignId); setReportVoters([]); setSelectedReportVoters([]);
    setPreview([]); setRankingImageData(''); setRankingImageBase64(''); setReportError('');
    if(!campaignId || !supabase) return;
    setReportLoading(true);
    try {
      const {data,error}=await supabase.from('plato_land_prediction_entries')
        .select('id,voter_plato_id').eq('campaign_id',campaignId).order('submitted_at',{ascending:true});
      if(error) throw error;
      setReportVoters((data||[]) as ReportVoter[]);
    } catch(e) {
      setReportError('دریافت فهرست رأی‌دهندگان ممکن نشد: '+(e instanceof Error?e.message:'خطای نامشخص'));
    } finally { setReportLoading(false); }
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

  async function callApi(action:'preview'|'send', options:{rankingImage?:boolean;imageBase64?:string}={}) {
    if(!supabase){setError('اتصال به حساب مدیریت برقرار نیست.');return null;}
    const {data,error:sessionError}=await supabase.auth.getSession();
    if(sessionError)throw sessionError;
    const token=data.session?.access_token;
    if(!token)throw new Error('نشست مالک معتبر نیست؛ دوباره وارد پنل شو.');
    const response=await fetch(SUPABASE_URL+'/functions/v1/plato-land-series3-telegram',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({action,sections:selected,destinations,report_campaign_id:reportCampaignId||undefined,report_voter_ids:options.rankingImage?undefined:(selectedReportVoters.length?selectedReportVoters:undefined),report_ranking_image:options.rankingImage===true||undefined,ranking_image_base64:options.imageBase64||undefined}),
      cache:'no-store',
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok && !Array.isArray(result.destination_results)){
      const partial=result.sent_count>0?' · '+fa(Number(result.sent_count))+' پیام پیش از بروز خطا ارسال شده است.':'';
      throw new Error((result.error||'درخواست به سرویس تلگرام ناموفق بود.')+partial);
    }
    return result as ApiResult;
  }

  async function makeRankingImagePreview() {
    if(!reportCampaignId){setError('ابتدا کمپین پیش‌بینی بازی‌ها را انتخاب کن.');return;}
    if(destinations.length===0){setError('حداقل یک مقصد تلگرام را انتخاب کن.');return;}
    setRankingImageBusy(true);setError('');setNotice('');setPreview([]);setRankingImageData('');setRankingImageBase64('');
    try {
      const result=await callApi('preview',{rankingImage:true});
      const ranking=result?.ranking as PredictionRanking|undefined;
      if(!result?.ok||!ranking||!ranking.rows?.length) throw new Error(result?.error||'اطلاعات رتبه‌بندی برای تصویر آماده نیست.');
      const width=1080, rowHeight=104, top=390, height=top+ranking.rows.length*rowHeight+190;
      const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
      const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('ساخت تصویر در این مرورگر پشتیبانی نمی‌شود.');
      ctx.fillStyle='#0b0c0e';ctx.fillRect(0,0,width,height);
      const rounded=(x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string)=>{
        ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
        ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}
      };
      rounded(28,28,width-56,height-56,28,'#101113','#8e6b34');
      ctx.textAlign='center';ctx.direction='ltr';ctx.fillStyle='#d9b96e';ctx.font='bold 42px Arial';ctx.fillText('♛ PLATO LAND',width/2,105);
      ctx.direction='rtl';ctx.fillStyle='#f4e5c4';ctx.font='bold 48px Arial';ctx.fillText('رتبه‌بندی شرکت‌کنندگان',width/2,190);
      ctx.fillStyle='#c6b99f';
      let subtitleFontSize=30;
      const rankingSubtitle=(ranking.title||'پیش‌بینی بازی‌ها')+' · سری سوم لیگ تخته‌نرد';
      ctx.font=subtitleFontSize+'px Arial';
      while(ctx.measureText(rankingSubtitle).width>940 && subtitleFontSize>20){subtitleFontSize-=1;ctx.font=subtitleFontSize+'px Arial';}
      ctx.fillText(rankingSubtitle,width/2,250);
      ctx.fillStyle='#d9b96e';ctx.font='26px Arial';ctx.fillText('مبنای رتبه‌بندی: تعداد پیش‌بینی‌های درست',width/2,305);
      ctx.fillStyle='#9e927d';ctx.font='23px Arial';ctx.fillText('بدون امتیازدهی وزنی',width/2,345);
      ranking.rows.forEach((row,index)=>{
        const y=top+index*rowHeight;
        rounded(65,y,width-130,84,16,index%2===0?'#17191c':'#111315','#4b402c');
        // Right-to-left column order: rank, Plato ID, incorrect, correct, remaining.
        // Rank badge is anchored at the far right, with the ID immediately to its left.
        rounded(950,y+12,64,60,13,'#2a2418','#9b783d');
        ctx.direction='ltr';ctx.textAlign='center';ctx.fillStyle='#e5c477';ctx.font='bold 30px Arial';
        ctx.fillText(String(index+1).padStart(2,'0'),982,y+52);
        const stats=[{x:235,label:'باقی‌مانده',value:row.remaining,color:'#d9b96e'},{x:390,label:'درست',value:row.correct,color:'#9ed29c'},{x:545,label:'غلط',value:row.incorrect,color:'#e49a9a'}];
        stats.forEach(stat=>{
          rounded(stat.x-65,y+8,130,68,12,'#202226');
          ctx.direction='rtl';ctx.textAlign='center';ctx.fillStyle=stat.color;ctx.font='bold 50px Arial';
          ctx.fillText(new Intl.NumberFormat('fa-IR').format(stat.value),stat.x,y+48);
          ctx.fillStyle='#c9c0b0';ctx.font='19px Arial';ctx.fillText(stat.label,stat.x,y+70);
        });
        // Divider separates the statistic cards from the dedicated Plato ID lane.
        ctx.beginPath();ctx.moveTo(640,y+13);ctx.lineTo(640,y+71);ctx.strokeStyle='#65502d';ctx.lineWidth=2;ctx.stroke();
        const idLeft=660,idRight=925,idWidth=idRight-idLeft;
        rounded(idLeft,y+7,idWidth,70,12,'#292318','#8e6b34');
        ctx.save();ctx.beginPath();ctx.rect(idLeft+12,y+5,idWidth-24,74);ctx.clip();
        ctx.direction='ltr';ctx.textAlign='right';ctx.fillStyle='#fff0d2';
        let idFontSize=38;ctx.font='bold '+idFontSize+'px Arial';
        while(ctx.measureText(row.plato_id).width>idWidth-32 && idFontSize>22){idFontSize-=1;ctx.font='bold '+idFontSize+'px Arial';}
        ctx.fillText(row.plato_id,idRight-18,y+54);ctx.restore();
      });
      const footerY=top+ranking.rows.length*rowHeight+72;
      ctx.direction='rtl';ctx.textAlign='center';ctx.fillStyle='#d9b96e';ctx.font='26px Arial';ctx.fillText('بازی، رقابت، قهرمانی',width/2,footerY);
      ctx.fillStyle='#8e846f';ctx.font='20px Arial';ctx.fillText(new Intl.NumberFormat('fa-IR').format(ranking.rows.length)+' شرکت‌کننده · '+new Intl.NumberFormat('fa-IR').format(ranking.total_questions)+' پرسش',width/2,footerY+42);
      const dataUrl=canvas.toDataURL('image/png'); const base64=dataUrl.split(',')[1]||'';
      if(!base64) throw new Error('تبدیل تصویر به PNG ناموفق بود.');
      setRankingImageData(dataUrl);setRankingImageBase64(base64);
      setNotice('تصویر رتبه‌بندی آماده شد. قبل از ارسال، تمام ردیف‌ها و اعداد را بررسی کن.');
    } catch(e) {setError(e instanceof Error?e.message:'ساخت تصویر رتبه‌بندی ناموفق بود.');}
    finally {setRankingImageBusy(false);}
  }

  async function makePreview() {
    if(selected.length===0 && !(reportCampaignId && selectedReportVoters.length)){setError('حداقل یک مورد یا رأی‌دهنده را برای پیش‌نمایش انتخاب کن.');return;}
    if(destinations.length===0){setError('حداقل یک مقصد تلگرام را انتخاب کن.');return;}
    setBusy(true);setError('');setNotice('');setPreview([]);setRankingImageData('');setRankingImageBase64('');
    try{
      const result=await callApi('preview');
      if(!result?.ok||!result.messages?.length)throw new Error(result?.error||'برای انتخاب‌های فعلی پیام قابل تهیه نیست.');
      setPreview(result.messages);
      const target=destinations.map(id=>id==='test_group'?'گروه آزمایشی':'کانال اصلی').join(' و ');
      setNotice('پیش‌نمایش آماده شد. مقصدهای انتخاب‌شده: '+target+'؛ هر مورد یک پیام مستقل است.');
    }catch(e){setError(e instanceof Error?e.message:'تهیه پیش‌نمایش ناموفق بود.');}
    finally{setBusy(false);}
  }

  async function sendSelected() {
    const rankingImageSending=Boolean(reportCampaignId&&rankingImageBase64);
    if(selected.length===0 && !(reportCampaignId && selectedReportVoters.length) && !rankingImageSending){setError('ابتدا موارد یا رأی‌دهندگان موردنظر را انتخاب کن.');return;}
    if(destinations.length===0){setError('حداقل یک مقصد تلگرام را انتخاب کن.');return;}
    if(preview.length===0 && !rankingImageBase64){setError('قبل از ارسال، ابتدا پیش‌نمایش را تهیه و بررسی کن.');return;}
    const target=destinations.map(id=>id==='test_group'?'گروه آزمایشی':'کانال اصلی').join(' و ');
    const reportSending=Boolean((reportCampaignId&&selectedReportVoters.length>0)||rankingImageSending);
    const warning=rankingImageSending?' این تصویر شامل Plato ID و آمار پیش‌بینی شرکت‌کنندگان است و برای اعضای مقصد قابل مشاهده خواهد بود.':reportSending?' این گزارش‌ها شامل Plato ID و پیش‌بینی هر رأی‌دهنده است و در مقصد انتخاب‌شده برای اعضای آن قابل مشاهده خواهد بود.':'';
    const approved=window.confirm('آیا ارسال '+fa(previewCount)+' مورد به هر مقصد انتخاب‌شده ('+target+') را تأیید می‌کنی؟'+warning);
    if(!approved)return;
    setSending(true);setError('');setNotice('');
    try{
      const result=await callApi('send',rankingImageSending?{rankingImage:true,imageBase64:rankingImageBase64}:{});
      const perDestination=(result?.destination_results||[]).map((item:any)=>item.label+': '+(item.status==='sent'?'موفق':item.status==='partial'?'ناقص':'ناموفق')+' ('+fa(item.sent_count)+' از '+fa(item.total_count)+')').join('؛ ');
      const historyWarning=result?.history_saved===false?' هشدار: نتیجه ارسال در تاریخچه دیتابیس ذخیره نشد.':'';
      const destinationResults=result?.destination_results||[];
      const anyDelivered=destinationResults.some((item:any)=>item.sent_count>0);
      const retryableDestinations=destinationResults
        .filter((item:any)=>item.sent_count===0 && item.status==='failed')
        .map((item:any)=>item.destination);
      if(anyDelivered){
        // Never leave a preview armed for destinations that may already contain messages.
        // A partially delivered destination must not be retried wholesale.
        setPreview([]);setRankingImageData('');setRankingImageBase64('');
        setDestinations(retryableDestinations);
        const retryNote=retryableDestinations.length
          ? ' پیش‌نمایش پاک شد؛ فقط مقصدهای کاملاً ناموفق انتخاب شدند. برای تلاش مجدد، پیش‌نمایش تازه تهیه کن.'
          : ' پیش‌نمایش پاک شد تا پیام‌های ارسال‌شده دوباره فرستاده نشوند. مقصدی برای تلاش مجدد خودکار انتخاب نشده است.';
        setNotice((perDestination||'نتیجه ارسال دریافت نشد.')+historyWarning+retryNote);
      }else{
        // No destination accepted any message, so retry remains safe after reviewing the result.
        setNotice((perDestination||'هیچ پیامی ارسال نشد؛ پس از رفع علت می‌توانی دوباره تلاش کنی.')+historyWarning);
      }
      await refreshDeliveryHistory();
    }catch(e){setError(e instanceof Error?e.message:'ارسال پیام ناموفق بود.');}
    finally{setSending(false);}
  }

  return <section dir="rtl" style={panel}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
      <div style={{minWidth:0}}>
        <h2 style={{color:'#f6e8c5',fontSize:20,margin:'0 0 5px'}}>مرکز اطلاع‌رسانی تلگرام · سری سوم</h2>
        <p style={{...muted,margin:0}}>انتخاب بخش‌ها، بررسی متن نهایی و ارسال دستی به مقصدهای تلگرام</p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}><span style={{fontSize:11,color:'#d9bd7d',border:'1px solid #705b31',borderRadius:20,padding:'6px 10px'}}>انتخاب مقصد</span><button type="button" style={darkButton} onClick={()=>setExpanded(v=>!v)}>{expanded?'بستن مرکز تلگرام':'ورود به مرکز تلگرام'}</button></div>
    </div>

    {expanded&&<>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>
      <button type="button" style={darkButton} onClick={selectAll}>{selectedCount===allIds.length?'لغو انتخاب همه':'انتخاب همه موارد'}</button>
      <span style={{...muted,alignSelf:'center'}}>انتخاب‌شده: {fa(selectedCount)} مورد</span>
    </div>

    <section style={{...panel,marginTop:12,padding:12,background:'#111214'}}>
      <strong style={{color:'#f0d99f',fontSize:14}}>مقصد ارسال (فقط مالک)</strong>
      <p style={{...muted,margin:'5px 0 10px'}}>می‌توانی یک مقصد یا هر دو را انتخاب کنی. ارسال همچنان دستی و پس از پیش‌نمایش و تأیید است.</p>
      {[
        {id:'test_group',label:'فقط گروه آزمایشی'},
        {id:'main_channel',label:'فقط کانال اصلی'},
      ].map(option=><label key={option.id} style={{display:'flex',gap:9,alignItems:'center',padding:'8px 0',color:'#eee5d4',fontSize:13}}>
        <input type="checkbox" checked={destinations.includes(option.id)} onChange={()=>{setDestinations(current=>current.includes(option.id)?current.filter(x=>x!==option.id):[...current,option.id]);setPreview([]);setRankingImageData('');setRankingImageBase64('');setNotice('');}} style={{accentColor:'#d6b35f',width:18,height:18}}/>
        {option.label}
      </label>)}
      {destinations.length===0&&<p style={{color:'#ffc8c8',fontSize:12}}>برای پیش‌نمایش و ارسال، حداقل یک مقصد انتخاب کن.</p>}
    </section>

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
      <summary style={{cursor:'pointer',color:'#f0d99f',fontWeight:800}}>گزارش نتایج پیش‌بینی‌ها · فقط مالک</summary>
      <p style={{...muted,margin:'8px 0'}}>کمپین‌های منتشرشده و بسته‌شده قابل گزارش هستند؛ بستن مهلت پیش‌بینی، پاسخ‌های ثبت‌شده را از گزارش حذف نمی‌کند. برای هر رأی‌دهنده یک پیام مستقل ساخته می‌شود و ارسال فقط توسط Owner و پس از بررسی پیش‌نمایش و تأیید نهایی انجام می‌شود.</p>
      <label style={{display:'grid',gap:7,color:'#eee5d4',fontSize:12}}>
        انتخاب کمپین
        <select value={reportCampaignId} onChange={e=>void loadReportVoters(e.target.value)} style={{background:'#171717',color:'#f0d99f',border:'1px solid #806638',borderRadius:8,padding:10}}>
          <option value="">یک کمپین انتخاب کن</option>
          {reportCampaigns.filter(c=>c.campaign_type==='champion'||c.campaign_type==='match_predictions').map(c=><option key={c.id} value={c.id}>{c.title} · {c.campaign_type==='champion'?'قهرمانی':'پیش‌بینی بازی‌ها'}{c.status==='closed'?' · بسته‌شده':''}</option>)}
        </select>
      </label>
      {reportLoading?<p style={muted}>در حال دریافت رأی‌دهندگان…</p>:reportError?<p role="alert" style={{color:'#ffc8c8',fontSize:12}}>{reportError}</p>:reportCampaignId&&reportVoters.length===0?<p style={muted}>برای این کمپین رأی‌دهنده‌ای ثبت نشده است.</p>:reportVoters.length>0&&<>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:10}}>
          <strong style={{color:'#f0d99f',fontSize:12}}>رأی‌دهندگان: {fa(reportVoters.length)} نفر</strong>
          <button type="button" style={darkButton} onClick={()=>setSelectedReportVoters(selectedReportVoters.length===reportVoters.length?[]:reportVoters.map(v=>v.id))}>{selectedReportVoters.length===reportVoters.length?'لغو انتخاب همه':'انتخاب همه رأی‌دهندگان'}</button>
          <button type="button" style={goldButton} disabled={rankingImageBusy||reportLoading||!reportCampaignId} onClick={()=>void makeRankingImagePreview()}>{rankingImageBusy?'در حال ساخت تصویر…':'تهیه تصویر رتبه‌بندی'}</button>
          <span style={muted}>انتخاب‌شده: {fa(selectedReportVoters.length)}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:7,marginTop:9}}>
          {reportVoters.map(v=><label key={v.id} style={{display:'flex',gap:8,alignItems:'center',padding:9,border:'1px solid '+(selectedReportVoters.includes(v.id)?'#b18b45':'#39352d'),borderRadius:8,background:selectedReportVoters.includes(v.id)?'#352a17':'#101112',color:'#eee5d4',fontSize:12}}>
            <input type="checkbox" checked={selectedReportVoters.includes(v.id)} onChange={()=>setSelectedReportVoters(cur=>cur.includes(v.id)?cur.filter(id=>id!==v.id):[...cur,v.id])} style={{accentColor:'#d6b35f',width:17,height:17}}/>
            {v.voter_plato_id}
          </label>)}
        </div>
      </>}
      {rankingImageData&&<div style={{marginTop:12,border:'1px solid #806638',borderRadius:10,padding:8,background:'#0d0e10'}}><strong style={{display:'block',color:'#f0d99f',fontSize:12,marginBottom:8}}>پیش‌نمایش تصویر رتبه‌بندی</strong><img src={rankingImageData} alt="تصویر رتبه‌بندی پیش‌بینی‌کنندگان سری سوم" style={{display:'block',width:'100%',height:'auto',borderRadius:8}}/><button type="button" style={darkButton} onClick={()=>{setRankingImageData('');setRankingImageBase64('');}}>پاک‌کردن تصویر</button></div>}
      {reportCampaignId&&<p style={{...muted,marginTop:9}}>وضعیت نتایج از دیتابیس خوانده می‌شود. هر گزارش شامل Plato ID و پیش‌بینی همان رأی‌دهنده است و پس از تأیید Owner به مقصد انتخاب‌شده ارسال می‌شود؛ اعضای آن گروه یا کانال می‌توانند محتوای پیام را ببینند.</p>}
    </details>

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
        <p style={{...muted,margin:'5px 0 10px'}}>اطلاعات مستقیماً از برنامه ثابت و جدول نتایج سری سوم خوانده می‌شود. نتیجه‌های ثبت‌شده، بازی‌های در انتظار و عدم حضور دوطرفه در پیام تلگرام نمایش داده می‌شوند.</p>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <button type="button" style={darkButton} disabled={dailyLoading} onClick={()=>void refreshDailyFixtures()}>{dailyLoading?'در حال دریافت…':'به‌روزرسانی برنامه و نتایج'}</button>
          {dailySchedule&&<span style={muted}>{fa(dailySchedule.group_stage.match_count)} مسابقه رسمی</span>}
        </div>
        {dailyError&&<p role="alert" style={{color:'#ffc8c8',fontSize:12}}>{dailyError}</p>}
        {dailyLoading&&!dailySchedule?<p style={muted}>در حال دریافت اطلاعات از دیتابیس اصلی…</p>:dailySchedule&&<>
          <label style={{display:'grid',gap:6,color:'#eee5d4',fontSize:12,marginTop:10}}>تاریخ مسابقات
            <select value={dailyDay} onChange={e=>setDailyDay(e.target.value)} style={{background:'#171717',color:'#f0d99f',border:'1px solid #806638',borderRadius:8,padding:10}}>
              {dailySchedule.group_stage.days.map((day:any)=><option key={day.date} value={day.date}>{day.persian_date}</option>)}
            </select>
          </label>
          <label style={{display:'grid',gap:6,color:'#eee5d4',fontSize:12,marginTop:9}}>محدوده ارسال
            <select value={dailyGroup} onChange={e=>setDailyGroup(e.target.value)} style={{background:'#171717',color:'#f0d99f',border:'1px solid #806638',borderRadius:8,padding:10}}>
              <option value="ALL">کل روز · همه گروه‌ها</option>
              {groups.map(g=><option key={g} value={g}>فقط گروه {g}</option>)}
            </select>
          </label>
          {(()=>{const day=dailySchedule.group_stage.days.find((item:any)=>item.date===dailyDay);const matches=(day?.matches||[]).filter((m:any)=>dailyGroup==='ALL'||m.group===dailyGroup);const completed=matches.filter((m:any)=>dailyResults.find(r=>r.match_id===m.id)?.result_status==='completed').length;const noShow=matches.filter((m:any)=>dailyResults.find(r=>r.match_id===m.id)?.result_status==='double_no_show').length;return <div style={{...muted,marginTop:10}}>تعداد بازی: {fa(matches.length)} · نتیجه ثبت‌شده: {fa(completed)} · عدم حضور دوطرفه: {fa(noShow)} · در انتظار: {fa(matches.length-completed-noShow)}</div>;})()}
          <button type="button" style={{...goldButton,marginTop:10}} onClick={addDailyFixtureSelection}>افزودن برنامه و نتایج به پیش‌نمایش</button>
        </>}
      </div>
    </details>

    <details style={{...panel,marginTop:12,padding:12,background:'#111214'}}>
      <summary style={{cursor:'pointer',color:'#f0d99f',fontWeight:800}}>تاریخچه ارسال‌ها · ۲۰ مورد اخیر</summary>
      <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
        <button type="button" style={darkButton} onClick={()=>void refreshDeliveryHistory()}>به‌روزرسانی تاریخچه</button>
      </div>
      {historyError?<p style={{...muted,color:'#ffc8c8'}}>{historyError}</p>:deliveryHistory.length===0?<p style={muted}>هنوز سابقه‌ای ثبت نشده است.</p>:
        <div style={{display:'grid',gap:8,marginTop:9}}>{deliveryHistory.map(item=><div key={item.id} style={{border:'1px solid #4b412e',borderRadius:8,padding:9}}>
          <strong style={{color:'#f0d99f',fontSize:12}}>{item.destination==='test_group'?'گروه آزمایشی':'کانال اصلی'} · {item.status==='sent'?'موفق':item.status==='partial'?'ناقص':'ناموفق'}</strong>
          <div style={muted}>{new Date(item.created_at).toLocaleString('fa-IR')} · {fa(item.sent_count)} از {fa(item.total_count)} پیام</div>
          {item.error_message&&<div style={{color:'#ffc8c8',fontSize:11,marginTop:4}}>{item.error_message}</div>}
        </div>)}</div>}
    </details>

    {error&&<div role="alert" style={{marginTop:12,padding:10,borderRadius:8,background:'#301819',color:'#ffc8c8',fontSize:12,lineHeight:1.8}}>{error}</div>}
    {notice&&<div role="status" style={{marginTop:12,padding:10,borderRadius:8,background:'#1c2b1c',color:'#b9e0b5',fontSize:12,lineHeight:1.8}}>{notice}</div>}

    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:13}}>
      <button type="button" style={goldButton} disabled={busy||sending||(selectedCount===0&&!(reportCampaignId&&selectedReportVoters.length>0))||destinations.length===0} onClick={()=>void makePreview()}>{busy?'در حال آماده‌سازی…':'تهیه پیش‌نمایش پیام‌ها'}</button>
      <button type="button" style={darkButton} disabled={busy||sending||previewCount===0||destinations.length===0} onClick={()=>void sendSelected()}>{sending?'در حال ارسال…':rankingImageBase64?'ارسال تصویر رتبه‌بندی':'ارسال پیام‌های پیش‌نمایش‌شده'}</button>
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
    <small style={{display:'block',color:'#9e927b',fontSize:10,lineHeight:1.8,marginTop:13}}>ارسال فقط پس از پیش‌نمایش و تأیید نهایی انجام می‌شود. پیام‌ها فقط به مقصدهای انتخاب‌شده ارسال می‌شوند؛ گزارش هر مقصد مستقل ثبت می‌شود.</small>
    </>}
  </section>;
}
