// Client for the Huawei HiLink HTTP API that Zong 4G devices (Bolt/Bolt+,
// E557x/E5576 family) expose at http://192.168.8.1. Used to list connected
// Wi-Fi clients and block/unblock them via the router's MAC filter.
//
// IMPORTANT: the router is only reachable on the local Wi-Fi. This module runs
// server-side, so it only works when the app's server runs on a machine joined
// to the Zong Wi-Fi — i.e. `npm run dev` at home. A Vercel deployment can never
// reach 192.168.8.1, so /api/router fails with a clear message in production.
//
// Auth flow (Huawei "SCRAM"/password_type 4):
//   1. GET /api/webserver/SesTokInfo -> a SessionID cookie + a verification token.
//   2. POST /api/user/login with a SHA-256 hashed password and that token.
//   3. Every later request sends the current SessionID cookie + rolling token;
//      each response hands back the next token to use.
//
// Runs in Node only (uses global fetch + node:crypto).

import { createHash } from 'node:crypto'

export class RouterError extends Error {}

const CONFIG = {
  // Base URL of the router. Override via env if yours differs.
  base: (process.env.ZONG_ROUTER_HOST || 'http://192.168.8.1').replace(/\/+$/, ''),
  username: process.env.ZONG_ROUTER_USERNAME || 'admin',
  password: process.env.ZONG_ROUTER_PASSWORD || '',
}

// The router is on the LAN, so responses are fast; fail quickly if it's not
// reachable (wrong network / running in the cloud) instead of hanging.
const TIMEOUT_MS = 8000

export interface ConnectedDevice {
  /** MAC address, upper-case colon form, e.g. "28:7B:11:86:C8:B3". */
  mac: string
  /** Router-reported host name, when known. */
  hostName?: string
  ipAddress?: string
  /** true when the device is currently associated to the Wi-Fi. */
  online: boolean
  /** true when the device's MAC is on the router's block (deny) list. */
  blocked: boolean
}

export interface DeviceSnapshot {
  devices: ConnectedDevice[]
  /**
   * true when the router is in allow-list (whitelist) mode: only the listed
   * MACs may connect and every other device is blocked. false is the normal
   * deny-list mode where `blockDevice`/`unblockDevice` apply.
   */
  whitelistMode: boolean
}

// ---------------------------------------------------------------------------
// Tiny XML helpers. The HiLink API returns small, flat XML documents, so a
// regex read (like billScraper does for HTML) is enough — no dependency needed.
// ---------------------------------------------------------------------------

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** First inner text of <tag>…</tag>, or undefined. */
function tag(xml: string, name: string): string | undefined {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? unescapeXml(m[1].trim()) : undefined
}

/** Huawei error code from an <error><code>…</code></error> body, if present. */
function errorCode(xml: string): string | undefined {
  return /<error>/i.test(xml) ? tag(xml, 'code') : undefined
}

const ERROR_MESSAGES: Record<string, string> = {
  '108001': 'The router rejected the username.',
  '108002': 'The router rejected the password.',
  '108003': 'Already logged in elsewhere. Log out of the router web page and try again.',
  '108006': 'Wrong router username or password. Check ZONG_ROUTER_PASSWORD in .env.',
  '108007': 'Too many failed logins. Wait a minute, then try again.',
  '125001': 'The router session token was rejected. Try again.',
  '125002': 'The router session expired. Try again.',
  '125003': 'The router session token was rejected. Try again.',
}

function mac(s: string | undefined): string {
  return (s ?? '').trim().toUpperCase()
}

// ---------------------------------------------------------------------------
// Session: handles the cookie + rolling verification token.
// ---------------------------------------------------------------------------

class RouterSession {
  private cookie = ''
  private token = ''

  private url(path: string): string {
    return `${CONFIG.base}${path.startsWith('/') ? '' : '/'}${path}`
  }

