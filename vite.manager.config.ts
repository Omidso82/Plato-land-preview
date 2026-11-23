import { copyFileSync, mkdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Opt-in, manager-only build. Does not change vite.config.ts or the existing
 * production build. No deployment target or upload action is defined here.
 * Publish only after verifying the existing manager route can be replaced
 * independently from the main site's shared assets and index.
 */
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'manager-only-route-output',
      closeBundle() {
        const out = resolve(process.cwd(), 'dist-manager');
        const source = resolve(out, 'manager-only.html');
        const directory = resolve(out, 'series2-slides-manager');
        mkdirSync(directory, { recursive: true });
        renameSync(source, resolve(directory, 'index.html'));
      },
    },
  ],
  build: {
    outDir: 'dist-manager',
    assetsDir: 'series2-slides-manager/assets',
    emptyOutDir: true,
    rollupOptions: { input: resolve(process.cwd(), 'manager-only.html') },
  },
  envPrefix: ['VITE_', 'REACT_APP_'],
});
