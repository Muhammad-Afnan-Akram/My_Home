import { useCallback, useEffect, useState } from 'react'
import type { ConnectedDevice, DeviceSnapshot } from '../types'
import { deviceRepo } from '../data'

export interface DevicesState {
  loading: boolean
  /** Non-null when the initial load failed. */
  error: string | null
  devices: ConnectedDevice[]
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
  const [whitelistMode, setWhitelistMode] = useState(false)
  const [busyMac, setBusyMac] = useState<string | null>(null)
  const [applyingWhitelist, setApplyingWhitelist] = useState(false)

  // Fold a snapshot into state — device list and filter mode always move together.
  const apply = useCallback((snap: DeviceSnapshot) => {
    setDevices(snap.devices)
    setWhitelistMode(snap.whitelistMode)
  }, [])

  // Initial load. Mirrors the other modules' provider pattern: an async IIFE
  // with an `active` guard so a fast unmount doesn't set state after teardown.
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const snap = await deviceRepo.listDevices()
        if (active) apply(snap)
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

  const block = useCallback(
    (device: ConnectedDevice) =>
      run(device, () => deviceRepo.blockDevice(device.mac, device.hostName)),
    [run],
  )

  const unblock = useCallback(
    (device: ConnectedDevice) => run(device, () => deviceRepo.unblockDevice(device.mac)),
    [run],
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

  return {
    loading,
    error,
    devices,
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
  }
}
