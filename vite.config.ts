import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // 你的端口
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // 如果后端没有多余前缀就不要 rewrite
        // rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
