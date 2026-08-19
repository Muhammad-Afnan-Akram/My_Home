// Small formatting + date helpers for the Car module. Works with
// `yyyy-mm-dd` strings to avoid timezone surprises.
import type { Car, CarService, MaintenanceItem, ServiceItem } from '../types'
import {
  ENGINE_OIL_KEY,
  MAINTENANCE_ITEMS,
  OIL_INTERVAL_KEYS,
  findItem,
  hasItem,
  maintenanceItem,
} from '../types'

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

/** A month count as "8 months" / "1 yr 3 mo". */
export function formatMonths(months: number): string {
  const m = Math.max(0, Math.round(months))
  if (m < 12) return `${m} month${m === 1 ? '' : 's'}`
  const years = Math.floor(m / 12)
  const rest = m % 12
  return rest === 0 ? `${years} yr` : `${years} yr ${rest} mo`
}

/** Whole months between a `yyyy-mm-dd` date and today (0 for future dates). */
export function monthsSince(iso: string): number {
  if (!iso) return 0
  const then = fromISODate(iso)
  if (Number.isNaN(then.getTime())) return 0
  const now = new Date()
  let months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth())
  // Don't count the current month until the day-of-month has come round.
  if (now.getDate() < then.getDate()) months -= 1
  return Math.max(0, months)
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

/** Progress through an interval → severity. The last 15% is a heads-up. */
function levelFor(pct: number, overdue: boolean): ServiceLevel {
  return overdue ? 'over' : pct >= 85 ? 'warning' : 'safe'
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
  const overdue = remaining <= 0
  return { intervalKm, sinceLast, remaining, pct, level: levelFor(pct, overdue), overdue }
}

/**
 * Services sorted most-recent first: by date (desc), then by when the record
 * was created (desc) to keep same-day entries stable. Returns a new array.
 */
export function sortServicesByDate(services: CarService[]): CarService[] {
  return [...services].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
  })
}

/**
 * The oil-change interval that applies to a car: its own `serviceIntervalKm`
 * when set (> 0), otherwise the global default.
 */
export function effectiveInterval(car: Car, globalKm: number): number {
  return car.serviceIntervalKm && car.serviceIntervalKm > 0 ? car.serviceIntervalKm : globalKm
}

/** The most recent service that covered a given maintenance item, or null. */
export function lastServiceWithItem(services: CarService[], key: string): CarService | null {
  // `services` are most-recent first; the first hit is the latest one.
  return services.find((s) => hasItem(s, key)) ?? null
}

/** The most recent oil-change reading for a car's services, or null. */
export function lastOilChangeReading(services: CarService[]): number | null {
  const last = lastServiceWithItem(services, ENGINE_OIL_KEY)
  return last ? last.meterReading : null
}

/** Details recorded against an item, e.g. "Shell Helix 5W-30 · 3.5 litres". */
export function itemDetail(recorded: ServiceItem): string {
  const item = maintenanceItem(recorded.key)
  const qty =
    recorded.qty != null && recorded.qty > 0
      ? `${recorded.qty} ${item?.qtyLabel ?? ''}`.trim()
      : null
  return [recorded.brand, recorded.spec, qty, recorded.note].filter(Boolean).join(' · ')
}

/** One item as a line of text, e.g. "Engine oil — Shell Helix 5W-30 · 3.5 litres". */
export function describeItem(recorded: ServiceItem): string {
  const label = maintenanceItem(recorded.key)?.label ?? recorded.key
  const detail = itemDetail(recorded)
  return detail ? `${label} — ${detail}` : label
}

/**
 * Short, human-friendly summary of the work done in a service, e.g.
 * "Engine oil (Shell Helix 5W-30) · Oil filter · Brake pads — front". Empty
 * string when nothing was recorded.
 */
export function summarizeParts(s: CarService): string {
  return s.items
    .map((i) => {
      const label = maintenanceItem(i.key)?.label ?? i.key
      const detail = itemDetail(i)
      return detail ? `${label} (${detail})` : label
    })
    .join(' · ')
}

/** Items sorted the way the catalog lists them, so summaries read consistently. */
export function sortItems(items: ServiceItem[]): ServiceItem[] {
  const order = new Map(MAINTENANCE_ITEMS.map((i, idx) => [i.key, idx]))
  return [...items].sort(
    (a, b) => (order.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.key) ?? Number.MAX_SAFE_INTEGER),
  )
}

/** Where a car stands on one maintenance item. */
export interface ItemStatus {
  item: MaintenanceItem
  /** Distance interval used (km); 0 when this item isn't distance-tracked. */
  intervalKm: number
  /** Time interval used (months); 0 when this item isn't time-tracked. */
  intervalMonths: number
  /** The service that last covered it, or null when never logged. */
  last: CarService | null
  /** What was recorded against it last time (brand, size…), if anything. */
  lastDetail: ServiceItem | null
  /** Km driven since it was last done (null when never logged). */
  kmSince: number | null
  /** Months elapsed since it was last done (null when never logged). */
  monthsElapsed: number | null
  /** Km left before it's due (negative once overdue); null when not tracked. */
  remainingKm: number | null
  /** Months left before it's due (negative once overdue); null when not tracked. */
  remainingMonths: number | null
  /** Progress towards due, 0–100, taking the more urgent of km / months. */
  pct: number
  level: ServiceLevel
  overdue: boolean
  /** True when the item has never been logged, so nothing can be measured. */
  never: boolean
}

