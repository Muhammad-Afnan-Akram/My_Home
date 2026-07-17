import { getAccessToken } from '@/lib/supabase'

/** Custom device names keyed by MAC address. */
export type DeviceNameMap = Record<string, string>

async function rpc<T>(op: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch('/api/device-names', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ op, payload }),
  })
  const data = (await res.json().catch(() => null)) as T | { error?: string } | null
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && data.error
        ? data.error
        : 'Failed to save the device name.'
    throw new Error(message)
  }
  return data as T
}

/**
 * Persists user-chosen device names, keyed by MAC (the router can't store them).
 * Both calls return the full { mac: name } map so the UI stays in sync.
 */
export const deviceNamesRepo = {
  getNames(): Promise<DeviceNameMap> {
    return rpc<DeviceNameMap>('getDeviceNames')
  },
  /** An empty name clears the override, restoring the router-reported host name. */
  setName(mac: string, name: string): Promise<DeviceNameMap> {
    return rpc<DeviceNameMap>('setDeviceName', { mac, name })
  },
}
