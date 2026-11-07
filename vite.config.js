import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules/three/') ? 'three' : undefined) } },
  },
})
