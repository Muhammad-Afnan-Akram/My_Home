import type { CycleConsumption, DiscoCode, Meter, Reading } from '../types'
import { cycleStartFor, daysBetween, fromISODate, todayISO } from './date'

/** Build the PITC bill URL for a meter (used for the "open bill" link). */
export function billUrlFor(company: DiscoCode, referenceNumber: string): string {
  const ref = referenceNumber.replace(/\s+/g, '')
  return `https://bill.pitc.com.pk/${company}bill/general?refno=${ref}`
}

const MONTHS3 = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/** Parse a PITC bill-month token like "MAY 26" into { year, month }. */
export function parseBillMonth(billMonth?: string): { year: number; month: number } | null {
  const m = billMonth?.trim().toUpperCase().match(/^([A-Z]{3})\s+(\d{2})$/)
  if (!m) return null
  const idx = MONTHS3.indexOf(m[1])
  if (idx < 0) return null
  return { year: 2000 + Number(m[2]), month: idx + 1 }
}

/**
 * How many calendar months behind "now" the bill month is. DISCO bills are
 * issued with ~1 month lag, so 0–1 months behind is the latest available.
 * Returns null if the month can't be parsed.
 */
export function billMonthsBehind(billMonth: string | undefined, ref: Date = new Date()): number | null {
  const p = parseBillMonth(billMonth)
  if (!p) return null
  return ref.getFullYear() * 12 + (ref.getMonth() + 1) - (p.year * 12 + p.month)
}

/**
 * Determine the current billing-cycle window for a meter relative to
 * `ref` (defaults to today). Returns inclusive start + exclusive end.
 */
export function currentCycle(
  cycleStartDay: number,
  ref: string = todayISO(),
): { cycleStart: string; cycleEnd: string } {
  const refDate = fromISODate(ref)
  const year = refDate.getFullYear()
  const month = refDate.getMonth()

  let start = cycleStartFor(year, month, cycleStartDay)
  // If the cycle start for this month is in the future, step back a month.
  if (start > ref) {
    start = cycleStartFor(year, month - 1, cycleStartDay)
  }
  const startDate = fromISODate(start)
  const cycleEnd = cycleStartFor(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    cycleStartDay,
  )
  return { cycleStart: start, cycleEnd }
}

/**
 * Compute consumption for the current cycle from a meter's readings.
 *
 * Baseline = latest reading on/before the cycle start. If tracking only
 * began mid-cycle, the earliest reading inside the cycle is used instead
 * (so the figure is a lower bound until a full cycle of data exists).
 */
export function computeCycleConsumption(
  meter: Meter,
  readings: Reading[],
  ref: string = todayISO(),
): CycleConsumption {
  const { cycleStart, cycleEnd } = currentCycle(meter.cycleStartDay, ref)
  const daysInCycle = daysBetween(cycleStart, cycleEnd)
  const daysElapsed = Math.max(1, Math.min(daysInCycle, daysBetween(cycleStart, ref) + 1))

  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date))

  // Baseline: latest reading at or before the cycle start.
  const beforeOrAt = sorted.filter((r) => r.date <= cycleStart)
  let baseline = beforeOrAt.length ? beforeOrAt[beforeOrAt.length - 1] : null

  const inCycle = sorted.filter((r) => r.date >= cycleStart && r.date < cycleEnd)
  if (!baseline && inCycle.length) {
    // No pre-cycle reading — fall back to the earliest reading in-cycle.
    baseline = inCycle[0]
  }

  const latest = inCycle.length ? inCycle[inCycle.length - 1] : baseline

  const baselineValue = baseline ? baseline.value : null
  const latestValue = latest ? latest.value : null

  let unitsUsed: number | null = null
  if (baselineValue != null && latestValue != null) {
    unitsUsed = Math.max(0, latestValue - baselineValue)
  }

  const unitsRemaining = unitsUsed == null ? null : meter.unitLimit - unitsUsed

  const dailyAverage = unitsUsed == null ? null : unitsUsed / daysElapsed
  const projectedUnits = dailyAverage == null ? null : Math.round(dailyAverage * daysInCycle)
  const projectedToExceed = projectedUnits != null && projectedUnits > meter.unitLimit

  return {
    cycleStart,
    cycleEnd,
    baselineValue,
    latestValue,
    unitsUsed,
    unitsRemaining,
    daysElapsed,
    daysInCycle,
    dailyAverage,
    projectedUnits,
    projectedToExceed,
  }
}
