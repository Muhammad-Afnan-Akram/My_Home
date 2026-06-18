// Domain types for the Bike Tuning module.
// Framework-agnostic so the data layer can be swapped (localStorage, API…).

/**
 * Motorcycle brands sold in Pakistan and their common models. Used to drive
 * the company / model dropdowns when adding a bike. "Other" lets the user
 * type a brand or model that isn't listed.
 */
export const BIKE_BRANDS: { name: string; models: string[] }[] = [
  {
    name: 'Honda',
    models: [
      'CD 70',
      'CD 70 Dream',
      'Pridor',
      'CG 125',
      'CG 125 Self',
      'CG 125 Special Edition',
      'CB 125F',
      'CB 150F',
      'CB 250F',
      'CD 100',
    ],
  },
  {
    name: 'Yamaha',
    models: ['YBR 125', 'YBR 125G', 'YB 125Z', 'YB 125Z-DX', 'YBR 125Z'],
  },
  {
    name: 'Suzuki',
    models: ['GD 110S', 'GS 150', 'GS 150 SE', 'GR 150', 'GSX 125', 'Raider', 'Sprinter ECO'],
  },
  {
    name: 'United',
    models: ['US 70', 'US 100', 'US 125', 'US 150'],
  },
  {
    name: 'Road Prince',
    models: ['RP 70', 'Passion Plus 70', 'RX 95', 'Wego 150', 'RP 110', 'Jackpot', 'Robinson 150'],
  },
  {
    name: 'Unique',
    models: ['UD 70', 'UD 100', 'UD 125', 'Crystal'],
  },
  {
    name: 'Super Power',
    models: ['SP 70', 'SP 110', 'Leo 70', 'Archi 70', 'SP 125'],
  },
  {
    name: 'Crown',
    models: ['CRLF 70', 'Sabbat', 'CR 70', 'Pioneer 70'],
  },
  {
    name: 'Ravi',
    models: ['Piaggio Storm', 'Humraaz', 'Premium R1', 'Diamond'],
  },
  {
    name: 'Metro',
    models: ['MR 70', 'MR 110'],
  },
  {
    name: 'Hi Speed',
    models: ['SR 70', 'Infinity 70', 'Hawk 70'],
  },
  {
    name: 'Pak Hero',
    models: ['PH 70'],
  },
  {
    name: 'Super Star',
    models: ['SS 70', 'SS 110'],
  },
  {
    name: 'Eagle',
    models: ['Eagle 70'],
  },
  {
    name: 'Benelli',
    models: ['TNT 150', 'Leoncino 250', '302S'],
  },
]

/** Sentinel value used in the dropdowns for a free-text brand/model. */
export const OTHER = 'Other'

/** Models for a given brand name (empty if unknown / "Other"). */
export function modelsForBrand(brand: string): string[] {
  return BIKE_BRANDS.find((b) => b.name === brand)?.models ?? []
}

/** A motorcycle the user owns and wants to track tunings for. */
export interface Bike {
  id: string
  /** Brand, e.g. "Honda". */
  company: string
  /** Model, e.g. "CD 70". */
  model: string
  /** Number-plate / registration number. */
  registrationNumber: string
  /** Latest known odometer reading (km). */
  currentMeter: number
  createdAt: string
}

/** Per-user bike settings, persisted in the database. */
export interface BikeSettings {
  /**
   * Default distance (km) between tunings. Used to flag when a bike is due
   * for its next tuning. 0 means "don't track an interval".
   */
  tuningIntervalKm: number
}

/** A single tuning / service record for a bike. */
export interface Tuning {
  id: string
  bikeId: string
  /** ISO date (yyyy-mm-dd) the tuning was done. */
  date: string
  /** Odometer reading (km) at the time of tuning. */
  meterReading: number
  /** Cost of the tuning in Rs. */
  cost: number
  description?: string
  createdAt: string
}
