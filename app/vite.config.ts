import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Inlinea manifest.webmanifest como data URI en index.html.
// Lighthouse lo veía como request en el critical path (~1.2s en mobile);
// como data URI desaparece del waterfall sin perder PWA installability en Chromium.
function inlineManifest(): PluginOption {
  let outDir = 'dist'
  return {
    name: 'inline-manifest',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const manifestPath = resolve(outDir, 'manifest.webmanifest')
      const indexPath = resolve(outDir, 'index.html')
      if (!existsSync(manifestPath) || !existsSync(indexPath)) return
      const json = JSON.stringify(JSON.parse(readFileSync(manifestPath, 'utf-8')))
      const dataUri = `data:application/manifest+json;base64,${Buffer.from(json).toString('base64')}`
      const html = readFileSync(indexPath, 'utf-8').replace(
        /<link[^>]*rel="manifest"[^>]*>/g,
        `<link rel="manifest" href="${dataUri}">`,
      )
      writeFileSync(indexPath, html)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Targets modernos: navegadores con ES2022 (>97% global). Quita polyfills
    // innecesarios y reduce el tamaño/tiempo de parse del bundle en mobile.
    // Vite 8 + Rolldown usan minifier nativo por defecto — no forzamos esbuild.
    target: 'es2022',
    rollupOptions: {
      output: {
        // Code-splitting por vendor: el navegador parsea chunks en paralelo y
        // un cambio en código de app no invalida el chunk de React/MUI en cache.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mui/icons-material')) return 'mui-icons';
          if (id.includes('@mui/') || id.includes('@emotion/')) return 'mui-core';
          if (id.includes('react-router')) return 'react-vendor';
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
            return 'react-vendor';
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    visualizer({
      filename: 'bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
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
        // Precache solo lo crítico — chunks lazy (páginas, modales) se cachean en runtime.
        // manifest.webmanifest deliberadamente fuera: el navegador lo carga aparte y
        // estaba apareciendo en el critical path del Lighthouse (1.2s). El SW lo
        // resolverá vía runtime cache si hace falta.
        globPatterns: [
          'index.html',
          'favicon.svg',
          'icons.svg',
          'Francachelaicon.webp',
          'assets/index-*.js',
          'assets/index-*.css',
          'assets/react-vendor-*.js',
          'assets/mui-core-*.js',
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
    inlineManifest(),
  ],
})
