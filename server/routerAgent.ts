// Home router agent — the "bridge" that lets the DEPLOYED app control the Zong
// 4G router even though the router (192.168.8.1) is only reachable on the home
// LAN. Nothing can change that constraint, so this process must run on a machine
// joined to the Zong Wi-Fi. It makes only OUTBOUND connections (to Supabase), so
// no tunnel, port-forward, firewall rule or TLS cert is needed.
//
// Flow:
//   deployed app  --(broadcast rpc-request)-->  Supabase Realtime channel
//                                                     |
//   this agent  <--(delivered over WSS)---------------+
//   this agent  --> handleRouterOp() --> 192.168.8.1 --> result
//   this agent  --(broadcast rpc-response)-->  channel  -->  deployed app
//
// Security: the channel is PRIVATE. Supabase RLS on realtime.messages (see
// ROUTER_AGENT.md) restricts both read and write to the single Devices-allowed
// account, so only you can drive it and no one else can read the device list.
// The agent signs in as that account, so it passes the same RLS.
//
// Run: `npm run agent` on the home machine. Node 24 runs this .ts file directly.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { handleRouterOp } from './routerClient.ts'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const EMAIL = process.env.ROUTER_AGENT_EMAIL
const PASSWORD = process.env.ROUTER_AGENT_PASSWORD
const CHANNEL = process.env.VITE_ROUTER_CHANNEL || 'router-control'

function fail(message: string): never {
  console.error(`[router-agent] ${message}`)
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  fail('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set in .env')
}
if (!EMAIL || !PASSWORD) {
  fail('ROUTER_AGENT_EMAIL / ROUTER_AGENT_PASSWORD are not set in .env')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: true },
})

interface RpcRequest {
  id?: string
  op?: string
  args?: Record<string, unknown>
}

async function main(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMAIL as string,
    password: PASSWORD as string,
  })
  if (error || !data.session) {
    fail(`Supabase sign-in failed for ${EMAIL}: ${error?.message ?? 'no session'}`)
  }
  console.log(`[router-agent] signed in as ${EMAIL}`)

  // Authorize the Realtime connection with the user's JWT so the private-channel
  // RLS policies accept us. Keep it fresh across token refreshes.
  await supabase.realtime.setAuth(data.session.access_token)
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) void supabase.realtime.setAuth(session.access_token)
  })

  const channel = supabase.channel(CHANNEL, { config: { private: true } })

  // Function declaration is hoisted, so referencing `channel` here is safe — the
  // handler only ever runs after subscription, by which point it's assigned.
  async function handle(req: RpcRequest): Promise<void> {
    const { id, op, args } = req ?? {}
    if (!id || !op) return
    let response: Record<string, unknown>
    try {
      const result = await handleRouterOp(String(op), args ?? {})
      response = { id, ok: true, result }
      console.log(`[router-agent] ${op} -> ok`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Router request failed.'
      response = { id, ok: false, error: message }
      console.warn(`[router-agent] ${op} -> error: ${message}`)
    }
    await channel.send({ type: 'broadcast', event: 'rpc-response', payload: response })
  }

  channel.on('broadcast', { event: 'rpc-request' }, (message) => {
    void handle(message.payload as RpcRequest)
  })

  channel.subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[router-agent] ready — listening on private channel "${CHANNEL}"`)
    } else if (status === 'CHANNEL_ERROR') {
      console.error(
        `[router-agent] channel error: ${err?.message ?? 'unknown'}. ` +
          'Check that the RLS policies from ROUTER_AGENT.md are applied and the account email matches.',
      )
    } else if (status === 'TIMED_OUT') {
      console.error('[router-agent] subscription timed out — will retry automatically.')
    }
  })

  const shutdown = () => {
    console.log('\n[router-agent] shutting down')
    void supabase.removeChannel(channel).finally(() => process.exit(0))
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

void main()
