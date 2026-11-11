import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const series2ManagerStaticEntry = {
  name: 'series2-manager-static-entry',
  closeBundle() {
    // GitHub Pages needs a real directory entry for this temporary SPA route.
    // Keep the fallback scoped to the approved manager path only.
    const output = resolve(process.cwd(), 'dist');
    const managerDirectory = resolve(output, 'series2-slides-manager');
    mkdirSync(managerDirectory, { recursive: true });
    copyFileSync(resolve(output, 'index.html'), resolve(managerDirectory, 'index.html'));
  },
};

export default defineConfig({
  base: '/',
  plugins: [react(), series2ManagerStaticEntry],
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: { host: '0.0.0.0' },
});
