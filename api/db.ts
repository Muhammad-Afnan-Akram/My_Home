// Vercel serverless function: POST /api/db { op, payload }
// Requires a Supabase auth token; scopes all data to that user.
import { handleDbOp } from '../server/electricityDb'
import { getUserId, AuthError } from '../server/auth'

interface Req {
  method?: string
  body: unknown
  headers: Record<string, string | undefined>
}
interface Res {
  status: (code: number) => Res
  json: (body: unknown) => void
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const userId = await getUserId(req.headers.authorization)
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
      op?: string
      payload?: Record<string, unknown>
    }
    const result = await handleDbOp(String(body.op), body.payload ?? {}, userId)
    res.status(200).json(result ?? null)
  } catch (err) {
    const status = err instanceof AuthError ? 401 : 500
    res.status(status).json({ error: err instanceof Error ? err.message : 'Database error.' })
  }
}
