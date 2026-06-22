import type { Car, CarService, CarSettings } from '../types'
import { getAccessToken } from '@/lib/supabase'
import type {
  CarPatch,
  CarRepository,
  CarServicePatch,
  NewCar,
  NewCarService,
} from './repository'

async function rpc<T>(op: string, payload: Record<string, unknown> = {}): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch('/api/car', {
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

/** Repository backed by the /api/car endpoint (Supabase Postgres). */
export class ApiCarRepository implements CarRepository {
  getCars(): Promise<Car[]> {
    return rpc<Car[]>('getCars')
  }

  addCar(input: NewCar): Promise<Car> {
    return rpc<Car>('addCar', input as unknown as Record<string, unknown>)
  }

  updateCar(id: string, patch: CarPatch): Promise<Car> {
    return rpc<Car>('updateCar', { id, patch })
  }

  deleteCar(id: string): Promise<void> {
    return rpc<void>('deleteCar', { id })
  }

  getServices(carId?: string): Promise<CarService[]> {
    return rpc<CarService[]>('getServices', { carId })
  }

  addService(input: NewCarService): Promise<CarService> {
    return rpc<CarService>('addService', input as unknown as Record<string, unknown>)
  }

  updateService(id: string, patch: CarServicePatch): Promise<CarService> {
    return rpc<CarService>('updateService', { id, patch })
  }

  deleteService(id: string): Promise<void> {
    return rpc<void>('deleteService', { id })
  }

  getSettings(): Promise<CarSettings> {
    return rpc<CarSettings>('getCarSettings')
  }

  saveSettings(settings: CarSettings): Promise<CarSettings> {
    return rpc<CarSettings>('saveCarSettings', settings as unknown as Record<string, unknown>)
  }
}
