import { ApiBikeRepository } from './apiRepository'
import type { BikeRepository } from './repository'

/**
 * The active repository for the module. Backed by Supabase Postgres via the
 * /api/bike endpoint.
 */
export const bikeRepo: BikeRepository = new ApiBikeRepository()

export type { BikeRepository, BikePatch, NewBike, NewTuning } from './repository'
