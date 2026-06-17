import type { BillInfo, Meter, Reading } from '../types'
import type {
  ElectricityRepository,
  MeterPatch,
  NewMeter,
  NewReading,
} from './repository'

const KEYS = {
  meters: 'myhome.electricity.meters',
  readings: 'myhome.electricity.readings',
  bills: 'myhome.electricity.bills',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

function newId(): string {
  return crypto.randomUUID()
}

/**
 * localStorage-backed repository. Good enough for a single-device,
 * offline-first build; replaced by an API client in the backend phase.
 */
export class LocalElectricityRepository implements ElectricityRepository {
  async getMeters(): Promise<Meter[]> {
    return read<Meter[]>(KEYS.meters, [])
  }

  async addMeter(input: NewMeter): Promise<Meter> {
    const meters = await this.getMeters()
    const meter: Meter = { ...input, id: newId(), createdAt: new Date().toISOString() }
    write(KEYS.meters, [...meters, meter])
    return meter
  }

  async updateMeter(id: string, patch: MeterPatch): Promise<Meter> {
    const meters = await this.getMeters()
    const idx = meters.findIndex((m) => m.id === id)
    if (idx === -1) throw new Error(`Meter ${id} not found`)
    const updated: Meter = { ...meters[idx], ...patch }
    meters[idx] = updated
    write(KEYS.meters, meters)
    return updated
  }

  async deleteMeter(id: string): Promise<void> {
    const meters = await this.getMeters()
    write(
      KEYS.meters,
      meters.filter((m) => m.id !== id),
    )
    const readings = await this.getReadings()
    write(
      KEYS.readings,
      readings.filter((r) => r.meterId !== id),
    )
    const bills = read<BillInfo[]>(KEYS.bills, [])
    write(
      KEYS.bills,
      bills.filter((b) => b.meterId !== id),
    )
  }

  async getReadings(meterId?: string): Promise<Reading[]> {
    const all = read<Reading[]>(KEYS.readings, [])
    return meterId ? all.filter((r) => r.meterId === meterId) : all
  }

  async addReading(input: NewReading): Promise<Reading> {
    const all = await this.getReadings()
    const reading: Reading = { ...input, id: newId(), createdAt: new Date().toISOString() }
    write(KEYS.readings, [...all, reading])
    return reading
  }

  async deleteReading(id: string): Promise<void> {
    const all = await this.getReadings()
    write(
      KEYS.readings,
      all.filter((r) => r.id !== id),
    )
  }

  async getBill(meterId: string): Promise<BillInfo | null> {
    const bills = read<BillInfo[]>(KEYS.bills, [])
    return bills.find((b) => b.meterId === meterId) ?? null
  }

  async saveBill(bill: BillInfo): Promise<BillInfo> {
    const bills = read<BillInfo[]>(KEYS.bills, [])
    const idx = bills.findIndex((b) => b.meterId === bill.meterId)
    if (idx === -1) bills.push(bill)
    else bills[idx] = bill
    write(KEYS.bills, bills)
    return bill
  }
}
