import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves from /<repo>/, local dev from /. Override with BASE_PATH if needed.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Condensate Research Tracker',
        short_name: 'Condensates',
        description:
          'Latest research on protein / biomolecular phase separation across plant, animal and biophysics.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#0b1120',
        theme_color: '#0f172a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Live research APIs: fresh when online, cached fallback when offline.
            urlPattern: ({ url }) =>
              (url.origin === 'https://www.ebi.ac.uk' &&
                url.pathname.startsWith('/europepmc/webservices/rest/')) ||
              url.origin === 'https://eutils.ncbi.nlm.nih.gov' ||
              url.origin === 'https://api.crossref.org',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'research-api',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 96,
                maxAgeSeconds: 60 * 60 * 24 * 14, // 2 weeks
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
