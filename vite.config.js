// vite.config.js (lite but improved)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],             // بدون @emotion/babel-plugin
  base: './',                     // مهم لـ Electron (file://)
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: mode !== 'production',
    // rollupOptions: {
    //   output: {
    //     manualChunks: {
    //       react: ['react', 'react-dom'],
    //       mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled']
    //     }
    //   }
    // }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  envPrefix: 'VITE_',
}));
