import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import Series2Registration from './Series2Registration';
import Series2SlidesManager from './Series2SlidesManager';
import './styles.css';
import './Series2Registration.css';

const root=createRoot(document.getElementById('root')!);
const path=window.location.pathname.replace(/\/+$/,'') || '/';
const page=new URLSearchParams(window.location.search).get('page');

// Keep only the two approved temporary Series 2 pages:
// 1) /series2-slides-manager — temporary owner management panel
// 2) / — public temporary Series 2 tournament page
//
// Retired standalone routes are redirected to the public page. Their shared
// components remain in the codebase because the management panel still uses
// the results and prediction components internally.
const retiredPaths = new Set([
  '/series2-results-manager',
  '/prediction-admin',
  '/series2-registration',
  '/semifinal-prediction'
]);
const retiredResultsQuery = (path==='/' || path==='/index.html') && page==='series2-results-manager';

if(path==='/series2-slides-manager') {
  root.render(<React.StrictMode><Series2SlidesManager/></React.StrictMode>);
} else if(path==='/' || path==='/index.html' || retiredPaths.has(path) || retiredResultsQuery) {
  if(retiredPaths.has(path) || retiredResultsQuery) {
    window.history.replaceState(null,'','/');
  }
  root.render(<React.StrictMode><Series2Registration/></React.StrictMode>);
} else {
  // Other platform routes continue to use the main application.
  root.render(<React.StrictMode><App/></React.StrictMode>);
}
import './typography-overrides.css';
