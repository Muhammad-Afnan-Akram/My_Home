import type { BillInfo, Meter, Reading } from '../types'

export type NewMeter = Omit<Meter, 'id' | 'createdAt'>
export type MeterPatch = Partial<Omit<Meter, 'id' | 'createdAt'>>
export type NewReading = Omit<Reading, 'id' | 'createdAt'>

/**
 * Storage contract for the Electricity module. The UI only ever talks to
 * this interface, so the localStorage implementation can be swapped for a
 * backend-backed one (Vultr API / Supabase) without touching the views.
 * Everything is async to match a future network layer.
 */
export interface ElectricityRepository {
  getMeters(): Promise<Meter[]>
  addMeter(input: NewMeter): Promise<Meter>
  updateMeter(id: string, patch: MeterPatch): Promise<Meter>
  deleteMeter(id: string): Promise<void>

  getReadings(meterId?: string): Promise<Reading[]>
  addReading(input: NewReading): Promise<Reading>
  deleteReading(id: string): Promise<void>

  getBill(meterId: string): Promise<BillInfo | null>
  saveBill(bill: BillInfo): Promise<BillInfo>
}
