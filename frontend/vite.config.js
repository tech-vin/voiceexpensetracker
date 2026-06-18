import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/voice-based-expense-tracker/',
  server: {
    port: 5173,
  },
})
