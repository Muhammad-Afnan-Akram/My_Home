// Vercel serverless function: GET /api/bill?company=&refno=
// Shares the scraper with the Vite dev middleware (see vite.config.ts).
// Requires a Supabase auth token. Typed loosely (no @vercel/node dep).
import { getBill, BillFetchError } from '../server/billScraper'
import { getUserId, AuthError } from '../server/auth'

interface Req {
  query: Record<string, string | string[] | undefined>
  headers: Record<string, string | undefined>
}
interface Res {
  status: (code: number) => Res
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
    const bill = await getBill(company, refno)
    res.status(200).json(bill)
  } catch (err) {
    const status = err instanceof AuthError ? 401 : err instanceof BillFetchError ? 400 : 500
    res.status(status).json({ error: err instanceof Error ? err.message : 'Failed to fetch bill.' })
  }
}
