import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/voicebasedexpensetracker/',
  server: {
    port: 5173,
  },
})
