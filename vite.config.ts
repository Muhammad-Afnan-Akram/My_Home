import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import type { IncomingMessage } from 'node:http'
import react from '@vitejs/plugin-react'
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
  plugins: [react(), billApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
