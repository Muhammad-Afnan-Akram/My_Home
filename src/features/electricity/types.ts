// Domain types for the Electricity module.
// Kept framework-agnostic so the data layer can be backed by
// localStorage now and a real backend (Vultr/Supabase) later.

/**
 * Pakistani distribution companies (DISCOs) whose bills are hosted on
 * the PITC portal at `bill.pitc.com.pk/{code}bill/general?refno=...`.
 */
export const DISCOS = [
  { code: 'mepco', label: 'MEPCO (Multan)' },
  { code: 'lesco', label: 'LESCO (Lahore)' },
  { code: 'iesco', label: 'IESCO (Islamabad)' },
  { code: 'gepco', label: 'GEPCO (Gujranwala)' },
  { code: 'fesco', label: 'FESCO (Faisalabad)' },
  { code: 'pesco', label: 'PESCO (Peshawar)' },
  { code: 'hesco', label: 'HESCO (Hyderabad)' },
  { code: 'sepco', label: 'SEPCO (Sukkur)' },
  { code: 'qesco', label: 'QESCO (Quetta)' },
  { code: 'tesco', label: 'TESCO (Tribal areas)' },
] as const

export type DiscoCode = (typeof DISCOS)[number]['code']

/** A physical electricity meter at home. */
export interface Meter {
  id: string
  /** Friendly name, e.g. "Main", "Annexe", "Shop". */
  name: string
  company: DiscoCode
  /** Reference / consumer number printed on the bill. */
  referenceNumber: string
  /**
   * Day of month (1-28) the billing cycle resets — taken from the
   * meter reading date on the official bill.
   */
  cycleStartDay: number
  /** Units that keep you in the cheap protected slab. Defaults to 200. */
  unitLimit: number
  /** Optional override; otherwise derived from company + referenceNumber. */
  billUrl?: string
  createdAt: string
}

/** Per-user app settings, persisted in the database. */
export interface Settings {
  /** Protected-slab unit limit applied to every meter (0 = no limit). */
  unitLimit: number
}

/** A single meter reading entered by the user. */
export interface Reading {
  id: string
  meterId: string
  /** ISO date (yyyy-mm-dd) the reading was taken. */
  date: string
  /** Absolute meter display value in units (kWh). */
  value: number
  note?: string
  createdAt: string
}

/** One month of historical consumption from the bill (e.g. "May25"). */
export interface MonthlyUnit {
  month: string
  units: number
}

/**
 * Latest official bill snapshot — entered manually, or scraped from the
 * PITC portal via /api/bill.
 */
export interface BillInfo {
  meterId: string
  units?: number
  /** Payable within the due date. */
  amountDue?: number
  /** Payable after the due date (late surcharge applied). */
  payableAfter?: number
  dueDate?: string
  /** Meter reading date printed on the bill. */
  readingDate?: string
  issueDate?: string
  billMonth?: string
  presentReading?: number
  previousReading?: number
  customerName?: string
  /** Trailing months of consumption, oldest first. */
  history?: MonthlyUnit[]
  /** "manual" when typed in; "scraped" when auto-fetched. */
  source: 'manual' | 'scraped'
  updatedAt: string
}

/** Shape returned by GET /api/bill (mirrors the server scraper output). */
export interface ScrapedBill {
  company: DiscoCode
  referenceNumber: string
  customerName?: string
  unitsConsumed?: number
  presentReading?: number
  previousReading?: number
  billMonth?: string
  readingDate?: string
  issueDate?: string
  dueDate?: string
  payableWithinDueDate?: number
  payableAfterDueDate?: number
  history: MonthlyUnit[]
  fetchedAt: string
}

/** Derived consumption summary for the current billing cycle. */
export interface CycleConsumption {
  /** Inclusive cycle start (ISO date). */
  cycleStart: string
  /** Exclusive cycle end (ISO date) — start of the next cycle. */
  cycleEnd: string
  /** Reading value at/just before cycle start (baseline). */
  baselineValue: number | null
  /** Most recent reading value in the cycle. */
  latestValue: number | null
  /** Units consumed so far this cycle. */
  unitsUsed: number | null
  /** unitLimit - unitsUsed (can go negative once exceeded). */
  unitsRemaining: number | null
  /** Whole days elapsed since cycle start (min 1). */
  daysElapsed: number
  /** Total days in the cycle. */
  daysInCycle: number
  /** Average units/day so far this cycle. */
  dailyAverage: number | null
  /** Projected total units by end of cycle at the current rate. */
  projectedUnits: number | null
  /** Will the projection cross the limit? */
  projectedToExceed: boolean
  /**
   * True when the cycle is anchored to the latest official bill (its reading
   * date + present reading). False means the calendar fallback was used
   * because no bill has been fetched yet.
   */
  anchoredToBill: boolean
}
