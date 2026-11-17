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
        width:'100%', maxWidth:920, margin:'0 auto 22px', padding:'18px 12px 22px',
        display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
        color:'#f4ead2'
      }}>
        <div style={{
          width:116, height:116, display:'grid', placeItems:'center',
          border:'1px solid #9b7a3d', borderRadius:34,
          background:'linear-gradient(145deg,#292317,#111214 70%)',
          boxShadow:'0 0 0 9px rgba(178,139,23,.07), 0 0 42px rgba(214,180,109,.10)',
          color:'#e6c775'
        }}>
          <Crown size={58} strokeWidth={1.55} />
        </div>
        <div style={{
          marginTop:14, fontFamily:'Georgia,serif', fontSize:'clamp(38px,7vw,64px)',
          lineHeight:1.12, fontWeight:700, letterSpacing:3, direction:'ltr',
          color:'#f5ead0'
        }}>PLATO <span style={{color:'#e3c36e'}}>LAND</span></div>
        <div style={{marginTop:12,fontSize:'clamp(17px,3.2vw,27px)',color:'#d2c19a',fontWeight:500}}>
          بازی، رقابت، قهرمانی
        </div>
        <div aria-hidden="true" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:24,width:'min(400px,80%)',marginTop:26,color:'#d8b65e'}}>
          <span style={{height:2,flex:1,background:'linear-gradient(90deg,transparent,#b89449)'}} />
          <span style={{fontSize:24,lineHeight:1}}>✦</span>
          <span style={{height:2,flex:1,background:'linear-gradient(90deg,#b89449,transparent)'}} />
        </div>
      </header>
      {showBack && <nav dir="rtl" style={{width:'100%',maxWidth:900,margin:'0 auto 14px',textAlign:'right'}}>
        <a href={backHref} style={{
          display:'inline-flex',alignItems:'center',gap:7,padding:'9px 14px',
          border:'1px solid #8c6a34',borderRadius:9,background:'#201b12',
          color:'#f0d99f',fontSize:13,fontWeight:700,textDecoration:'none'
        }}><ChevronRight size={17}/>{backLabel}</a>
      </nav>}
    </>
  );
}
