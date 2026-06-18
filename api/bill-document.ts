// Vercel serverless function: GET /api/bill-document?company=&refno=
// Returns the DISCO portal's printable bill page as standalone HTML so the
// client can view or download it without redirecting to the portal.
// Shares the scraper with the Vite dev middleware (see vite.config.ts).
import { fetchBillDocument, BillFetchError } from '../server/billScraper.js'
import { getUserId, AuthError } from '../server/auth.js'

interface Req {
  query: Record<string, string | string[] | undefined>
  headers: Record<string, string | undefined>
}
interface Res {
  status: (code: number) => Res
  setHeader: (name: string, value: string) => void
  send: (body: string) => void
  json: (body: unknown) => void
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const company = first(req.query.company)
  const refno = first(req.query.refno)
  try {
    await getUserId(req.headers.authorization)
    const html = await fetchBillDocument(company, refno)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(html)
  } catch (err) {
    const status = err instanceof AuthError ? 401 : err instanceof BillFetchError ? 400 : 500
    res.status(status).json({ error: err instanceof Error ? err.message : 'Failed to load bill.' })
  }
}
