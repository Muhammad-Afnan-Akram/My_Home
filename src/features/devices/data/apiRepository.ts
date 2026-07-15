import type { DeviceSnapshot } from '../types'
import { getAccessToken } from '@/lib/supabase'
import type { DeviceRepository } from './repository'

async function rpc<T>(op: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch('/api/router', {
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
        : 'Router request failed.'
    throw new Error(message)
  }
  return data as T
}

/** Repository backed by the /api/router endpoint (Huawei HiLink API). */
export class ApiDeviceRepository implements DeviceRepository {
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
