import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../src'),
      '@styles': path.resolve(__dirname, '../styles'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4040,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4040,
    strictPort: true,
  },
});
