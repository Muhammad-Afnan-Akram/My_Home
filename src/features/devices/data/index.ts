import { ApiDeviceRepository } from './apiRepository'
import type { DeviceRepository } from './repository'

/** Active repository for the module, backed by the /api/router endpoint. */
export const deviceRepo: DeviceRepository = new ApiDeviceRepository()

export type { DeviceRepository } from './repository'
