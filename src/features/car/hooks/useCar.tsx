import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Car, CarService } from '../types'
import { carRepo } from '../data'
import type { CarPatch, CarServicePatch, NewCar, NewCarService } from '../data'
import { CarContext, type CarState } from './carContext'

/** Default oil-change interval, applied to every car. Cached per-device. */
const OIL_INTERVAL_KEY = 'myhome.car.oilChangeIntervalKm'
const DEFAULT_OIL_INTERVAL_KM = 5000

// localStorage is only an instant cache; the database is the source of truth.
function readOilInterval(): number {
  try {
    const raw = localStorage.getItem(OIL_INTERVAL_KEY)
    if (raw == null) return DEFAULT_OIL_INTERVAL_KM
    const n = Number(raw)
    // 0 is a valid stored value meaning "don't track an interval".
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_OIL_INTERVAL_KM
  } catch {
    return DEFAULT_OIL_INTERVAL_KM
  }
}

function cacheOilInterval(km: number): void {
  try {
    localStorage.setItem(OIL_INTERVAL_KEY, String(km))
  } catch {
    /* non-fatal: keep the in-memory value */
  }
}

export function CarProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [services, setServices] = useState<CarService[]>([])
  const [oilChangeIntervalKm, setOilIntervalState] = useState<number>(readOilInterval)

  const setOilChangeInterval = useCallback((km: number) => {
    const rounded = Math.round(km)
    // 0 means "don't track"; anything invalid falls back to the default.
    const next = Number.isFinite(rounded) && rounded >= 0 ? rounded : DEFAULT_OIL_INTERVAL_KM
    setOilIntervalState(next)
    cacheOilInterval(next) // instant local cache so reloads don't flash the default
    // Persist to the database (source of truth across devices/sessions).
    void carRepo.saveSettings({ oilChangeIntervalKm: next }).catch(() => {
      /* keep the cached value; a later save or reload will reconcile */
    })
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [c, s, settings] = await Promise.all([
          carRepo.getCars(),
          carRepo.getServices(),
          carRepo.getSettings(),
        ])
        if (!active) return
        setCars(c)
        setServices(s)
        setOilIntervalState(settings.oilChangeIntervalKm)
        cacheOilInterval(settings.oilChangeIntervalKm)
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

  const addCar = useCallback(async (input: NewCar) => {
    const car = await carRepo.addCar(input)
    setCars((prev) => [...prev, car])
    return car
  }, [])

  const updateCar = useCallback(async (id: string, patch: CarPatch) => {
    const updated = await carRepo.updateCar(id, patch)
    setCars((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }, [])

  const deleteCar = useCallback(async (id: string) => {
    await carRepo.deleteCar(id)
    setCars((prev) => prev.filter((c) => c.id !== id))
    setServices((prev) => prev.filter((s) => s.carId !== id))
  }, [])

  const addService = useCallback(async (input: NewCarService) => {
    const service = await carRepo.addService(input)
    setServices((prev) => [service, ...prev])
    // The server keeps the car's odometer in sync with its latest service;
    // mirror that locally so the card/detail update without a reload.
    setCars((prev) =>
      prev.map((c) =>
        c.id === service.carId
          ? { ...c, currentMeter: Math.max(c.currentMeter, service.meterReading) }
          : c,
      ),
    )
  }, [])

  const updateService = useCallback(async (id: string, patch: CarServicePatch) => {
    const updated = await carRepo.updateService(id, patch)
    setServices((prev) => prev.map((s) => (s.id === id ? updated : s)))
    // Keep the car's odometer in sync if the corrected reading is higher.
    setCars((prev) =>
      prev.map((c) =>
        c.id === updated.carId
          ? { ...c, currentMeter: Math.max(c.currentMeter, updated.meterReading) }
          : c,
      ),
    )
  }, [])

  const deleteService = useCallback(async (id: string) => {
    await carRepo.deleteService(id)
    setServices((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const value = useMemo<CarState>(
    () => ({
      loading,
      error,
      cars,
      services,
      addCar,
      updateCar,
      deleteCar,
      addService,
      updateService,
      deleteService,
      oilChangeIntervalKm,
      setOilChangeInterval,
    }),
    [
      loading,
      error,
      cars,
      services,
      addCar,
      updateCar,
      deleteCar,
      addService,
      updateService,
      deleteService,
      oilChangeIntervalKm,
      setOilChangeInterval,
    ],
  )

  return <CarContext.Provider value={value}>{children}</CarContext.Provider>
}
