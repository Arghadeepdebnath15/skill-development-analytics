import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'client',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'client/index.html'),
        admin: resolve(__dirname, 'client/admin/index.html'),
        student: resolve(__dirname, 'client/student/index.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
});
