import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ConnectedDevice, DeviceSnapshot, RouterTraffic } from '../types'
import { deviceRepo } from '../data'
import { deviceNamesRepo, type DeviceNameMap } from '../data/deviceNamesApi'

export interface DevicesState {
  loading: boolean
  /** Non-null when the initial load failed. */
  error: string | null
  devices: ConnectedDevice[]
  /** Whole-router traffic counters, or null when the firmware doesn't expose them. */
  traffic: RouterTraffic | null
  /** true when the router is in allow-list mode (block all except a keep set). */
  whitelistMode: boolean
  /** MAC currently being blocked/unblocked, or null. */
  busyMac: string | null
  /** true while a whitelist change (block-all-others / allow-all) is in flight. */
  applyingWhitelist: boolean
  /** Error from a refresh or block/unblock action (shown in a snackbar). */
  actionError: string | null
  clearActionError: () => void
  refresh: () => Promise<void>
  refreshing: boolean
  block: (device: ConnectedDevice) => Promise<void>
  unblock: (device: ConnectedDevice) => Promise<void>
  /** Keep only these MACs connected; [] allows every device again. */
  setWhitelist: (macs: string[]) => Promise<void>
  /** Set a friendly name for a device (empty string clears it). */
  rename: (device: ConnectedDevice, name: string) => Promise<void>
}

/**
 * Loads the router's connected devices and exposes block/unblock actions.
 * Local to the Devices page — the data isn't shared across routes, so there's
 * no global provider (unlike the electricity/bike/car modules).
 */
export function useDevices(): DevicesState {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [devices, setDevices] = useState<ConnectedDevice[]>([])
  const [namesByMac, setNamesByMac] = useState<DeviceNameMap>({})
  const [traffic, setTraffic] = useState<RouterTraffic | null>(null)
  const [whitelistMode, setWhitelistMode] = useState(false)
  const [busyMac, setBusyMac] = useState<string | null>(null)
  const [applyingWhitelist, setApplyingWhitelist] = useState(false)

  // Fold a snapshot into state — device list, filter mode and traffic always
  // move together (each snapshot carries the fresh counters).
  const apply = useCallback((snap: DeviceSnapshot) => {
    setDevices(snap.devices)
    setWhitelistMode(snap.whitelistMode)
    setTraffic(snap.traffic ?? null)
  }, [])

  // Initial load. Mirrors the other modules' provider pattern: an async IIFE
  // with an `active` guard so a fast unmount doesn't set state after teardown.
  useEffect(() => {
    let active = true
    ;(async () => {
      // Custom names are best-effort: a DB hiccup must never hide the device
      // list, so fetch them alongside and swallow their errors.
      const namesPromise = deviceNamesRepo.getNames().catch(() => ({}) as DeviceNameMap)
      try {
        const snap = await deviceRepo.listDevices()
        if (active) apply(snap)
        const names = await namesPromise
        if (active) setNamesByMac(names)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load devices.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [apply])

  // Manual re-fetch (top-bar refresh / retry). Called from event handlers, so
  // setting state synchronously here is fine.
  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      apply(await deviceRepo.listDevices())
      setError(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to refresh devices.')
    } finally {
      setRefreshing(false)
    }
  }, [apply])

  const run = useCallback(
    async (device: ConnectedDevice, action: () => Promise<DeviceSnapshot>) => {
      setBusyMac(device.mac)
      try {
        apply(await action())
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Action failed.')
      } finally {
        setBusyMac(null)
      }
    },
    [apply],
  )

  // Block a single device. In deny-list mode this adds the MAC to the block
  // list; in allow-list (whitelist) mode there is no block list, so blocking
  // means dropping the device from the allowed set instead. Either way the
  // per-device spinner (busyMac) drives the card, unlike the bulk whitelist
  // edit which uses applyingWhitelist.
  const block = useCallback(
    (device: ConnectedDevice) =>
      run(device, () =>
        whitelistMode
          ? deviceRepo.setWhitelist(
              devices.filter((d) => !d.blocked && d.mac !== device.mac).map((d) => d.mac),
            )
          : deviceRepo.blockDevice(device.mac, device.hostName),
      ),
    [run, whitelistMode, devices],
  )

  // Restore access to a single device. In whitelist mode that means adding the
  // MAC back to the allowed set; otherwise it drops the MAC from the block list.
  const unblock = useCallback(
    (device: ConnectedDevice) =>
      run(device, () =>
        whitelistMode
          ? deviceRepo.setWhitelist([
              ...devices.filter((d) => !d.blocked).map((d) => d.mac),
              device.mac,
            ])
          : deviceRepo.unblockDevice(device.mac),
      ),
    [run, whitelistMode, devices],
  )

  const setWhitelist = useCallback(
    async (macs: string[]) => {
      setApplyingWhitelist(true)
      try {
        apply(await deviceRepo.setWhitelist(macs))
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to update the allowed list.')
      } finally {
        setApplyingWhitelist(false)
      }
    },
    [apply],
  )

  // Save a friendly name for a device. An empty name clears the override so the
  // router-reported host name shows again. Keyed by MAC, not IP — DHCP hands out
  // fresh IPs, but a device's MAC is stable.
  const rename = useCallback(async (device: ConnectedDevice, name: string) => {
    try {
      setNamesByMac(await deviceNamesRepo.setName(device.mac, name))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save the device name.')
    }
  }, [])

  // Overlay each device with its user-chosen name (when set), so the whole UI
  // reads the friendly name off `customName`.
  const namedDevices = useMemo(
    () => devices.map((d) => ({ ...d, customName: namesByMac[d.mac] })),
    [devices, namesByMac],
  )

  return {
    loading,
    error,
    devices: namedDevices,
    traffic,
    whitelistMode,
    busyMac,
    applyingWhitelist,
    actionError,
    clearActionError: () => setActionError(null),
    refresh,
    refreshing,
    block,
    unblock,
    setWhitelist,
    rename,
  }
}
