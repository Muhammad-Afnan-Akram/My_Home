import { ApiElectricityRepository } from './apiRepository'
import type { ElectricityRepository } from './repository'

/**
 * The active repository for the module. Backed by Supabase Postgres via the
 * /api/db endpoint. (The localStorage implementation remains available in
 * ./localRepository for offline/testing.)
 */
export const electricityRepo: ElectricityRepository = new ApiElectricityRepository()

export { fetchScrapedBill } from './billApi'

export type {
  ElectricityRepository,
  MeterPatch,
  NewMeter,
  NewReading,
} from './repository'
