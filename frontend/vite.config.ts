import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from project root
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      strictPort: true,
    },
    envDir: path.resolve(__dirname, '..'),
  }
})
