import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import PredictionOwnerPanel from './PredictionOwnerPanel';
import Series2Registration from './Series2Registration';
import './styles.css';

const root=createRoot(document.getElementById('root')!);
const path=window.location.pathname.replace(/\/+$/,'') || '/';

if(path==='/' || path==='/series2-registration') {
  root.render(<React.StrictMode><Series2Registration/></React.StrictMode>);
} else if(path==='/prediction-admin') {
  root.render(<React.StrictMode><PredictionOwnerPanel/></React.StrictMode>);
} else {
  // The root domain is temporarily assigned to Series 2 registration.
  // Keep the existing platform homepage available at /home and preserve admin routes.
  if(path==='/semifinal-prediction') {
    window.history.replaceState(null,'','/');
    root.render(<React.StrictMode><Series2Registration/></React.StrictMode>);
  } else {
    root.render(<React.StrictMode><App/></React.StrictMode>);
  }
}
