// Server-side scraper for PITC-hosted DISCO bills
// (bill.pitc.com.pk/{company}bill). The site is an ASP.NET WebForms app:
// searching a reference number is a POST that requires the session cookie,
// an anti-forgery token, and the page's __VIEWSTATE / __EVENTVALIDATION.
//
// Runs in Node only (uses global fetch). Imported by the Vite dev
// middleware and the Vercel serverless function — never by client code.

export interface ScrapedBill {
  company: string
  referenceNumber: string
  customerName?: string
  unitsConsumed?: number
  presentReading?: number
  previousReading?: number
  billMonth?: string
  /** ISO yyyy-mm-dd */
  readingDate?: string
  issueDate?: string
  dueDate?: string
  payableWithinDueDate?: number
  payableAfterDueDate?: number
  history: { month: string; units: number; amount?: number }[]
  fetchedAt: string
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'

const MONTHS: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
}

/** Pull a hidden input's value out of the form HTML. */
function hiddenField(html: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m =
    html.match(new RegExp(`name="${escaped}"[^>]*value="([^"]*)"`)) ??
    html.match(new RegExp(`value="([^"]*)"[^>]*name="${escaped}"`))
  return m ? unescapeHtml(m[1]) : ''
}

/** Flatten HTML to trimmed, meaningful text lines. */
function toLines(html: string): string[] {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
  return unescapeHtml(stripped)
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0 && !/^[|\-_=*. ]+$/.test(l))
}

/** "15 MAY 26" -> "2026-05-15" */
function toISODate(value: string | undefined): string | undefined {
  if (!value) return undefined
  const m = value.match(/^(\d{2}) ([A-Z]{3}) (\d{2})$/)
  if (!m) return undefined
  const mm = MONTHS[m[2]]
  if (!mm) return undefined
  return `20${m[3]}-${mm}-${m[1]}`
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number(value.replace(/,/g, ''))
  return Number.isFinite(n) ? n : undefined
}

/** True if a line is (part of) the portal's Urdu translation of a label. */
function isUrdu(s: string): boolean {
  return /[؀-ۿ]/.test(s)
}

/** Numeric cell like "97", "24,150" — no other characters. */
function isNumericLine(s: string | undefined): boolean {
  return /^[\d,]+$/.test(s ?? '')
}

/**
 * Indices of every line whose text — after dropping any leading emoji/symbol
 * prefix (the portal prefixes some labels with "⚠"/"⏳"/"☰") — equals `label`.
 */
function labelIndices(lines: string[], label: string): number[] {
  const out: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].replace(/^[^A-Za-z]+/, '').trim() === label) out.push(i)
  }
  return out
}

/**
 * First line shortly after any occurrence of `label` that satisfies `ok`.
 * The portal places an Urdu translation line (and occasionally another label)
 * between a field's English label and its value, so scan a few lines forward
 * rather than reading a fixed offset.
 */
function valueAfter(
  lines: string[],
  label: string,
  ok: (s: string) => boolean,
  scan = 3,
): string | undefined {
  for (const i of labelIndices(lines, label)) {
    for (let k = i + 1; k <= i + scan && k < lines.length; k++) {
      if (ok(lines[k])) return lines[k]
    }
  }
  return undefined
}

