/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Must match the GitHub repo name for GitHub Pages hosting. Dev serves at
// the root for convenience; builds use the Pages subpath, and preview must
// match the built output (vite preview also runs with command 'serve').
const PAGES_BASE = '/better-schengen-calculator/'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? PAGES_BASE : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
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
}))
