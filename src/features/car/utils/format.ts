// Small formatting + date helpers for the Car module. Works with
// `yyyy-mm-dd` strings to avoid timezone surprises.
import type { CarService } from '../types'

/** Today's date as a local `yyyy-mm-dd` string. */
export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a `yyyy-mm-dd` string into a local Date at midnight. */
function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Full human-friendly date, e.g. "15 May 2026". Falls back to the raw string. */
export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = fromISODate(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Odometer reading with thousands separators + km, e.g. "12,500 km". */
export function formatKm(value: number): string {
  return `${Math.round(value).toLocaleString()} km`
}

/** Rupee amount, e.g. "Rs 1,200". */
export function formatRs(value: number): string {
  return `Rs ${Math.round(value).toLocaleString()}`
}

/** Severity of a car's progress towards its next oil change. */
export type ServiceLevel = 'safe' | 'warning' | 'over'

/** Where a car stands against its oil-change interval. */
export interface ServiceStatus {
  /** The configured interval this was measured against (km). */
  intervalKm: number
  /** Km driven since the last oil change. */
  sinceLast: number
  /** Km left before the next oil change (negative once overdue). */
  remaining: number
  /** Progress through the interval, clamped to 0–100. */
  pct: number
  /** 'over' once due, 'warning' in the final stretch, else 'safe'. */
  level: ServiceLevel
  /** True once `remaining` has reached or passed zero. */
  overdue: boolean
}

/**
 * Progress towards the next oil change, or null when it can't be derived — no
 * interval set (0), or no oil change logged yet to measure from.
 *
 * @param intervalKm        Default distance between oil changes (0 = not tracked).
 * @param currentMeter      The car's latest odometer reading.
 * @param lastOilReading    Odometer reading at the most recent oil change, if any.
 */
export function serviceStatus(
  intervalKm: number,
  currentMeter: number,
  lastOilReading: number | null,
): ServiceStatus | null {
  if (intervalKm <= 0 || lastOilReading == null) return null
  const sinceLast = Math.max(0, currentMeter - lastOilReading)
  const remaining = intervalKm - sinceLast
  const pct = Math.min(100, Math.max(0, Math.round((sinceLast / intervalKm) * 100)))
  // Flag the last 15% of the interval as a heads-up before it's actually due.
  const level: ServiceLevel = remaining <= 0 ? 'over' : pct >= 85 ? 'warning' : 'safe'
  return { intervalKm, sinceLast, remaining, pct, level, overdue: remaining <= 0 }
}

/** The most recent oil-change reading for a car's services, or null. */
export function lastOilChangeReading(services: CarService[]): number | null {
  // `services` are most-recent first; find the latest one that changed oil.
  const last = services.find((s) => s.oilChanged)
  return last ? last.meterReading : null
}

/**
 * Short, human-friendly summary of the parts replaced in a service, e.g.
 * "Oil (Shell Helix 5W-30, 3.5L) · Oil filter · Air filter". Empty string when
 * nothing was recorded.
 */
export function summarizeParts(s: CarService): string {
  const parts: string[] = []
  if (s.oilChanged) {
    const detail = [s.oilBrand, s.oilGrade, s.oilLiters ? `${s.oilLiters}L` : null]
      .filter(Boolean)
      .join(' ')
    parts.push(detail ? `Oil (${detail})` : 'Oil')
  }
  if (s.oilFilterChanged) parts.push('Oil filter')
  if (s.airFilterChanged) parts.push('Air filter')
  if (s.fuelFilterChanged) parts.push('Fuel filter')
  if (s.acFilterChanged) parts.push('AC filter')
  return parts.join(' · ')
}
