import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cloudflare-spa-fallback',
      closeBundle() {
        const distDir = path.resolve(import.meta.dirname, 'dist')
        const indexHtml = path.join(distDir, 'index.html')
        if (fs.existsSync(indexHtml)) {
          fs.copyFileSync(indexHtml, path.join(distDir, '200.html'))
        }
      }
    }
  ],
})

