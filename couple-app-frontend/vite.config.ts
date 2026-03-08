// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // In production the React app is served from Nginx at the domain root.
  // Nginx reverse-proxies /api/* and /ws/* to the backend — no base needed.
  base: '/',

  server: {
    // Development-only proxy: forwards API and WebSocket calls to the local backend.
    // In production this file is not used — Nginx handles all routing.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/upload': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
