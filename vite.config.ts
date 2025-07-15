import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';


export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/bld-ninja/',
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['cubing'],
  },
});
