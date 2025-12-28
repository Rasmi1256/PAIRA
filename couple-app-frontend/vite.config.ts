// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // IMPORTANT: remove the rewrite so /api/... stays /api/...
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
