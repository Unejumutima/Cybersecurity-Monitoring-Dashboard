import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Chart.js + heroicons push the bundle above the default 500 kB warning.
    // Code-splitting belongs in a later optimisation phase; raise the limit for now.
    chunkSizeWarningLimit: 600,
  },
})
