import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { BillInfo, Meter, Reading, ScrapedBill } from '../types'
import { electricityRepo, fetchScrapedBill } from '../data'
import type { MeterPatch, NewMeter, NewReading } from '../data'
import { ElectricityContext, type ElectricityState } from './electricityContext'

/** Auto-refresh a meter's bill if its data is older than this (~2x/24h). */
const REFRESH_MS = 12 * 60 * 60 * 1000

/** Global protected-slab limit, applied to every meter. Stored per-device. */
const UNIT_LIMIT_KEY = 'myhome.electricity.unitLimit'
const DEFAULT_UNIT_LIMIT = 200

function readUnitLimit(): number {
  try {
    const raw = localStorage.getItem(UNIT_LIMIT_KEY)
    if (raw == null) return DEFAULT_UNIT_LIMIT
    const n = Number(raw)
    // 0 is a valid stored value meaning "no slab limit".
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_UNIT_LIMIT
  } catch {
    return DEFAULT_UNIT_LIMIT
  }
}

export function ElectricityProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meters, setMeters] = useState<Meter[]>([])
  const [readings, setReadings] = useState<Reading[]>([])
  const [bills, setBills] = useState<Record<string, BillInfo>>({})
  const [fetchingIds, setFetchingIds] = useState<ReadonlySet<string>>(new Set())
  const [unitLimit, setUnitLimitState] = useState<number>(readUnitLimit)

  const setUnitLimit = useCallback((limit: number) => {
    const rounded = Math.round(limit)
    // 0 means "no slab limit"; anything invalid falls back to the default.
    const next = Number.isFinite(rounded) && rounded >= 0 ? rounded : DEFAULT_UNIT_LIMIT
    setUnitLimitState(next)
    try {
      localStorage.setItem(UNIT_LIMIT_KEY, String(next))
    } catch {
      /* non-fatal: keep the in-memory value */
    }
  }, [])

  // Refs so the background refresh pass and the concurrency guard can read
  // current values without re-creating callbacks. Synced in an effect rather
  // than during render (refs must not be mutated while rendering).
  const fetchingRef = useRef<Set<string>>(new Set())
  const metersRef = useRef<Meter[]>(meters)
  const billsRef = useRef<Record<string, BillInfo>>(bills)

  useEffect(() => {
    metersRef.current = meters
    billsRef.current = bills
  }, [meters, bills])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [m, r] = await Promise.all([
          electricityRepo.getMeters(),
          electricityRepo.getReadings(),
        ])
        const billEntries = await Promise.all(
          m.map(async (meter) => [meter.id, await electricityRepo.getBill(meter.id)] as const),
        )
        if (!active) return
        setMeters(m)
        setReadings(r)
        setBills(
          Object.fromEntries(billEntries.filter(([, b]) => b != null)) as Record<string, BillInfo>,
        )
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

  const addMeter = useCallback(async (input: NewMeter) => {
    const meter = await electricityRepo.addMeter(input)
    setMeters((prev) => [...prev, meter])
    return meter
  }, [])

  const updateMeter = useCallback(async (id: string, patch: MeterPatch) => {
    const updated = await electricityRepo.updateMeter(id, patch)
    setMeters((prev) => prev.map((m) => (m.id === id ? updated : m)))
  }, [])

  const deleteMeter = useCallback(async (id: string) => {
    await electricityRepo.deleteMeter(id)
    setMeters((prev) => prev.filter((m) => m.id !== id))
    setReadings((prev) => prev.filter((r) => r.meterId !== id))
    setBills((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const addReading = useCallback(async (input: NewReading) => {
    const reading = await electricityRepo.addReading(input)
    setReadings((prev) => [...prev, reading])
  }, [])

  const deleteReading = useCallback(async (id: string) => {
    await electricityRepo.deleteReading(id)
    setReadings((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const saveBill = useCallback(async (bill: BillInfo) => {
    const saved = await electricityRepo.saveBill(bill)
    setBills((prev) => ({ ...prev, [saved.meterId]: saved }))
  }, [])

  // Save an already-fetched bill and record its meter reading.
  const persistScraped = useCallback(async (meterId: string, scraped: ScrapedBill) => {
    const bill: BillInfo = {
      meterId,
      units: scraped.unitsConsumed,
      amountDue: scraped.payableWithinDueDate,
      payableAfter: scraped.payableAfterDueDate,
      dueDate: scraped.dueDate,
      readingDate: scraped.readingDate,
      issueDate: scraped.issueDate,
      billMonth: scraped.billMonth,
      presentReading: scraped.presentReading,
      previousReading: scraped.previousReading,
      customerName: scraped.customerName,
      history: scraped.history,
      source: 'scraped',
      updatedAt: new Date().toISOString(),
    }
    await electricityRepo.saveBill(bill)
    setBills((prev) => ({ ...prev, [meterId]: bill }))

    if (scraped.presentReading != null && scraped.readingDate) {
      const existing = await electricityRepo.getReadings(meterId)
      if (!existing.some((r) => r.date === scraped.readingDate)) {
        const reading = await electricityRepo.addReading({
          meterId,
          date: scraped.readingDate,
          value: scraped.presentReading,
          note: 'From bill',
        })
        setReadings((prev) => [...prev, reading])
      }
    }
  }, [])

  const addMeterFromBill = useCallback(
    async (input: NewMeter, scraped: ScrapedBill) => {
      const meter = await electricityRepo.addMeter(input)
      setMeters((prev) => [...prev, meter])
      await persistScraped(meter.id, scraped)
      return meter
    },
    [persistScraped],
  )

  const fetchBill = useCallback(
    async (meter: Meter) => {
      // Guard against concurrent fetches for the same meter (avoids duplicate
      // readings when the auto-refresh and a manual refresh overlap).
      if (fetchingRef.current.has(meter.id)) return
      fetchingRef.current.add(meter.id)
      setFetchingIds(new Set(fetchingRef.current))
      try {
        const scraped = await fetchScrapedBill(meter.referenceNumber, meter.company)
        await persistScraped(meter.id, scraped)
      } finally {
        fetchingRef.current.delete(meter.id)
        setFetchingIds(new Set(fetchingRef.current))
      }
    },
    [persistScraped],
  )

  // Periodically refresh stale meters from the portal. On any error the
  // existing database data is kept (fetchBill throws, we swallow it).
  const refreshStaleMeters = useCallback(() => {
    const now = Date.now()
    for (const meter of metersRef.current) {
      const bill = billsRef.current[meter.id]
      const ts = bill ? Date.parse(bill.updatedAt) : NaN
      const stale = Number.isNaN(ts) || now - ts >= REFRESH_MS
      if (stale) {
        void fetchBill(meter).catch(() => {
          /* keep DB data on failure */
        })
      }
    }
  }, [fetchBill])

  useEffect(() => {
    if (loading) return
    refreshStaleMeters()
    const id = setInterval(refreshStaleMeters, REFRESH_MS)
    return () => clearInterval(id)
  }, [loading, refreshStaleMeters])

  const value = useMemo<ElectricityState>(
    () => ({
      loading,
      error,
      meters,
      readings,
      bills,
      fetchingIds,
      unitLimit,
      setUnitLimit,
      addMeter,
      addMeterFromBill,
      updateMeter,
      deleteMeter,
      addReading,
      deleteReading,
      saveBill,
      fetchBill,
    }),
    [
      loading,
      error,
      meters,
      readings,
      bills,
      fetchingIds,
      unitLimit,
      setUnitLimit,
      addMeter,
      addMeterFromBill,
      updateMeter,
      deleteMeter,
      addReading,
      deleteReading,
      saveBill,
      fetchBill,
    ],
  )

  return <ElectricityContext.Provider value={value}>{children}</ElectricityContext.Provider>
}
