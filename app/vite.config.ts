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
        globPatterns: ['**/*.{js,css,html,ico,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
})
