import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {supabase} from './supabase';
import BlackFridayRegistration from './BlackFridayRegistration';
import Series2SlidesManager from './Series2SlidesManager';
import Series3Gallery from './Series3Gallery';
import Series3Registration from './Series3Registration';
import Series3Home from './Series3Home';
import Series2Archive from './Series2Archive';
import Series1PublicArchive from './Series1PublicArchive';
import Series4PublicArchive from './Series4PublicArchive';
import PublicPredictions from './PublicPredictions';
import './styles.css';
import './Series2Registration.css';

const root=createRoot(document.getElementById('root')!);
const path=window.location.pathname.replace(/\/+$/,'') || '/';
const page=new URLSearchParams(window.location.search).get('page');

const retiredPaths = new Set([
  '/series2-results-manager',
  '/prediction-admin',
  '/series2-registration',
  '/semifinal-prediction'
]);
const retiredResultsQuery = (path==='/' || path==='/index.html') && page==='series2-results-manager';

if((path==='/' || path==='/index.html') && page==='black-friday') { root.render(<BlackFridayRegistration/>); } else if(path==='/series2-archive' || ((path==='/' || path==='/index.html') && page==='series2-archive')) {
  root.render(<React.StrictMode><Series2Archive/></React.StrictMode>);
} else if(path==='/series1-archive') {
  root.render(<React.StrictMode><Series1PublicArchive/></React.StrictMode>);
} else if(path==='/series4-archive') {
  root.render(<React.StrictMode><Series4PublicArchive/></React.StrictMode>);
} else if(path==='/predictions') {
  root.render(<React.StrictMode><PublicPredictions/></React.StrictMode>);
} else if(path==='/series3') {
  root.render(<React.StrictMode><Series3Gallery/></React.StrictMode>);
} else if(path==='/series3-registration') {
  root.render(<React.StrictMode><Series3Registration/></React.StrictMode>);
} else if(path==='/series4-registration') {
  root.render(<React.StrictMode><Series3Registration series={4}/></React.StrictMode>);
} else if(path==='/series2-slides-manager') {
  root.render(<React.StrictMode><Series2SlidesManager/></React.StrictMode>);
} else if(path==='/' || path==='/index.html' || retiredPaths.has(path) || retiredResultsQuery) {
  if(retiredPaths.has(path) || retiredResultsQuery) window.history.replaceState(null,'','/');
  root.render(<React.StrictMode><Series3Home/></React.StrictMode>);
} else {
  root.render(<React.StrictMode><App/></React.StrictMode>);
}
import './typography-overrides.css';

 // Public page views only; never transmit query strings, account IDs or IP addresses.
 if(location.hostname==='platoland.org' && path!=='/series2-slides-manager' && supabase){
 const record=()=>{const p=location.pathname.replace(/\/+$/,'')||'/';const safe=p==='/index.html'?'/':p;const q=new URLSearchParams(location.search).get('page');const label=safe==='/'&&q&&['black-friday','series2-archive'].includes(q)?'/'+q:safe;
 if(/^\/[a-zA-Z0-9/_-]{0,159}$/.test(label)&&label!=='/series2-slides-manager')void supabase?.rpc('plato_land_record_site_visit',{p_page:['/','/series3','/series3-registration','/series4-registration','/series2-archive','/series4-archive','/predictions','/black-friday','/competitions','/news','/about','/guide'].includes(label)?label:'/other',p_device:'desktop'}).then(()=>{},()=>{});};
 let last=location.pathname+location.search;
 for(const method of ['pushState','replaceState'] as const){const original=history[method];history[method]=function(...args:Parameters<History[typeof method]>){original.apply(this,args);const next=location.pathname+location.search;if(next!==last){last=next;record()}}}
 window.addEventListener('popstate',()=>{const next=location.pathname+location.search;if(next!==last){last=next;record()}});
 record();
 }
