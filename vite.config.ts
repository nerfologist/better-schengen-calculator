/// <reference types="vitest/config" />
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { GOATCOUNTER_ORIGIN } from './src/analytics/config.ts'

// Keep the analytics origin in one place: the meta CSP, the generated
// response headers, and the GoatCounter script all derive from it.
const connectExtra = GOATCOUNTER_ORIGIN ? ` ${GOATCOUNTER_ORIGIN}` : ''

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${connectExtra}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const HEADERS = `/*
  Content-Security-Policy: ${CSP}
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/sw.js
  Cache-Control: no-cache

/index.html
  Cache-Control: no-cache

/manifest.webmanifest
  Cache-Control: no-cache
`

function securityHeaders(): Plugin {
  return {
    name: 'security-headers',
    transformIndexHtml(html) {
      return html.replaceAll('%GOATCOUNTER_CONNECT_EXTRA%', connectExtra)
    },
    // Cloudflare Pages (and similar hosts) read _headers from the build root.
    // GitHub Pages ignores the file; the meta CSP still applies there.
    writeBundle() {
      writeFileSync(resolve('dist/_headers'), HEADERS)
    },
  }
}

// The site is served at the root of the custom domain (schengen-days.com),
// so dev, build, and preview all share the root base path.
// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    securityHeaders(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // Social-card art is never shown by the app; don't make phones cache it.
        globIgnores: ['**/og-image.*'],
      },
      manifest: {
        name: 'Schengen Days',
        short_name: 'Schengen Days',
        description:
          'Track your Schengen short stays and plan trips under the 90/180-day rule.',
        display: 'standalone',
        start_url: '.',
        theme_color: '#1c2a4a',
        background_color: '#f6f7f9',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
