import type { Bike, BikeSettings, Tuning } from '../types'
import { getAccessToken } from '@/lib/supabase'
import type { BikePatch, BikeRepository, NewBike, NewTuning } from './repository'

async function rpc<T>(op: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch('/api/bike', {
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

/** Repository backed by the /api/bike endpoint (Supabase Postgres). */
export class ApiBikeRepository implements BikeRepository {
  getBikes(): Promise<Bike[]> {
    return rpc<Bike[]>('getBikes')
  }

  addBike(input: NewBike): Promise<Bike> {
    return rpc<Bike>('addBike', input as unknown as Record<string, unknown>)
  }

  updateBike(id: string, patch: BikePatch): Promise<Bike> {
    return rpc<Bike>('updateBike', { id, patch })
  }

  deleteBike(id: string): Promise<void> {
    return rpc<void>('deleteBike', { id })
  }

  getTunings(bikeId?: string): Promise<Tuning[]> {
    return rpc<Tuning[]>('getTunings', { bikeId })
  }

  addTuning(input: NewTuning): Promise<Tuning> {
    return rpc<Tuning>('addTuning', input as unknown as Record<string, unknown>)
  }

  deleteTuning(id: string): Promise<void> {
    return rpc<void>('deleteTuning', { id })
  }

  getSettings(): Promise<BikeSettings> {
    return rpc<BikeSettings>('getBikeSettings')
  }

  saveSettings(settings: BikeSettings): Promise<BikeSettings> {
    return rpc<BikeSettings>('saveBikeSettings', settings as unknown as Record<string, unknown>)
  }
}
