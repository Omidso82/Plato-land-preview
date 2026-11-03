import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
const previewMode = (import.meta as any).env?.VITE_PLATO_PREVIEW === 'true';

async function start() {
  const path = window.location.pathname.replace(/\\/+$/,'') || '/';
  if (path === '/site-logo-manager') {
    const { default: SiteLogoManager } = await import('./SiteLogoManager');
    root.render(<React.StrictMode><SiteLogoManager /></React.StrictMode>);
    return;
  }
  if (previewMode) {
    const { default: PreviewApp } = await import('./PreviewApp');
    root.render(<React.StrictMode><PreviewApp /></React.StrictMode>);
    return;
  }

  // Production modules are loaded only outside Preview mode.
  // The Cloudflare Preview build never imports Supabase-backed pages or admin panels.
  if (path === '/series2-slides-manager') {
    const { default: Series2SlidesManager } = await import('./Series2SlidesManager');
    root.render(<React.StrictMode><Series2SlidesManager /></React.StrictMode>);
  } else if (path === '/' || path === '/series2-registration' || path === '/semifinal-prediction') {
    const { default: Series2Registration } = await import('./Series2Registration');
    root.render(<React.StrictMode><Series2Registration /></React.StrictMode>);
  } else if (path === '/prediction-admin') {
    const { default: PredictionOwnerPanel } = await import('./PredictionOwnerPanel');
    root.render(<React.StrictMode><PredictionOwnerPanel /></React.StrictMode>);
  } else {
    const { default: App } = await import('./App');
    root.render(<React.StrictMode><App /></React.StrictMode>);
  }
}

void start();
