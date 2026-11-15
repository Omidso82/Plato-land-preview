import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import Series2SlidesManager from './Series2SlidesManager';
import Series3Gallery from './Series3Gallery';
import Series3Registration from './Series3Registration';
import Series3Home from './Series3Home';
import Series2Archive from './Series2Archive';
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

if(path==='/series2-archive' || ((path==='/' || path==='/index.html') && page==='series2-archive')) {
  root.render(<React.StrictMode><Series2Archive/></React.StrictMode>);
} else if(path==='/series3') {
  root.render(<React.StrictMode><Series3Gallery/></React.StrictMode>);
} else if(path==='/series3-registration') {
  root.render(<React.StrictMode><Series3Registration/></React.StrictMode>);
} else if(path==='/series2-slides-manager') {
  root.render(<React.StrictMode><Series2SlidesManager/></React.StrictMode>);
} else if(path==='/' || path==='/index.html' || retiredPaths.has(path) || retiredResultsQuery) {
  if(retiredPaths.has(path) || retiredResultsQuery) window.history.replaceState(null,'','/');
  root.render(<React.StrictMode><Series3Home/></React.StrictMode>);
} else {
  root.render(<React.StrictMode><App/></React.StrictMode>);
}
import './typography-overrides.css';
