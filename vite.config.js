import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // DISABLE PWA IN DEV MODE.
      // Running the real service worker in dev causes CacheFirst to serve
      // STALE SOURCE FILES — your code changes are ignored and old JS/CSS is
      // loaded from the SW cache. Always keep this false during development.
      devOptions: {
        enabled: false
      },
      includeAssets: ['Icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Tutorz',
        short_name: 'Tutorz',
        description: 'Tutorz - Your Learning Partner',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Only use the offline fallback for actual page navigations (routes). 
        // We MUST exclude API calls, SignalR hubs, and static assets like the manifest.
        // If the manifest is caught by the fallback, it returns index.html (JSON syntax error).
        navigateFallbackAllowlist: [
            /^(?!\/(api|hubs|manifest\.webmanifest|sw\.js|registerSW\.js|.*\.png|.*\.jpg|.*\.svg)).*$/
        ],
        runtimeCaching: [
          // 0. SignalR Hub — MUST bypass the Service Worker entirely.
          //    SignalR's negotiate step is a plain HTTP POST that upgrades to WebSocket.
          //    Any cache strategy (even NetworkFirst) can abort the upgrade or delay
          //    negotiation enough to cause "connection stopped during negotiation".
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/hubs/'),
            handler: 'NetworkOnly',
          },
          // 1. Static Assets (Images, Icons) - Cache First
          // Only match production built files with content hashes.
          // The old regex /\.(?:png|jpg|jpeg|svg|css)$/ also matched Vite dev
          // server source files, causing the SW to cache them and serve stale
          // code — making all file edits invisible until the SW cache was cleared.
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },

          // 2. Critical/Transactional Endpoints (Payments/Auth) - Network First
          // We MUST try reaching the server first.
          {
            urlPattern: ({ url }) => url.pathname.includes('/api/payment/') || url.pathname.includes('/api/auth/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'transactional-api-cache',
              networkTimeoutSeconds: 3, // Fallback if Sri Lankan network hangs tightly
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              fetchOptions: { mode: 'cors' },
            },
          },
          // 3. User Data (Classes, Profiles, Schedules) - Network First
          // Try network for latest data to prevent stale UI, fallback to cache
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/student/') || url.pathname.startsWith('/api/tutor/') || url.pathname.startsWith('/api/institute/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'user-data-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 24 Hours
              },
              fetchOptions: { mode: 'cors' },
            },
          },
          // 4. Fallback for any other unhandled /api/ requests - Network Only
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            options: {
              fetchOptions: { mode: 'cors' },
            },
          },
        ],
      },
    })
  ],
  server: {
    host: true
  }
})