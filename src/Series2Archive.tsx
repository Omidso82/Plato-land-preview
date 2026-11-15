import React from 'react';
import { ArrowRight, Archive } from 'lucide-react';
import Series2Registration from './Series2Registration';

export default function Series2Archive() {
  return <div dir="rtl">
    <header style={{padding:'14px 16px',background:'linear-gradient(145deg,#211b12,#111214)',borderBottom:'1px solid #8c6a34',color:'#f2e5c5',fontFamily:'inherit'}}>
      <div style={{maxWidth:920,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <Archive size={20} color="#d6b46d"/>
          <div><strong style={{display:'block'}}>آرشیو رسمی سری دوم</strong><small style={{color:'#b9ad97'}}>این دوره به پایان رسیده و سوابق آن حفظ شده است.</small></div>
        </div>
        <a href="/" style={{display:'inline-flex',alignItems:'center',gap:7,padding:'8px 12px',border:'1px solid #8c6a34',borderRadius:8,color:'#f0d99f',textDecoration:'none',fontSize:12,fontWeight:800}}><ArrowRight size={15}/> بازگشت به سری سوم</a>
      </div>
    </header>
    <Series2Registration showSeries3Entry={false} showSeriesLabel={false} />
  </div>;
}
