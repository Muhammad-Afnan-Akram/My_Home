// TEMPORARY diagnostic: raw connectivity probe to the PITC portal from inside
// the Vercel serverless runtime. No auth, no scraper logic — just a bare fetch
// so we can tell apart "portal blocks our IP" from "scraper bug". Remove after.
// GET /api/portal-check
interface Res {
  status: (code: number) => Res
  json: (body: unknown) => void
}

export default async function handler(_req: unknown, res: Res): Promise<void> {
  const url = 'https://bill.pitc.com.pk/mepcobill'
  const started = Date.now()
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(20_000),
    })
    const body = await r.text()
    res.status(200).json({
      ok: true,
      status: r.status,
      ms: Date.now() - started,
      bytes: body.length,
      hasForm: /searchTextBox/.test(body),
      region: process.env.VERCEL_REGION ?? null,
    })
  } catch (err) {
    const e = err as { name?: string; message?: string; cause?: { code?: string; message?: string } }
    res.status(200).json({
      ok: false,
      ms: Date.now() - started,
      region: process.env.VERCEL_REGION ?? null,
      name: e?.name ?? null,
      message: e?.message ?? null,
      cause: e?.cause ? { code: e.cause.code ?? null, message: e.cause.message ?? null } : null,
    })
  }
}
