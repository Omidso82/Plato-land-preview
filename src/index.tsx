import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import ChampionPrediction from './ChampionPrediction';
import PredictionOwnerPanel from './PredictionOwnerPanel';
import './styles.css';

const root=createRoot(document.getElementById('root')!);
const queryRoute=new URLSearchParams(window.location.search).get('route');
if(queryRoute==='semifinal-prediction') {
  window.history.replaceState(null,'','/semifinal-prediction');
}
const path=window.location.pathname.replace(/\\/+$/,'') || '/';
if(path==='/prediction-admin') {
  root.render(<React.StrictMode><PredictionOwnerPanel/></React.StrictMode>);
} else if(path==='/semifinal-prediction' || queryRoute==='semifinal-prediction') {
  root.render(<React.StrictMode><ChampionPrediction/></React.StrictMode>);
} else {
  root.render(<React.StrictMode><App/></React.StrictMode>);
}
