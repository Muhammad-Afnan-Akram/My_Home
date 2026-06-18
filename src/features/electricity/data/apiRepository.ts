import type { BillInfo, Meter, Reading, Settings } from '../types'
import { getAccessToken } from '@/lib/supabase'
import type {
  ElectricityRepository,
  MeterPatch,
  NewMeter,
  NewReading,
} from './repository'

async function rpc<T>(op: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch('/api/db', {
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
        : 'Database request failed.'
    throw new Error(message)
  }
  return data as T
}

/**
 * Repository backed by the /api/db endpoint (Supabase Postgres). Drop-in
 * replacement for the localStorage repository.
 */
export class ApiElectricityRepository implements ElectricityRepository {
  getMeters(): Promise<Meter[]> {
    return rpc<Meter[]>('getMeters')
  }

  addMeter(input: NewMeter): Promise<Meter> {
    return rpc<Meter>('addMeter', input as unknown as Record<string, unknown>)
  }

  updateMeter(id: string, patch: MeterPatch): Promise<Meter> {
    return rpc<Meter>('updateMeter', { id, patch })
  }

  deleteMeter(id: string): Promise<void> {
    return rpc<void>('deleteMeter', { id })
  }

  getReadings(meterId?: string): Promise<Reading[]> {
    return rpc<Reading[]>('getReadings', { meterId })
  }

  addReading(input: NewReading): Promise<Reading> {
    return rpc<Reading>('addReading', input as unknown as Record<string, unknown>)
  }

  deleteReading(id: string): Promise<void> {
    return rpc<void>('deleteReading', { id })
  }

  getBill(meterId: string): Promise<BillInfo | null> {
    return rpc<BillInfo | null>('getBill', { meterId })
  }

  saveBill(bill: BillInfo): Promise<BillInfo> {
    return rpc<BillInfo>('saveBill', bill as unknown as Record<string, unknown>)
  }

  getSettings(): Promise<Settings> {
    return rpc<Settings>('getSettings')
  }

  saveSettings(settings: Settings): Promise<Settings> {
    return rpc<Settings>('saveSettings', settings as unknown as Record<string, unknown>)
  }
}
