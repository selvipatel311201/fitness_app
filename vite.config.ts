import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built site works both locally and under a GitHub Pages
// project subpath (https://<user>.github.io/<repo>/) without extra config.
export default defineConfig({
  base: './',
  plugins: [react()],
});
