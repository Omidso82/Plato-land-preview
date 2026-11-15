import React from 'react';
import Series3Gallery from './Series3Gallery';

export default function Series3Home() {
  return <div>
    <div dir="rtl" style={{padding:'12px 14px',background:'linear-gradient(120deg,#211b12,#111214)',borderBottom:'1px solid #8c6a34',textAlign:'center',color:'#e8d8b5',fontFamily:'inherit'}}>
      <span style={{fontSize:13}}>صفحه فعال PLATO LAND · سری سوم</span>
      <a href="/series2-archive/" style={{display:'inline-block',marginRight:12,padding:'7px 12px',border:'1px solid #8c6a34',borderRadius:8,color:'#f0d99f',textDecoration:'none',fontSize:12,fontWeight:800}}>مشاهده آرشیو سری دوم</a>
    </div>
    <Series3Gallery />
  </div>;
}
