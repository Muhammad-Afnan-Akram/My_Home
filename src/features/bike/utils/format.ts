// Small formatting + date helpers for the Bike Tuning module. Works with
// `yyyy-mm-dd` strings to avoid timezone surprises.

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

/** Severity of a bike's progress towards its next tuning. */
export type TuningLevel = 'safe' | 'warning' | 'over'

/** Where a bike stands against its tuning interval. */
export interface TuningStatus {
  /** The configured interval this was measured against (km). */
  intervalKm: number
  /** Km ridden since the last tuning. */
  sinceLast: number
  /** Km left before the next tuning (negative once overdue). */
  remaining: number
  /** Progress through the interval, clamped to 0–100. */
  pct: number
  /** 'over' once due, 'warning' in the final stretch, else 'safe'. */
  level: TuningLevel
  /** True once `remaining` has reached or passed zero. */
  overdue: boolean
}

/**
 * Progress towards the next tuning, or null when it can't be derived — no
 * interval set (0), or no tuning logged yet to measure from.
 *
 * @param intervalKm    Default distance between tunings (0 = not tracked).
 * @param currentMeter  The bike's latest odometer reading.
 * @param lastReading   Odometer reading at the most recent tuning, if any.
 */
export function tuningStatus(
  intervalKm: number,
  currentMeter: number,
  lastReading: number | null,
): TuningStatus | null {
  if (intervalKm <= 0 || lastReading == null) return null
  const sinceLast = Math.max(0, currentMeter - lastReading)
  const remaining = intervalKm - sinceLast
  const pct = Math.min(100, Math.max(0, Math.round((sinceLast / intervalKm) * 100)))
  // Flag the last 15% of the interval as a heads-up before it's actually due.
  const level: TuningLevel = remaining <= 0 ? 'over' : pct >= 85 ? 'warning' : 'safe'
  return { intervalKm, sinceLast, remaining, pct, level, overdue: remaining <= 0 }
}
