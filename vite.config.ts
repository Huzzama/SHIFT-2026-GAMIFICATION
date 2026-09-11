import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No node-only imports here on purpose: the config stays dependency-light and
// the project needs no @types/node just to resolve one alias.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
