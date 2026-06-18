import { createContext, useContext } from 'react'
import type { Bike, Tuning } from '../types'
import type { BikePatch, NewBike, NewTuning } from '../data'

export interface BikeState {
  loading: boolean
  error: string | null
  bikes: Bike[]
  tunings: Tuning[]
  addBike: (input: NewBike) => Promise<Bike>
  updateBike: (id: string, patch: BikePatch) => Promise<void>
  deleteBike: (id: string) => Promise<void>
  addTuning: (input: NewTuning) => Promise<void>
  deleteTuning: (id: string) => Promise<void>
  /** Default distance (km) between tunings; 0 = not tracked. */
  tuningIntervalKm: number
  setTuningInterval: (km: number) => void
}

export const BikeContext = createContext<BikeState | null>(null)

export function useBike(): BikeState {
  const ctx = useContext(BikeContext)
  if (!ctx) throw new Error('useBike must be used within a BikeProvider')
  return ctx
}
