import { ApiDeviceRepository } from './apiRepository'
import { RealtimeDeviceRepository } from './realtimeRepository'
import type { DeviceRepository } from './repository'

// Transport for router commands:
//   'http'     (default) — same-origin POST /api/router. Works when the server
//                          runs on the Zong Wi-Fi (local `npm run dev`).
//   'realtime'           — relay to the home agent over a private Supabase
//                          Realtime channel. Set this on the deployed build so
//                          Devices works even though Vercel can't reach the LAN.
const transport = (import.meta.env.VITE_ROUTER_TRANSPORT as string | undefined) || 'http'

/** Active repository for the module. */
export const deviceRepo: DeviceRepository =
  transport === 'realtime' ? new RealtimeDeviceRepository() : new ApiDeviceRepository()

export type { DeviceRepository } from './repository'
