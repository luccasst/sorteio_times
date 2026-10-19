import { copyFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O site fica em https://luccasst.github.io/sorteio_times/
// Sem esse prefixo, o navegador pede /assets na raiz do GitHub e recebe 404.
const base = '/sorteio_times/'

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
