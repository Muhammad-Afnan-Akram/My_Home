import type { Bike, BikeSettings, Tuning } from '../types'

export type NewBike = Omit<Bike, 'id' | 'createdAt'>
export type BikePatch = Partial<Omit<Bike, 'id' | 'createdAt'>>
export type NewTuning = Omit<Tuning, 'id' | 'createdAt'>

/**
 * Storage contract for the Bike Tuning module. The UI only ever talks to this
 * interface, so the backend implementation can be swapped without touching the
 * views. Everything is async to match the network layer.
 */
export interface BikeRepository {
  getBikes(): Promise<Bike[]>
  addBike(input: NewBike): Promise<Bike>
  updateBike(id: string, patch: BikePatch): Promise<Bike>
  deleteBike(id: string): Promise<void>

  getTunings(bikeId?: string): Promise<Tuning[]>
  addTuning(input: NewTuning): Promise<Tuning>
  deleteTuning(id: string): Promise<void>

  getSettings(): Promise<BikeSettings>
  saveSettings(settings: BikeSettings): Promise<BikeSettings>
}
