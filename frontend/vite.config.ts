import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from project root
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')

  // Get backend URL: use docker hostname when in container, otherwise localhost
  // Docker Compose sets VITE_API_BASE_URL which uses localhost for browser access
  // But proxy needs to reach backend container via docker network
  const backendPort = env.BACKEND_PORT || '8007'
  const backendUrl = process.env.VITE_API_BASE_URL ? `http://backend:${backendPort}` : `http://localhost:${backendPort}`

  return {
    plugins: [react()],
    envDir: process.env.VITE_API_BASE_URL ? '.' : path.resolve(__dirname, '..'), // Use current dir in Docker build
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      strictPort: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
