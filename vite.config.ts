import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const temporaryStaticEntries = {
  name: 'temporary-pages-static-entries',
  closeBundle() {
    const output = resolve(process.cwd(), 'dist');
    for (const route of ['series2-slides-manager','series3','series3-registration']) {
      const directory = resolve(output, route);
      mkdirSync(directory, { recursive: true });
      copyFileSync(resolve(output, 'index.html'), resolve(directory, 'index.html'));
    }
  },
};

export default defineConfig({
  base: '/',
  plugins: [react(), temporaryStaticEntries],
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: { host: '0.0.0.0' },
});
