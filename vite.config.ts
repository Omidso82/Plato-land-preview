import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const temporaryStaticEntries = {
  name: 'temporary-pages-static-entries',
  closeBundle() {
    const output = resolve(process.cwd(), 'dist');
    for (const route of ['series2-slides-manager','series3','series3-registration','predictions']) {
      const directory = resolve(output, route);
      mkdirSync(directory, { recursive: true });
      copyFileSync(resolve(output, 'index.html'), resolve(directory, 'index.html'));
    }

    // Keep the preview-only R2 audit endpoint as the sole Pages Function route.
    // All normal site pages and static assets remain on the static, non-Function path.
    writeFileSync(
      resolve(output, '_routes.json'),
      JSON.stringify({ version: 1, include: ['/__internal/r2-inventory'], exclude: [] }, null, 2),
    );
  },
};

export default defineConfig({
  base: '/',
  plugins: [react(), temporaryStaticEntries],
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: { host: '0.0.0.0' },
});
