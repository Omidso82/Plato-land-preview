import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import PredictionOwnerPanel from './PredictionOwnerPanel';
import './styles.css';

const root=createRoot(document.getElementById('root')!);
const path=window.location.pathname.replace(/\/+$/,'') || '/';

if(path==='/prediction-admin') {
  root.render(<React.StrictMode><PredictionOwnerPanel/></React.StrictMode>);
} else {
  // The temporary semifinal prediction page is retired.
  // Keep the owner report route available and restore the main platform homepage.
  if(path==='/semifinal-prediction') {
    window.history.replaceState(null,'','/');
  }
  root.render(<React.StrictMode><App/></React.StrictMode>);
}
