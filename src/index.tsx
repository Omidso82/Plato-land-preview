import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import PredictionOwnerPanel from './PredictionOwnerPanel';
import './styles.css';
const root=createRoot(document.getElementById('root')!);
if(window.location.pathname==='/prediction-admin')root.render(<React.StrictMode><PredictionOwnerPanel/></React.StrictMode>);
else root.render(<React.StrictMode><App/></React.StrictMode>);
