import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

type RequestRow = { id: string; plato_id: string; created_at: string };

export default function Series2RegistrationReport() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setError('اتصال به پایگاه داده برقرار نیست.'); setLoading(false); return; }
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.functions.invoke('plato-land-series2-registration-report');
    if (queryError) {
      setError('دریافت گزارش ناموفق بود: ' + queryError.message);
      setRows([]);
    } else {
      setRows((data?.requests || []) as RequestRow[]);
      setUpdatedAt(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const capacity = 48;
  const remaining = Math.max(0, capacity - rows.length);
  const fa = (value: number) => value.toLocaleString('fa-IR');
  const date = (value: string) => new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Copenhagen'
  }).format(new Date(value));

  return <section dir="rtl" aria-labelledby="series2-report-title" style={{marginTop:28,border:'1px solid #705b31',borderRadius:14,padding:18,background:'#171819'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
      <div>
        <h2 id="series2-report-title" style={{margin:'0 0 6px',color:'#f6e8c5',fontSize:20}}>گزارش موقت ثبت‌نام سری دوم لیگ تخته‌نرد</h2>
        <p style={{margin:0,color:'#c9c4b8',fontSize:12,lineHeight:1.8}}>گزارش خصوصی مالک · اطلاعات مستقیماً از دیتابیس اصلی خوانده می‌شود.</p>
      </div>
      <button type="button" onClick={() => void load()} disabled={loading} style={{background:'#252525',border:'1px solid #8a7445',color:'#f2dfb1',borderRadius:8,padding:'10px 14px',cursor:'pointer'}}>
        {loading ? 'در حال به‌روزرسانی…' : 'به‌روزرسانی گزارش'}
      </button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:10,margin:'18px 0'}}>
      <div style={{padding:13,borderRadius:10,background:'#101113',border:'1px solid #51452d'}}><small style={{color:'#b9a77d'}}>تعداد درخواست‌ها</small><strong style={{display:'block',fontSize:25,color:'#f3d58d'}}>{fa(rows.length)}</strong></div>
      <div style={{padding:13,borderRadius:10,background:'#101113',border:'1px solid #51452d'}}><small style={{color:'#b9a77d'}}>ظرفیت اولیه</small><strong style={{display:'block',fontSize:25,color:'#f3d58d'}}>{fa(capacity)}</strong></div>
      <div style={{padding:13,borderRadius:10,background:'#101113',border:'1px solid #51452d'}}><small style={{color:'#b9a77d'}}>ظرفیت باقی‌مانده تا ۴۸</small><strong style={{display:'block',fontSize:25,color:'#f3d58d'}}>{fa(remaining)}</strong></div>
    </div>
    <p style={{fontSize:11,color:'#b9b2a4',margin:'0 0 12px'}}>این فهرست درخواست‌های ارسالی را نشان می‌دهد و به‌تنهایی به معنی تأیید نهایی شرکت‌کنندگان نیست. هیچ اطلاعاتی در این بخش ویرایش یا حذف نمی‌شود.</p>
    {error && <p role="alert" style={{color:'#ffc5c5',background:'#301819',padding:10,borderRadius:8}}>{error}</p>}
    {loading && rows.length===0 ? <p style={{color:'#c9c4b8'}}>در حال دریافت فهرست…</p> :
      rows.length===0 ? <p style={{color:'#c9c4b8'}}>هنوز درخواستی ثبت نشده است.</p> :
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:420,color:'#eee'}}>
          <thead><tr style={{color:'#d9bd7d',textAlign:'right'}}><th style={{padding:10,borderBottom:'1px solid #51452d'}}>ردیف</th><th style={{padding:10,borderBottom:'1px solid #51452d'}}>Plato ID</th><th style={{padding:10,borderBottom:'1px solid #51452d'}}>زمان ثبت (دانمارک)</th></tr></thead>
          <tbody>{rows.map((row,index)=><tr key={row.id}><td style={{padding:10,borderBottom:'1px solid #34312a'}}>{fa(index+1)}</td><td dir="ltr" style={{padding:10,borderBottom:'1px solid #34312a',textAlign:'left',fontWeight:700}}>{row.plato_id}</td><td style={{padding:10,borderBottom:'1px solid #34312a',fontSize:12}}>{date(row.created_at)}</td></tr>)}</tbody>
        </table>
      </div>}
    {updatedAt && <small style={{display:'block',color:'#918a7b',marginTop:12}}>آخرین به‌روزرسانی: {new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Copenhagen'}).format(updatedAt)}</small>}
  </section>;
}
