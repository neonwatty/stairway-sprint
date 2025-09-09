import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/stairway-sprint/' : '/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});