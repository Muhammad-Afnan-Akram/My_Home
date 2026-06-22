import { createContext, useContext } from 'react'
import type { Car, CarService } from '../types'
import type { CarPatch, CarServicePatch, NewCar, NewCarService } from '../data'

export interface CarState {
  loading: boolean
  error: string | null
  cars: Car[]
  services: CarService[]
  addCar: (input: NewCar) => Promise<Car>
  updateCar: (id: string, patch: CarPatch) => Promise<void>
  deleteCar: (id: string) => Promise<void>
  addService: (input: NewCarService) => Promise<void>
  updateService: (id: string, patch: CarServicePatch) => Promise<void>
  deleteService: (id: string) => Promise<void>
  /** Default distance (km) between oil changes; 0 = not tracked. */
  oilChangeIntervalKm: number
  setOilChangeInterval: (km: number) => void
}

export const CarContext = createContext<CarState | null>(null)

export function useCar(): CarState {
  const ctx = useContext(CarContext)
  if (!ctx) throw new Error('useCar must be used within a CarProvider')
  return ctx
}
