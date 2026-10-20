import { copyFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages: https://luccasst.github.io/sorteio_times/
// Vercel / local: raiz do domínio
const base =
  process.env.VITE_BASE ||
  (process.env.VERCEL ? '/' : process.env.GITHUB_PAGES === 'true' ? '/sorteio_times/' : '/')

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'github-pages-404',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
  ],
})
