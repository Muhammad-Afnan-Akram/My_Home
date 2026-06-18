// Small date helpers working with `yyyy-mm-dd` strings to keep the
// billing math free of timezone surprises.

/** Format a Date as a local `yyyy-mm-dd` string. */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse a `yyyy-mm-dd` string into a local Date at midnight. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Today's date as `yyyy-mm-dd`. */
export function todayISO(): string {
  return toISODate(new Date())
}

/** Whole days between two ISO dates (b - a). */
export function daysBetween(aIso: string, bIso: string): number {
  const ms = fromISODate(bIso).getTime() - fromISODate(aIso).getTime()
  return Math.round(ms / 86_400_000)
}

/**
 * Build a cycle-start ISO date for the month/year of `ref`, clamped to
 * the requested day-of-month (kept <= 28 to avoid short-month issues).
 */
export function cycleStartFor(year: number, monthIndex: number, day: number): string {
  const safeDay = Math.min(Math.max(day, 1), 28)
  return toISODate(new Date(year, monthIndex, safeDay))
}

/** Same day-of-month `months` later (or earlier, if negative), as an ISO date. */
export function addMonths(iso: string, months: number): string {
  const d = fromISODate(iso)
  return toISODate(new Date(d.getFullYear(), d.getMonth() + months, d.getDate()))
}

/** Human-friendly short date, e.g. "17 Jun". */
export function formatShort(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}

/** True if an ISO date (yyyy-mm-dd) falls in the same month as `ref` (now). */
export function isCurrentMonthISO(iso: string, ref: Date = new Date()): boolean {
  const d = fromISODate(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

/** Time-of-day from an ISO timestamp, e.g. "2:30 PM". Empty if unparseable. */
export function formatTime(isoTimestamp: string): string {
  const t = Date.parse(isoTimestamp)
  if (Number.isNaN(t)) return ''
  return new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** Relative time from an ISO timestamp, e.g. "3h ago". */
export function formatRelative(isoTimestamp: string): string {
  const diff = Date.now() - Date.parse(isoTimestamp)
  if (Number.isNaN(diff)) return ''
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
