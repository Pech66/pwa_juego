import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5187,
    strictPort: true,
    open: true,
    proxy: { '/api': { target: process.env.SYNC_API_TARGET || 'http://localhost:5000', changeOrigin: true } }
  },
  preview: {
    host: '127.0.0.1',
    port: 5188,
    strictPort: true,
    open: true,
    proxy: { '/api': { target: process.env.SYNC_API_TARGET || 'http://localhost:5000', changeOrigin: true } }
  },
  plugins: [
    VitePWA({
      // Usamos nuestro propio Service Worker (src/service-worker/sw.js)
      strategies: 'injectManifest',
      srcDir: 'src/service-worker',
      filename: 'sw.js',
      // El registro lo hacemos a mano en src/main.js (virtual:pwa-register)
      injectRegister: false,
      registerType: 'prompt',
      // El manifest vive en public/manifest.json y se enlaza desde index.html
      manifest: false,
      includeAssets: ['favicon.ico', 'manifest.json', 'icons/*.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,json}']
      },
      devOptions: {
        // En desarrollo se evita reutilizar Service Workers de otros proyectos
        // que hayan usado el mismo origen localhost.
        enabled: false
      }
    })
  ]
});
