/**
 * Vite Configuration
 * Author: Duncan Kamunge (@KamungeD)
 * Build configuration for CashCompass frontend
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true, // Open browser on start
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'framer-motion'],
          charts: ['recharts', 'chart.js', 'react-chartjs-2'],
          forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  
  // Path aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@context': resolve(__dirname, './src/context'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase',
    },
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-hook-form',
      'date-fns',
      'lucide-react',
    ],
  },
  
  // Preview server (for production preview)
  preview: {
    port: 4173,
    host: true,
  },
  
  // ESBuild configuration
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
