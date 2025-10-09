// vite.config.js - Optimized for production
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',  // Important for Electron (file://)
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
    minify: 'terser', // Better minification than esbuild
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 1000, // Increase to 1MB before warning
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@mui/material')) {
              return 'mui-material';
            }
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            if (id.includes('@emotion')) {
              return 'emotion';
            }
            if (id.includes('sql.js')) {
              return 'sql-vendor';
            }
            return 'vendor'; // Other dependencies
          }

          // Component chunks
          if (id.includes('src/components/tabs/')) {
            return 'tabs';
          }
          if (id.includes('src/utils/database/')) {
            return 'database';
          }
        },
        // Optimized file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  envPrefix: 'VITE_',
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@mui/icons-material'],
  },
}));
