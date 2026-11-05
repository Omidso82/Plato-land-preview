import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import PredictionOwnerPanel from './PredictionOwnerPanel';
import Series2SlidesManager from './Series2SlidesManager';
import './styles.css';

const root=createRoot(document.getElementById('root')!);
const path=window.location.pathname.replace(/\/+$/,'') || '/';

// The Series 2 public registration page was temporary. Restore the permanent
// PLATO LAND application at the root and redirect its retired public URLs there.
// Keep the owner-only slide/statistics manager and prediction admin routes intact.
if(path==='/series2-slides-manager') {
  root.render(<React.StrictMode><Series2SlidesManager/></React.StrictMode>);
} else if(path==='/prediction-admin') {
  root.render(<React.StrictMode><PredictionOwnerPanel/></React.StrictMode>);
} else {
  if(path==='/series2-registration' || path==='/semifinal-prediction' || path==='/home') {
    window.history.replaceState(null,'','/');
  }
  root.render(<React.StrictMode><App/></React.StrictMode>);
}
