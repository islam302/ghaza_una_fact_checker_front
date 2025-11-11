import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/review': {
        target: 'http://62.72.22.223/fact_check',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/review/, '')
      }
    }
  }
})