function parseBill(html: string, company: string, referenceNumber: string): ScrapedBill {
  const L = toLines(html)

  const fullDate = /^\d{2} [A-Z]{3} \d{2}$/
  const monthTag = /^[A-Z][a-z]{2}\d{2}$/

  // METER INFO block: each value sits 1-2 lines after its label (an Urdu
  // translation line is interleaved), so read by label rather than by position.
  const previousReading = toNumber(valueAfter(L, 'PREVIOUS READING', isNumericLine))
  const presentReading = toNumber(valueAfter(L, 'PRESENT READING', isNumericLine))
  const unitsConsumed = toNumber(valueAfter(L, 'UNITS', isNumericLine))

  // 12-month history table: MONTH / STATUS / UNITS / BILL / PAYMENT. The STATUS
  // cell ("EX") is optional and the header row repeats partway down the table,
  // so collect every month token rather than walking from a single header.
  const history: { month: string; units: number; amount?: number }[] = []
  for (let j = 0; j < L.length; j++) {
    if (!monthTag.test(L[j])) continue
    let k = j + 1
    if (L[k] === 'EX') k += 1 // optional STATUS column
    const units = toNumber(L[k])
    if (units == null) continue
    // Columns after the (optional) status: UNITS (k), BILL (k+1), PAYMENT (k+2).
    history.push({ month: L[j], units, amount: toNumber(L[k + 1]) })
  }

  // Payable after due date: the "After <date>" surcharge cell ("After 12-JUN-26"
  // is now a single line) followed by its amount.
  let payableAfter: number | undefined
  for (let i = 0; i < L.length; i++) {
    if (/^After\b/.test(L[i]) && isNumericLine(L[i + 1])) {
      payableAfter = toNumber(L[i + 1])
      break
    }
  }

  // Bill month is a standalone "MON YY" token (e.g. "MAY 26").
  const monthYear = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) \d{2}$/
  const billMonth = L.find((l) => monthYear.test(l))

  return {
    company,
    referenceNumber,
    customerName: valueAfter(L, 'NAME & ADDRESS', (s) => !isUrdu(s)),
    unitsConsumed,
    presentReading,
    previousReading,
    billMonth,
    readingDate: toISODate(valueAfter(L, 'READING DATE', (s) => fullDate.test(s))),
    issueDate: toISODate(valueAfter(L, 'ISSUE DATE', (s) => fullDate.test(s))),
    dueDate: toISODate(valueAfter(L, 'DUE DATE', (s) => fullDate.test(s))),
    payableWithinDueDate: toNumber(valueAfter(L, 'PAYABLE WITHIN DUE DATE', isNumericLine)),
    payableAfterDueDate: payableAfter,
    history,
    fetchedAt: new Date().toISOString(),
  }
}

function cookieHeader(setCookies: string[]): string {
  return setCookies.map((c) => c.split(';')[0]).join('; ')
}

function getSetCookies(res: Response): string[] {
  // Node 18+ exposes getSetCookie(); fall back to the combined header.
  const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof anyHeaders.getSetCookie === 'function') return anyHeaders.getSetCookie()
  const raw = res.headers.get('set-cookie')
  return raw ? [raw] : []
}

export class BillFetchError extends Error {}

/**
 * Run the portal's search flow and return the rendered bill page HTML. The site
 * is ASP.NET WebForms: load the search page for cookies + anti-forgery +
 * viewstate, then POST the reference number. The POST 302-redirects to
 * `/general?refno=...`, which `fetch` auto-follows to the full bill page.
 * Throws BillFetchError with a user-friendly message on failure.
 */
async function fetchBillPageHtml(safeCompany: string, ref: string): Promise<string> {
  const base = `https://bill.pitc.com.pk/${safeCompany}bill`

  // Step 1: load the search page to get cookies + anti-forgery + viewstate.
  const landing = await fetch(base, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
    signal: AbortSignal.timeout(45_000),
  }).catch(() => {
    throw new BillFetchError('Could not reach the bill portal. Check your connection.')
  })
  const landingHtml = await landing.text()
  const cookies = cookieHeader(getSetCookies(landing))

  const body = new URLSearchParams({
    __EVENTTARGET: '',
    __EVENTARGUMENT: '',
    __LASTFOCUS: '',
    __VIEWSTATE: hiddenField(landingHtml, '__VIEWSTATE'),
    __VIEWSTATEGENERATOR: hiddenField(landingHtml, '__VIEWSTATEGENERATOR'),
    __EVENTVALIDATION: hiddenField(landingHtml, '__EVENTVALIDATION'),
    __RequestVerificationToken: hiddenField(landingHtml, '__RequestVerificationToken'),
    rbSearchByList: 'refno',
    searchTextBox: ref,
    btnSearch: 'Search',
  })

  // Step 2: POST the search (fetch follows the redirect to the bill page).
  const result = await fetch(base, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://bill.pitc.com.pk',
      Referer: base,
      Cookie: cookies,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(45_000),
  }).catch(() => {
    throw new BillFetchError('Could not reach the bill portal. Check your connection.')
  })
  const html = await result.text()

  if (/Given Ref\/App No is invalid|invalid reference/i.test(html)) {
    throw new BillFetchError('Reference number not found on the portal. Double-check it.')
  }
  return html
}

