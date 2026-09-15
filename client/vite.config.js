import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['game.crrulearnctf.xyz', 'all'],
    proxy: {
      '/socket.io': {
        target: 'http://server:3001',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
// bust cache Sat Aug 22 08:40:36 AM EDT 2026
