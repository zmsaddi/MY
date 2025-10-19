// vite.config.js - Optimized for production
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',  // Important for Electron (file://)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Provide browser-compatible crypto shim for bcryptjs
      'crypto': path.resolve(__dirname, 'src/utils/security/cryptoShim.js')
    }
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-pdf': ['pdfmake'],
          'vendor-sql': ['sql.js'],
        },
      },
      onwarn(warning, warn) {
        // Suppress "Module 'crypto' has been externalized" warning for bcryptjs
        // We have a WebCrypto fallback configured in initSecurity.js
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message.includes('crypto')) {
          return;
        }
        warn(warning);
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  envPrefix: 'VITE_',
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@mui/icons-material', 'bcryptjs'],
  },
}));
