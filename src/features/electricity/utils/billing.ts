import type { BillInfo, CycleConsumption, DiscoCode, Meter, Reading } from '../types'
import { addMonths, cycleStartFor, daysBetween, fromISODate, todayISO } from './date'

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
 * Compute consumption for the current (unbilled) cycle from a meter's readings.
 *
 * DISCO bills lag by ~1 month, so the consumption that matters is everything
 * since the *latest available bill* — its reading date is the cycle start and
 * its present reading is the baseline. We deliberately anchor to the bill
 * rather than to a recomputed calendar day: otherwise the window (e.g. "14 Jun
 * – 14 Jul") drifts away from the actual baseline reading date (e.g. 14 May),
 * inflating the daily average and triggering false over-limit warnings.
 *
 * When no bill has been fetched yet (manual-only meter), we fall back to the
 * calendar cycle derived from `cycleStartDay`, with the baseline being the
 * latest reading on/before the cycle start (or the earliest in-cycle reading).
 */
export function computeCycleConsumption(
  meter: Meter,
  readings: Reading[],
  ref: string = todayISO(),
  bill?: BillInfo | null,
  limit: number = meter.unitLimit,
): CycleConsumption {
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date))

  let cycleStart: string
  let cycleEnd: string
  let baselineValue: number | null

  const anchoredToBill = bill?.readingDate != null && bill.presentReading != null
  if (anchoredToBill) {
    // Bill-anchored: count units consumed since the last bill was generated.
    cycleStart = bill!.readingDate!
    cycleEnd = addMonths(cycleStart, 1)
    baselineValue = bill!.presentReading!
  } else {
    // Calendar fallback for meters with no fetched bill yet.
    const cycle = currentCycle(meter.cycleStartDay, ref)
    cycleStart = cycle.cycleStart
    cycleEnd = cycle.cycleEnd
    const beforeOrAt = sorted.filter((r) => r.date <= cycleStart)
    const inCycle = sorted.filter((r) => r.date >= cycleStart && r.date < cycleEnd)
    const baseline = beforeOrAt.length
      ? beforeOrAt[beforeOrAt.length - 1]
      : (inCycle[0] ?? null)
    baselineValue = baseline ? baseline.value : null
  }

  const daysInCycle = daysBetween(cycleStart, cycleEnd)
  // Honest elapsed days, NOT clamped to the cycle length: if the next bill is
  // overdue we keep counting so the daily average stays truthful.
  const daysElapsed = Math.max(1, daysBetween(cycleStart, ref) + 1)

  // Latest reading on/after the cycle start; if there's none yet, usage is
  // zero against the baseline (latest == baseline).
  const afterStart = sorted.filter((r) => r.date >= cycleStart)
  const latestValue = afterStart.length ? afterStart[afterStart.length - 1].value : baselineValue

  let unitsUsed: number | null = null
  if (baselineValue != null && latestValue != null) {
    unitsUsed = Math.max(0, latestValue - baselineValue)
  }

  // limit <= 0 means no protected-slab limit is set, so nothing to exceed.
  const hasLimit = limit > 0
  const unitsRemaining = unitsUsed == null || !hasLimit ? null : limit - unitsUsed

  const dailyAverage = unitsUsed == null ? null : unitsUsed / daysElapsed
  // Project over a full cycle; once we're past the expected next reading date
  // the projection is just the units already used (a full cycle of data).
  const projectedUnits =
    dailyAverage == null ? null : Math.round(dailyAverage * Math.max(daysInCycle, daysElapsed))
  const projectedToExceed = hasLimit && projectedUnits != null && projectedUnits > limit

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
    anchoredToBill,
  }
}
