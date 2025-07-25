import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redirige las solicitudes de /api al servidor de seguimiento de visitantes
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true, // Necesario para vhosts
        secure: false,      // No verificar certificados SSL
      },
    },
  },
})
