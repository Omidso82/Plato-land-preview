import React from 'react';
import { createRoot } from 'react-dom/client';
import Series2SlidesManager from './Series2SlidesManager';
import './styles.css';
import './Series2Registration.css';
import './typography-overrides.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Series2SlidesManager /></React.StrictMode>
);
