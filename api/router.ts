// Vercel serverless function: POST /api/router { op, payload }
// Manages the Zong 4G router's connected devices (list / block / unblock).
//
// NOTE: a Vercel function runs in the cloud and CANNOT reach 192.168.8.1, so
// in production this returns a RouterError explaining the tool is local-only.
// It works when the app's server runs locally on the Zong Wi-Fi (npm run dev).
import { handleRouterOp, RouterError } from '../server/routerClient.js'
import { getUserId, AuthError } from '../server/auth.js'

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
    await getUserId(req.headers.authorization)
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
      op?: string
      payload?: Record<string, unknown>
    }
    const result = await handleRouterOp(String(body.op), body.payload ?? {})
    res.status(200).json(result ?? null)
  } catch (err) {
    const status = err instanceof AuthError ? 401 : err instanceof RouterError ? 400 : 500
    res.status(status).json({ error: err instanceof Error ? err.message : 'Router request failed.' })
  }
}
