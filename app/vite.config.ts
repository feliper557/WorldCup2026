import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Francachela Mundial 2026',
        short_name: 'Francachela',
        description: 'Polla mundialista Francachela MX Subachoque',
        theme_color: '#4CBFA6',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-72x72.png',            sizes: '72x72',   type: 'image/png' },
          { src: 'icons/icon-96x96.png',            sizes: '96x96',   type: 'image/png' },
          { src: 'icons/icon-128x128.png',          sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144x144.png',          sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-152x152.png',          sizes: '152x152', type: 'image/png' },
          { src: 'icons/icon-192x192.png',          sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-384x384.png',          sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512x512.png',          sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: false,
        // Precache solo lo crítico — chunks lazy (páginas, modales) se cachean en runtime
        globPatterns: [
          'index.html',
          'manifest.webmanifest',
          'favicon.svg',
          'icons.svg',
          'Francachelaicon.webp',
          'assets/index-*.js',
          'assets/index-*.css',
          'icons/icon-192x192.png',
          'icons/icon-512x512.png',
        ],
        runtimeCaching: [
          // API: NetworkFirst con TTL corto (datos cambian)
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          // Chunks lazy (páginas + modales): CacheFirst 30 días
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // Logos de equipos via proxy wsrv.nl: CacheFirst 30 días
          {
            urlPattern: /^https:\/\/wsrv\.nl\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wsrv-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // Banderas de selecciones (Mundial): CacheFirst 30 días
          {
            urlPattern: /^https:\/\/flagcdn\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'flagcdn-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // Fallback directo a api-sports si no pasa por wsrv: CacheFirst 30 días
          {
            urlPattern: /^https:\/\/media\.api-sports\.io\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-sports-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