/**
 * Where a car stands on one catalog item. Engine oil and its filter are
 * measured against this car's own interval — `car.serviceIntervalKm` when set,
 * otherwise the global default — so the item list agrees with the gauge on the
 * car header. Everything else uses the catalog's recommended interval.
 *
 * @param globalOilIntervalKm The default oil interval (0 = oil not tracked).
 */
export function itemStatus(
  item: MaintenanceItem,
  car: Car,
  services: CarService[],
  globalOilIntervalKm: number,
): ItemStatus {
  const followsOil = OIL_INTERVAL_KEYS.includes(item.key)
  // Oil tracking switched off (0 km) disables the time interval too.
  const intervalKm = followsOil
    ? Math.max(0, effectiveInterval(car, globalOilIntervalKm))
    : item.intervalKm
  const intervalMonths = followsOil && intervalKm === 0 ? 0 : item.intervalMonths

  const last = lastServiceWithItem(services, item.key)
  const base: ItemStatus = {
    item,
    intervalKm,
    intervalMonths,
    last,
    lastDetail: last ? findItem(last, item.key) ?? null : null,
    kmSince: null,
    monthsElapsed: null,
    remainingKm: null,
    remainingMonths: null,
    pct: 0,
    level: 'safe',
    overdue: false,
    never: last == null,
  }
  if (!last) return base

  const kmSince = Math.max(0, car.currentMeter - last.meterReading)
  const monthsElapsed = monthsSince(last.date)
  const remainingKm = intervalKm > 0 ? intervalKm - kmSince : null
  const remainingMonths = intervalMonths > 0 ? intervalMonths - monthsElapsed : null
  // Whichever measure is further along decides how urgent the item is.
  const kmPct = intervalKm > 0 ? (kmSince / intervalKm) * 100 : 0
  const monthPct = intervalMonths > 0 ? (monthsElapsed / intervalMonths) * 100 : 0
  const pct = Math.min(100, Math.max(0, Math.round(Math.max(kmPct, monthPct))))
  const overdue = (remainingKm != null && remainingKm <= 0) || (remainingMonths != null && remainingMonths <= 0)

  return {
    ...base,
    kmSince,
    monthsElapsed,
    remainingKm,
    remainingMonths,
    pct,
    level: levelFor(pct, overdue),
    overdue,
  }
}

/** True when an item has any interval to measure against. */
export function isTracked(status: ItemStatus): boolean {
  return status.intervalKm > 0 || status.intervalMonths > 0
}

/**
 * Every catalog item's status for a car, most urgent first. Items that have
 * never been logged sort last — there's nothing to measure them against yet.
 */
export function maintenanceStatuses(
  car: Car,
  services: CarService[],
  globalOilIntervalKm: number,
): ItemStatus[] {
  return MAINTENANCE_ITEMS.map((item) => itemStatus(item, car, services, globalOilIntervalKm)).sort(
    (a, b) => {
      if (a.never !== b.never) return a.never ? 1 : -1
      return b.pct - a.pct
    },
  )
}

/** Statuses that need attention now — overdue or in the final stretch. */
export function dueStatuses(statuses: ItemStatus[]): ItemStatus[] {
  return statuses.filter((s) => !s.never && isTracked(s) && s.level !== 'safe')
}

/** Catalog keys currently due, so the service form can pre-flag them. */
export function dueKeys(car: Car, services: CarService[], globalOilIntervalKm: number): string[] {
  return dueStatuses(maintenanceStatuses(car, services, globalOilIntervalKm)).map((s) => s.item.key)
}

/** "2,400 km left" / "Due now" / "Due in 3 months" — the headline for a status. */
export function statusSummary(s: ItemStatus): string {
  if (s.never) return 'Not logged yet'
  if (!isTracked(s)) return s.kmSince != null ? `${formatKm(s.kmSince)} ago` : 'Logged'
  if (s.overdue) {
    const byKm = s.remainingKm != null && s.remainingKm <= 0 ? formatKm(-s.remainingKm) : null
    const byTime =
      s.remainingMonths != null && s.remainingMonths <= 0 ? formatMonths(-s.remainingMonths) : null
    const over = [byKm, byTime].filter(Boolean).join(' / ')
    return over ? `Overdue by ${over}` : 'Due now'
  }
  const parts: string[] = []
  if (s.remainingKm != null) parts.push(`${formatKm(s.remainingKm)} left`)
  if (s.remainingMonths != null) parts.push(`${formatMonths(s.remainingMonths)} left`)
  return parts.join(' · ')
}

/** "12,400 km on the current set, fitted 15 May 2026" — the sub-line for a status. */
export function statusHistory(s: ItemStatus): string {
  if (!s.last) return 'No record yet — log it in a service to start tracking'
  const parts: string[] = []
  if (s.kmSince != null) parts.push(`${formatKm(s.kmSince)} since last`)
  parts.push(formatDate(s.last.date))
  const detail = s.lastDetail ? itemDetail(s.lastDetail) : ''
  if (detail) parts.push(detail)
  return parts.join(' · ')
}
