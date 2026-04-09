import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Optimize build with esbuild (built-in, no terser needed)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'socket': ['socket.io-client'],
          'icons': ['react-icons'],
        },
      },
    },
    // Lower chunk size warnings
    chunkSizeWarningLimit: 600,
    // Disable sourcemaps in production
    sourcemap: false,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'socket.io-client',
      'react-icons',
      'react-hot-toast',
    ],
  },
});
