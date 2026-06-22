import { ApiCarRepository } from './apiRepository'
import type { CarRepository } from './repository'

/**
 * The active repository for the module. Backed by Supabase Postgres via the
 * /api/car endpoint.
 */
export const carRepo: CarRepository = new ApiCarRepository()

export type { CarRepository, CarPatch, NewCar, NewCarService } from './repository'