/**
 * Fetch and parse a bill for the given company + reference number.
 * Throws BillFetchError with a user-friendly message on failure.
 */
export async function fetchBill(company: string, refno: string): Promise<ScrapedBill> {
  const safeCompany = company.toLowerCase().replace(/[^a-z]/g, '')
  const ref = refno.replace(/\s+/g, '')
  if (!safeCompany || !ref) throw new BillFetchError('Company and reference number are required.')

  const html = await fetchBillPageHtml(safeCompany, ref)
  const bill = parseBill(html, safeCompany, ref)
  if (bill.unitsConsumed == null && bill.payableWithinDueDate == null) {
    throw new BillFetchError('Could not read the bill. The portal layout may have changed.')
  }
  return bill
}

/** Make the portal's printable bill page render standalone by resolving its
 *  relative CSS/image URLs against the portal origin. */
function injectBase(html: string, href: string): string {
  const tag = `<base href="${href}">`
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}${tag}`)
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}<head>${tag}</head>`)
  return `${tag}${html}`
}

/**
 * Fetch the portal's rendered bill page (the same document the "Official bill"
 * link opens) as standalone HTML, so the app can show or download it directly
 * instead of redirecting the user to the DISCO site. Uses the same search flow
 * as the scraper. Throws BillFetchError on failure.
 */
export async function fetchBillDocument(company: string, refno: string): Promise<string> {
  const safeCompany = company.toLowerCase().replace(/[^a-z]/g, '')
  const ref = refno.replace(/\s+/g, '')
  if (!safeCompany || !ref) throw new BillFetchError('Company and reference number are required.')

  let html = await fetchBillPageHtml(safeCompany, ref)
  // The portal mislabels the page as utf-16; we re-emit it as utf-8, so align
  // the meta charset or the browser garbles it when read from a blob/file.
  html = html.replace(/<meta\s+charset\s*=\s*["']?utf-16["']?\s*\/?>/i, '<meta charset="utf-8" />')
  // Resolve the page's relative CSS/images against the portal so it renders
  // standalone when opened from a blob URL or a downloaded file.
  return injectBase(html, `https://bill.pitc.com.pk/${safeCompany}bill/`)
}

/** All PITC-hosted DISCO portal codes. */
const COMPANIES = [
  'mepco', 'lesco', 'iesco', 'gepco', 'fesco',
  'pesco', 'hesco', 'sepco', 'qesco', 'tesco',
]

/**
 * Detect the company from a reference number alone by querying every
 * DISCO portal in parallel and returning the first valid bill.
 */
export async function fetchBillAuto(refno: string): Promise<ScrapedBill> {
  try {
    return await Promise.any(COMPANIES.map((c) => fetchBill(c, refno)))
  } catch {
    throw new BillFetchError(
      'Reference number not found on any DISCO portal. Double-check the number.',
    )
  }
}

/** Fetch a bill: auto-detect the company when one is not supplied. */
export async function getBill(company: string, refno: string): Promise<ScrapedBill> {
  const ref = refno.replace(/\s+/g, '')
  if (!ref) throw new BillFetchError('A reference number is required.')
  return company ? fetchBill(company, ref) : fetchBillAuto(ref)
}
