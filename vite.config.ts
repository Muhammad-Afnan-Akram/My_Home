import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import type { IncomingMessage } from 'node:http'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { getBill, BillFetchError } from './server/billScraper'
import { handleDbOp } from './server/electricityDb'
import { getUserId, AuthError } from './server/auth'

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

/**
 * Dev-only API: exposes GET /api/bill?company=&refno= backed by the bill
 * scraper, so the browser can fetch bills without hitting CORS. In
 * production the same logic is served by the Vercel function in /api/bill.ts.
 */
function billApiPlugin(): Plugin {
  return {
    name: 'bill-api',
    configureServer(server) {
      server.middlewares.use('/api/bill', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost')
        const company = url.searchParams.get('company') ?? ''
        const refno = url.searchParams.get('refno') ?? ''
        res.setHeader('Content-Type', 'application/json')
        try {
          await getUserId(req.headers.authorization)
          const bill = await getBill(company, refno)
          res.statusCode = 200
          res.end(JSON.stringify(bill))
        } catch (err) {
          res.statusCode = err instanceof AuthError ? 401 : err instanceof BillFetchError ? 400 : 500
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to fetch bill.' }))
        }
      })

      // Data API: POST /api/db { op, payload } backed by Supabase Postgres.
      server.middlewares.use('/api/db', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        try {
          const userId = await getUserId(req.headers.authorization)
          const body = await readJsonBody(req)
          const result = await handleDbOp(
            String(body.op),
            (body.payload as Record<string, unknown>) ?? {},
            userId,
          )
          res.statusCode = 200
          res.end(JSON.stringify(result ?? null))
        } catch (err) {
          res.statusCode = err instanceof AuthError ? 401 : 500
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Database error.' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    billApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'My Home',
        short_name: 'My Home',
        description: 'Track home electricity meters, bills and usage.',
        theme_color: '#1976d2',
        background_color: '#f5f5f5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // SPA fallback for client routes, but never intercept the API.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
