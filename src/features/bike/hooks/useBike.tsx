import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Bike, Tuning } from '../types'
import { bikeRepo } from '../data'
import type { BikePatch, NewBike, NewTuning } from '../data'
import { BikeContext, type BikeState } from './bikeContext'

/** Default tuning interval, applied to every bike. Cached per-device. */
const TUNING_INTERVAL_KEY = 'myhome.bike.tuningIntervalKm'
const DEFAULT_TUNING_INTERVAL_KM = 1000

// localStorage is only an instant cache; the database is the source of truth.
function readTuningInterval(): number {
  try {
    const raw = localStorage.getItem(TUNING_INTERVAL_KEY)
    if (raw == null) return DEFAULT_TUNING_INTERVAL_KM
    const n = Number(raw)
    // 0 is a valid stored value meaning "don't track an interval".
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_TUNING_INTERVAL_KM
  } catch {
    return DEFAULT_TUNING_INTERVAL_KM
  }
}

function cacheTuningInterval(km: number): void {
  try {
    localStorage.setItem(TUNING_INTERVAL_KEY, String(km))
  } catch {
    /* non-fatal: keep the in-memory value */
  }
}

export function BikeProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bikes, setBikes] = useState<Bike[]>([])
  const [tunings, setTunings] = useState<Tuning[]>([])
  const [tuningIntervalKm, setTuningIntervalState] = useState<number>(readTuningInterval)

  const setTuningInterval = useCallback((km: number) => {
    const rounded = Math.round(km)
    // 0 means "don't track"; anything invalid falls back to the default.
    const next = Number.isFinite(rounded) && rounded >= 0 ? rounded : DEFAULT_TUNING_INTERVAL_KM
    setTuningIntervalState(next)
    cacheTuningInterval(next) // instant local cache so reloads don't flash the default
    // Persist to the database (source of truth across devices/sessions).
    void bikeRepo.saveSettings({ tuningIntervalKm: next }).catch(() => {
      /* keep the cached value; a later save or reload will reconcile */
    })
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [b, t, settings] = await Promise.all([
          bikeRepo.getBikes(),
          bikeRepo.getTunings(),
          bikeRepo.getSettings(),
        ])
        if (!active) return
        setBikes(b)
        setTunings(t)
        setTuningIntervalState(settings.tuningIntervalKm)
        cacheTuningInterval(settings.tuningIntervalKm)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load data.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const addBike = useCallback(async (input: NewBike) => {
    const bike = await bikeRepo.addBike(input)
    setBikes((prev) => [...prev, bike])
    return bike
  }, [])

  const updateBike = useCallback(async (id: string, patch: BikePatch) => {
    const updated = await bikeRepo.updateBike(id, patch)
    setBikes((prev) => prev.map((b) => (b.id === id ? updated : b)))
  }, [])

  const deleteBike = useCallback(async (id: string) => {
    await bikeRepo.deleteBike(id)
    setBikes((prev) => prev.filter((b) => b.id !== id))
    setTunings((prev) => prev.filter((t) => t.bikeId !== id))
  }, [])

  const addTuning = useCallback(async (input: NewTuning) => {
    const tuning = await bikeRepo.addTuning(input)
    setTunings((prev) => [tuning, ...prev])
    // The server keeps the bike's odometer in sync with its latest tuning;
    // mirror that locally so the card/detail update without a reload.
    setBikes((prev) =>
      prev.map((b) =>
        b.id === tuning.bikeId
          ? { ...b, currentMeter: Math.max(b.currentMeter, tuning.meterReading) }
          : b,
      ),
    )
  }, [])

  const deleteTuning = useCallback(async (id: string) => {
    await bikeRepo.deleteTuning(id)
    setTunings((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo<BikeState>(
    () => ({
      loading,
      error,
      bikes,
      tunings,
      addBike,
      updateBike,
      deleteBike,
      addTuning,
      deleteTuning,
      tuningIntervalKm,
      setTuningInterval,
    }),
    [
      loading,
      error,
      bikes,
      tunings,
      addBike,
      updateBike,
      deleteBike,
      addTuning,
      deleteTuning,
      tuningIntervalKm,
      setTuningInterval,
    ],
  )

  return <BikeContext.Provider value={value}>{children}</BikeContext.Provider>
}
