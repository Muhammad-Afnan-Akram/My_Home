import type { RealtimeChannel } from '@supabase/supabase-js'
import type { DeviceSnapshot } from '../types'
import { supabase, getAccessToken } from '@/lib/supabase'
import type { DeviceRepository } from './repository'

// Transport that reaches the router through the home agent (server/routerAgent.ts)
// over a private Supabase Realtime channel, instead of the same-origin
// /api/router endpoint. Used on the deployed build (VITE_ROUTER_TRANSPORT=realtime),
// where the server can't reach the LAN but the home agent can.
//
// Protocol (broadcast events on the shared channel):
//   app   -> agent : "rpc-request"  { id, op, args }
//   agent -> app   : "rpc-response" { id, ok, result? | error? }
// The id correlates the reply; unmatched replies are ignored and a slow/absent
// agent trips the timeout below.

const CHANNEL = (import.meta.env.VITE_ROUTER_CHANNEL as string | undefined) || 'router-control'

// The agent is on the LAN and the router responds fast, so a reply should arrive
// in ~1s. Allow generous slack for the double Realtime hop; if it lapses the
// agent is almost certainly not running.
const TIMEOUT_MS = 12000

interface Pending {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

interface RpcResponse {
  id?: string
  ok?: boolean
  result?: unknown
  error?: string
}

const pending = new Map<string, Pending>()

// One shared, lazily-subscribed channel for the whole module. Memoised so every
// op reuses the same subscription; cleared on failure so a later call can retry.
let channelPromise: Promise<RealtimeChannel> | null = null

async function getChannel(): Promise<RealtimeChannel> {
  if (channelPromise) return channelPromise
  channelPromise = (async () => {
    // Private-channel authorization: hand Realtime the user's JWT so the RLS
    // policies admit us, and keep it current when the token refreshes.
    await supabase.realtime.setAuth((await getAccessToken()) ?? undefined)
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) void supabase.realtime.setAuth(session.access_token)
    })

    const channel = supabase.channel(CHANNEL, {
      config: { private: true, broadcast: { self: false } },
    })

    channel.on('broadcast', { event: 'rpc-response' }, (message) => {
      const res = message.payload as RpcResponse
      if (!res?.id) return
      const p = pending.get(res.id)
      if (!p) return
      pending.delete(res.id)
      clearTimeout(p.timer)
      if (res.ok) p.resolve(res.result)
      else p.reject(new Error(res.error || 'Router request failed.'))
    })

    await new Promise<void>((resolve, reject) => {
      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') resolve()
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          reject(err ?? new Error(`Realtime channel ${status.toLowerCase().replace('_', ' ')}.`))
        }
      })
    })
    return channel
  })()

  // Don't cache a failed subscription — let the next call try again.
  channelPromise.catch(() => {
    channelPromise = null
  })
  return channelPromise
}

async function rpc<T>(op: string, args: Record<string, unknown> = {}): Promise<T> {
  const channel = await getChannel()
  const id = crypto.randomUUID()

  const result = await new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(
        new Error(
          "The home router agent isn't responding. Make sure it's running on the home " +
            'Wi-Fi (npm run agent).',
        ),
      )
    }, TIMEOUT_MS)
    pending.set(id, { resolve, reject, timer })

    channel
      .send({ type: 'broadcast', event: 'rpc-request', payload: { id, op, args } })
      .catch((err: unknown) => {
        clearTimeout(timer)
        pending.delete(id)
        reject(err instanceof Error ? err : new Error('Failed to send the router command.'))
      })
  })
  return result as T
}

/** Repository that relays router ops to the home agent via Supabase Realtime. */
export class RealtimeDeviceRepository implements DeviceRepository {
  listDevices(): Promise<DeviceSnapshot> {
    return rpc<DeviceSnapshot>('listDevices')
  }

  blockDevice(mac: string, hostName?: string): Promise<DeviceSnapshot> {
    return rpc<DeviceSnapshot>('blockDevice', { mac, hostName })
  }

  unblockDevice(mac: string): Promise<DeviceSnapshot> {
    return rpc<DeviceSnapshot>('unblockDevice', { mac })
  }

  setWhitelist(macs: string[]): Promise<DeviceSnapshot> {
    return rpc<DeviceSnapshot>('setWhitelist', { macs })
  }
}
