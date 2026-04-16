import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'client/index.html'),
        admin: resolve(__dirname, 'client/admin/index.html'),
        student: resolve(__dirname, 'client/student/index.html'),
        interview: resolve(__dirname, 'client/ai-interview/index.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
});
