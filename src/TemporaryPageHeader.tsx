import React from 'react';
import { Crown, ChevronRight } from 'lucide-react';

type Props = {
  backHref?: string;
  backLabel?: string;
  showBack?: boolean;
};

export default function TemporaryPageHeader({
  backHref = '/series3',
  backLabel = 'بازگشت به صفحه سری سوم',
  showBack = true,
}: Props) {
  return (
    <>
      <header dir="rtl" aria-label="PLATO LAND" style={{
        width:'100%', maxWidth:620, margin:'0 auto 15px', padding:'2px 0 0',
        display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
        color:'#f4ead2'
      }}>
        <div style={{
          width:49, height:49, margin:'0 auto 7px', display:'grid', placeItems:'center',
          border:'1px solid #b8954f99', borderRadius:15,
          background:'linear-gradient(145deg,#3b2e1a,#17130d)',
          boxShadow:'0 0 0 4px #d7b66d0d, 0 8px 22px #0009',
          color:'#f3dfa9'
        }}>
          <Crown size={30} strokeWidth={1.6} />
        </div>
        <div style={{
          fontFamily:'Georgia,serif', fontSize:26, fontWeight:800,
          letterSpacing:3, lineHeight:1.15, direction:'ltr',
          color:'#f8f3e8'
        }}>PLATO <span style={{color:'#f3dfa9'}}>LAND</span></div>
        <div style={{marginTop:4,color:'#d4c19a',fontSize:12,fontWeight:500}}>
          بازی، رقابت، قهرمانی
        </div>
        <div aria-hidden="true" style={{
          display:'flex',alignItems:'center',justifyContent:'center',gap:10,
          width:132,margin:'8px auto 7px',color:'#d8b66d',fontSize:11
        }}>
          <span style={{height:1,flex:1,background:'linear-gradient(90deg,transparent,#b8954f)'}} />
          <span>✦</span>
          <span style={{height:1,flex:1,background:'linear-gradient(90deg,#b8954f,transparent)'}} />
        </div>
      </header>
      {showBack && <nav dir="rtl" style={{width:'100%',maxWidth:620,margin:'0 auto 14px',textAlign:'right'}}>
        <a href={backHref} style={{
          display:'inline-flex',alignItems:'center',gap:7,padding:'8px 12px',
          border:'1px solid #8c6a34',borderRadius:8,background:'#201b12',
          color:'#f0d99f',fontSize:12,fontWeight:700,textDecoration:'none'
        }}><ChevronRight size={17}/>{backLabel}</a>
      </nav>}
    </>
  );
}
