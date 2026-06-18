import { createContext, useContext } from 'react'
import type { BillInfo, Meter, Reading, ScrapedBill } from '../types'
import type { MeterPatch, NewMeter, NewReading } from '../data'

export interface ElectricityState {
  loading: boolean
  error: string | null
  meters: Meter[]
  readings: Reading[]
  bills: Record<string, BillInfo>
  /** Meter ids whose bill is currently being fetched from the portal. */
  fetchingIds: ReadonlySet<string>
  /** Global protected-slab unit limit applied to every meter. */
  unitLimit: number
  setUnitLimit: (limit: number) => void
  addMeter: (input: NewMeter) => Promise<Meter>
  /** Create a meter and persist an already-fetched bill + its reading. */
  addMeterFromBill: (input: NewMeter, scraped: ScrapedBill) => Promise<Meter>
  updateMeter: (id: string, patch: MeterPatch) => Promise<void>
  deleteMeter: (id: string) => Promise<void>
  addReading: (input: NewReading) => Promise<void>
  deleteReading: (id: string) => Promise<void>
  saveBill: (bill: BillInfo) => Promise<void>
  /** Fetch + parse the official bill, save it, and record its reading. */
  fetchBill: (meter: Meter) => Promise<void>
}

export const ElectricityContext = createContext<ElectricityState | null>(null)

export function useElectricity(): ElectricityState {
  const ctx = useContext(ElectricityContext)
  if (!ctx) throw new Error('useElectricity must be used within an ElectricityProvider')
  return ctx
}
