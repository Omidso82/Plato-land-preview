import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Plato-land-preview/',
  plugins: [react()],
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: { host: '0.0.0.0' },
});
