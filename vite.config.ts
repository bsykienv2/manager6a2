import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Cấu hình base rỗng hoặc './' để deploy linh hoạt trên GitHub Pages (sub-path)
    base: './', 
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1600,
    },
    define: {
      // Polyfill process.env.API_KEY cho Gemini SDK hoạt động trên trình duyệt
      // Nó sẽ thay thế chuỗi 'process.env.API_KEY' trong code bằng giá trị thực
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    }
  };
});