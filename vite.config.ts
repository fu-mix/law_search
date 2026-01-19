import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/dify': {
        target: 'https://api.dify.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/dify/, '/v1'),
      },
    },
  },
})
