import { defineConfig } from 'vite'

export default defineConfig({
  // Relative Basis: die App hat genau ein HTML-Entry und keinen Router, damit
  // funktioniert der Build unter jedem Unterpfad — etwa /mala-app/ auf GitHub Pages.
  base: './',
  server: { port: 5173 },
})
