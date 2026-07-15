import type { DeviceSnapshot } from '../types'

/**
 * Storage contract for the Devices module. The UI only talks to this
 * interface, so the transport (router API, mock…) can be swapped freely.
 * Every mutation returns the fresh snapshot so the UI stays in sync.
 */
export interface DeviceRepository {
  listDevices(): Promise<DeviceSnapshot>
  blockDevice(mac: string, hostName?: string): Promise<DeviceSnapshot>
  unblockDevice(mac: string): Promise<DeviceSnapshot>
  /**
   * Switch to allow-list mode — only these MACs may connect, all others are
   * blocked. An empty list disables the filter, allowing every device again.
   */
  setWhitelist(macs: string[]): Promise<DeviceSnapshot>
}
