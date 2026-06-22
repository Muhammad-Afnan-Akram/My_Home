import type { Car, CarService, CarSettings } from '../types'

export type NewCar = Omit<Car, 'id' | 'createdAt'>
export type CarPatch = Partial<Omit<Car, 'id' | 'createdAt'>>
export type NewCarService = Omit<CarService, 'id' | 'createdAt'>
export type CarServicePatch = Partial<Omit<CarService, 'id' | 'createdAt'>>

/**
 * Storage contract for the Car module. The UI only ever talks to this
 * interface, so the backend implementation can be swapped without touching the
 * views. Everything is async to match the network layer.
 */
export interface CarRepository {
  getCars(): Promise<Car[]>
  addCar(input: NewCar): Promise<Car>
  updateCar(id: string, patch: CarPatch): Promise<Car>
  deleteCar(id: string): Promise<void>

  getServices(carId?: string): Promise<CarService[]>
  addService(input: NewCarService): Promise<CarService>
  updateService(id: string, patch: CarServicePatch): Promise<CarService>
  deleteService(id: string): Promise<void>

  getSettings(): Promise<CarSettings>
  saveSettings(settings: CarSettings): Promise<CarSettings>
}