  /** Capture a fresh SessionID cookie / verification token from a response. */
  private absorb(res: Response): void {
    const setCookie =
      (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.().join('; ') ??
      res.headers.get('set-cookie') ??
      ''
    const sid = setCookie.match(/SessionID=[^;]+/i)
    if (sid) this.cookie = sid[0]
    // On login two tokens arrive (…one/…two); use the first. Normal requests
    // return the next token in __RequestVerificationToken.
    const next =
      res.headers.get('__RequestVerificationTokenone') ??
      res.headers.get('__RequestVerificationToken')
    if (next) this.token = next
  }

  private async send(method: string, path: string, body?: string): Promise<string> {
    let res: Response
    try {
      res = await fetch(this.url(path), {
        method,
        headers: {
          Accept: 'application/xml, text/xml, */*',
          'X-Requested-With': 'XMLHttpRequest',
          ...(this.cookie ? { Cookie: this.cookie } : {}),
          ...(this.token ? { __RequestVerificationToken: this.token } : {}),
          ...(body != null
            ? { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
            : {}),
        },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (err) {
      const name = err instanceof Error ? err.name : ''
      if (name === 'TimeoutError' || name === 'AbortError') {
        throw new RouterError(
          `The router at ${CONFIG.base} did not respond. Make sure this machine is on the Zong Wi-Fi.`,
        )
      }
      throw new RouterError(
        `Could not reach the router at ${CONFIG.base}. This only works when the app runs locally on the Zong Wi-Fi.`,
      )
    }
    const text = await res.text()
    this.absorb(res)
    return text
  }

  /** Establish a session and log in. Safe to call once per request lifecycle. */
  async connect(): Promise<void> {
    if (!CONFIG.password) {
      throw new RouterError('Router password not configured. Set ZONG_ROUTER_PASSWORD in .env.')
    }
    // 1. Session + token.
    const info = await this.send('GET', '/api/webserver/SesTokInfo')
    const sesInfo = tag(info, 'SesInfo')
    this.token = tag(info, 'TokInfo') ?? ''
    if (sesInfo) {
      const sid = sesInfo.match(/SessionID=[^;]+/i)
      this.cookie = sid ? sid[0] : `SessionID=${sesInfo}`
    }
    if (!this.token) {
      throw new RouterError('Router did not return a session token — is this a Huawei/Zong device?')
    }

    // 2. Login. password_type 4:
    //   inner    = base64(sha256hex(password))
    //   Password = base64(sha256hex(username + inner + token))
    const sha256hex = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex')
    const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64')
    const inner = b64(sha256hex(CONFIG.password))
    const hashed = b64(sha256hex(CONFIG.username + inner + this.token))
    const body =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<request><Username>${escapeXml(CONFIG.username)}</Username>` +
      `<Password>${hashed}</Password><password_type>4</password_type></request>`

    const res = await this.send('POST', '/api/user/login', body)
    const code = errorCode(res)
    if (code) {
      throw new RouterError(ERROR_MESSAGES[code] ?? `Router login failed (code ${code}).`)
    }
    if (!/<response>\s*OK\s*<\/response>/i.test(res) && !/OK/i.test(res)) {
      throw new RouterError('Router login failed. Check the username/password in .env.')
    }
  }

  /** GET an API path, throwing RouterError on a Huawei error body. */
  async apiGet(path: string): Promise<string> {
    const xml = await this.send('GET', path)
    const code = errorCode(xml)
    if (code) throw new RouterError(ERROR_MESSAGES[code] ?? `Router request failed (code ${code}).`)
    return xml
  }

  /** POST an XML body to an API path, throwing RouterError on a Huawei error. */
  async apiPost(path: string, body: string): Promise<string> {
    const xml = await this.send('POST', path, body)
    const code = errorCode(xml)
    if (code) throw new RouterError(ERROR_MESSAGES[code] ?? `Router request failed (code ${code}).`)
    return xml
  }
}

// ---------------------------------------------------------------------------
// MAC filter. Verified against a Huawei B310s-927 (Zong 4G): blocking a client
// is the device-level MAC filter at /api/security/mac-filter — NOT the Wi-Fi
// /api/wlan/mac-filter (which rejects writes on this firmware). The endpoint
// mirrors exactly what the router's own web UI (js/macfilter.js) posts:
//
//   <request>
//     <policy>2</policy>                         <!-- 2 = deny/block list -->
//     <macfilters>
//       <macfilter><value>AA:BB:..</value><status>1</status></macfilter>
//     </macfilters>
//   </request>
//
// Requires the firewall's main switch and MAC-filter switch to be on
// (api/security/firewall-switch); the readback stores an active deny list as
// policy 0 with status-1 entries, so blocked state is keyed off the entries.
// ---------------------------------------------------------------------------

const FILTER_PATH = '/api/security/mac-filter'
const FIREWALL_PATH = '/api/security/firewall-switch'
const MAX_FILTERS = 10 // the web UI caps the deny list at 10 devices

interface FilterEntry {
  mac: string
  status: number
}
interface SecurityFilter {
  /** Raw policy from the device: 0 = deny/off, 1 = allow (whitelist). */
  policy: number
  entries: FilterEntry[]
}

async function readFilter(session: RouterSession): Promise<SecurityFilter> {
  const xml = await session.apiGet(FILTER_PATH)
  const entries: FilterEntry[] = []
  for (const block of xml.match(/<macfilter>[\s\S]*?<\/macfilter>/gi) ?? []) {
    const m = mac(tag(block, 'value'))
    if (m) entries.push({ mac: m, status: Number(tag(block, 'status') ?? '0') || 0 })
  }
  return { policy: Number(tag(xml, 'policy') ?? '0') || 0, entries }
}

/** True when the router is in allow-list (whitelist) mode with active entries. */
function isWhitelist(filter: SecurityFilter): boolean {
  return filter.policy === 1 && filter.entries.some((e) => e.status !== 0)
}

/** MACs actively denied (status 1) — the blocked set. */
function blockedMacs(filter: SecurityFilter): Set<string> {
  if (isWhitelist(filter)) return new Set() // allow-list entries are permitted, not blocked
  return new Set(filter.entries.filter((e) => e.status !== 0).map((e) => e.mac))
}

// An allow-list is the opposite intent — adding a MAC would *permit* it. Refuse
// rather than silently invert the user's router setup.
function assertNotWhitelist(filter: SecurityFilter): void {
  if (isWhitelist(filter)) {
    throw new RouterError(
      "The router's MAC filter is in allow-list (whitelist) mode. Block/unblock uses a " +
        'deny list and would conflict. Change it in the router page (Security) first.',
    )
  }
}

async function ensureFilterEnabled(session: RouterSession): Promise<void> {
  const fw = await session.apiGet(FIREWALL_PATH)
  const main = tag(fw, 'FirewallMainSwitch') ?? '1'
  const macSwitch = tag(fw, 'firewallmacfilterswitch') ?? '1'
  if (main === '0' || macSwitch === '0') {
    throw new RouterError(
      'The router’s MAC filter is turned off. Enable "Firewall" and "WLAN MAC filter" ' +
        'in the router page (192.168.8.1 → Security) first.',
    )
  }
}

/**
 * Write the MAC filter with an explicit policy:
 *   2 = deny list (block the listed MACs), 1 = allow list (only the listed MACs
 *   may connect — a whitelist). An empty list always writes policy 0, which
 *   disables the filter entirely (every device allowed).
 */
async function writeFilter(
  session: RouterSession,
  macs: string[],
  policy: 1 | 2,
): Promise<void> {
  const items = macs
    .map((m) => `<macfilter><value>${escapeXml(m)}</value><status>1</status></macfilter>`)
    .join('')
  const body =
    `<?xml version="1.0" encoding="UTF-8"?><request>` +
    `<policy>${macs.length ? policy : 0}</policy>` +
    `<macfilters>${items}</macfilters></request>`
  await session.apiPost(FILTER_PATH, body)
}

// ---------------------------------------------------------------------------
// Public operations.
// ---------------------------------------------------------------------------

/** Build the device list + filter mode from an already-connected session. */
async function buildSnapshot(session: RouterSession): Promise<DeviceSnapshot> {
  const [hostXml, filter] = await Promise.all([
    session.apiGet('/api/wlan/host-list'),
    readFilter(session),
  ])
  const whitelistMode = isWhitelist(filter)
  // In allow-list mode the active entries are the *permitted* MACs, so a device
  // is blocked when it is NOT one of them. In deny mode it's the reverse.
  const allowed = new Set(filter.entries.filter((e) => e.status !== 0).map((e) => e.mac))
  const denied = blockedMacs(filter)
  const isBlocked = (m: string) => (whitelistMode ? !allowed.has(m) : denied.has(m))

  const byMac = new Map<string, ConnectedDevice>()
  // Currently-connected clients.
  for (const host of hostXml.match(/<Host>[\s\S]*?<\/Host>/gi) ?? []) {
    const m = mac(tag(host, 'MacAddress'))
    if (!m) continue
    byMac.set(m, {
      mac: m,
      hostName: tag(host, 'HostName') || undefined,
      ipAddress: tag(host, 'IpAddress') || undefined,
      online: true,
      blocked: isBlocked(m),
    })
  }
  // Devices named in the filter that aren't currently connected still belong in
  // the list — the allowed set (whitelist) or the denied set (deny list). The
  // filter endpoint doesn't store host names, so those show as unknown.
  for (const m of whitelistMode ? allowed : denied) {
    if (!byMac.has(m)) byMac.set(m, { mac: m, online: false, blocked: isBlocked(m) })
  }

  const devices = [...byMac.values()].sort((a, b) => {
    // Online first, then by name/MAC.
    if (a.online !== b.online) return a.online ? -1 : 1
    return (a.hostName ?? a.mac).localeCompare(b.hostName ?? b.mac)
  })
  return { devices, whitelistMode }
}

async function listDevices(): Promise<DeviceSnapshot> {
  const session = new RouterSession()
  await session.connect()
  return buildSnapshot(session)
}

async function setBlocked(target: string, blocked: boolean): Promise<DeviceSnapshot> {
  const wanted = mac(target)
  if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(wanted)) {
    throw new RouterError('Invalid MAC address.')
  }
  const session = new RouterSession()
  await session.connect()

  if (blocked) await ensureFilterEnabled(session)
  const filter = await readFilter(session)
  assertNotWhitelist(filter)

  const current = filter.entries.filter((e) => e.status !== 0).map((e) => e.mac)
  const has = current.includes(wanted)
  let next = current
  if (blocked && !has) {
    if (current.length >= MAX_FILTERS) {
      throw new RouterError(
        `The router's block list is full (max ${MAX_FILTERS} devices). Unblock one first.`,
      )
    }
    next = [...current, wanted]
  } else if (!blocked && has) {
    next = current.filter((m) => m !== wanted)
  }
  await writeFilter(session, next, 2)

  return buildSnapshot(session)
}

/**
 * Switch the router to allow-list mode: only `rawMacs` may connect and every
 * other device is blocked. An empty list disables the filter entirely, allowing
 * all devices again. This is the inverse of block/unblock, so it deliberately
 * skips the deny-list guard (`assertNotWhitelist`) — it *sets* the whitelist.
 *
 * Caution: any device not in the list is disconnected, including the machine
 * running this server if its MAC is omitted. The caller (UI) warns about that.
 */
async function setWhitelist(rawMacs: string[]): Promise<DeviceSnapshot> {
  const wanted = [...new Set(rawMacs.map(mac))].filter(Boolean)
  for (const m of wanted) {
    if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(m)) {
      throw new RouterError(`Invalid MAC address: ${m}`)
    }
  }
  if (wanted.length > MAX_FILTERS) {
    throw new RouterError(
      `The router's filter holds at most ${MAX_FILTERS} devices. Keep fewer than that.`,
    )
  }
  const session = new RouterSession()
  await session.connect()
  if (wanted.length) await ensureFilterEnabled(session)
  await writeFilter(session, wanted, 1)

  return buildSnapshot(session)
}

/** Raw XML from key endpoints — for confirming a device's exact API shape. */
async function diag(): Promise<Record<string, string>> {
  const session = new RouterSession()
  await session.connect()
  const paths = ['/api/device/information', '/api/wlan/host-list', FILTER_PATH, FIREWALL_PATH]
  const out: Record<string, string> = {}
  for (const p of paths) {
    try {
      out[p] = await session.apiGet(p)
    } catch (err) {
      out[p] = err instanceof Error ? `ERROR: ${err.message}` : 'ERROR'
    }
  }
  return out
}

/**
 * Whitelisted RPC dispatch for the /api/router endpoint. No per-user data —
 * the router is shared hardware — but callers must still be authenticated.
 */
export async function handleRouterOp(
  op: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  switch (op) {
    case 'listDevices':
      return listDevices()
    case 'blockDevice':
      return setBlocked(String(payload.mac), true)
    case 'unblockDevice':
      return setBlocked(String(payload.mac), false)
    case 'setWhitelist':
      return setWhitelist(Array.isArray(payload.macs) ? payload.macs.map(String) : [])
    case 'diag':
      return diag()
    default:
      throw new RouterError(`Unknown op: ${op}`)
  }
}
