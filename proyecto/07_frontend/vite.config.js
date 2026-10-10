import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_BASE_URL = process.env.VITE_API_BASE_URL || '/api/v1';
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001';

// Si la API se configura con ruta relativa (/api/v1), Vite la sirve en la misma
// origen mediante proxy hacia el backend Express: la landing no depende de CORS.
const esRutaRelativa = /^\/(?!\/)/.test(API_BASE_URL);

const proxy = esRutaRelativa
  ? {
      [API_BASE_URL]: {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    }
  : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy,
  },
  preview: {
    port: 4173,
    proxy,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
