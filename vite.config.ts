import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `/src` is root-relative in Vite, so the alias needs no node path helpers
// and behaves the same on Windows and macOS.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
