import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ChampionPrediction from './ChampionPrediction';
import './styles.css';
const root=createRoot(document.getElementById('root')!);
if(window.location.pathname==='/'){root.render(<React.StrictMode><ChampionPrediction/></React.StrictMode>);}
else{root.render(<React.StrictMode><App/></React.StrictMode>);}
