// Domain types for the Car module.
// Framework-agnostic so the data layer can be swapped (localStorage, API…).

/**
 * Cars sold / commonly driven in Pakistan, organised as make → model →
 * variants. Drives the cascading make / model / variant dropdowns when adding
 * a car. "Other" lets the user type something that isn't listed.
 *
 * Data reflects the Pakistani market (PakWheels): locally-assembled line-ups
 * plus the popular imported models. It doesn't need to be exhaustive — the
 * "Other…" option covers anything missing.
 */
export interface CarModel {
  name: string
  variants: string[]
}
export interface CarMake {
  name: string
  models: CarModel[]
}

export const CAR_MAKES: CarMake[] = [
  {
    name: 'Toyota',
    models: [
      {
        name: 'Corolla',
        variants: [
          'Altis Grande 1.8 CVT',
          'Altis 1.8 CVT',
          'Altis 1.6 X',
          'Altis 1.6 Crustonic',
          'Altis 1.6 MT',
          'GLi 1.3 VVTi MT',
          'GLi 1.3 Automatic',
          'XLi 1.3 VVTi',
        ],
      },
      {
        name: 'Yaris',
        variants: [
          'GLi 1.3 MT',
          'GLi 1.3 CVT',
          'ATIV 1.3 MT',
          'ATIV 1.3 CVT',
          'ATIV X 1.5 MT',
          'ATIV X 1.5 CVT',
        ],
      },
      {
        name: 'Fortuner',
        variants: ['2.7 VVTi', '2.8 Sigma 4', 'Legender', 'GR-S'],
      },
      {
        name: 'Hilux',
        variants: ['Revo G 2.8', 'Revo V 2.8', 'Revo GR-S', 'Rocco', '4x2 Single Cab'],
      },
      { name: 'Land Cruiser', variants: ['ZX', 'AX', 'VX', 'GR Sport'] },
      { name: 'Prado', variants: ['TX', 'TXL', 'VX', 'VX Limited'] },
      { name: 'Rush', variants: ['G', 'S'] },
      { name: 'Camry', variants: ['Up-Spec', 'Hybrid'] },
      { name: 'Hiace', variants: ['Standard', 'Grand Cabin', 'Deluxe'] },
      { name: 'Vitz', variants: ['1.0 F', '1.3 U', 'Jewela'] },
      { name: 'Aqua', variants: ['S', 'G', 'L'] },
      { name: 'Passo', variants: ['X', 'G', 'Moda'] },
      { name: 'Premio', variants: ['1.5 F', '1.8 X', '2.0 G'] },
      { name: 'Prius', variants: ['S', 'G', 'Alpha'] },
    ],
  },
  {
    name: 'Honda',
    models: [
      {
        name: 'City',
        variants: [
          '1.2L MT',
          '1.2L CVT',
          '1.5L CVT',
          'Aspire 1.3 i-VTEC',
          'Aspire 1.5 i-VTEC',
          'Aspire Prosmatec 1.5',
        ],
      },
      {
        name: 'Civic',
        variants: [
          'Oriel 1.8 i-VTEC',
          'VTi 1.8',
          'RS 1.5 Turbo',
          'Type R',
        ],
      },
      { name: 'BR-V', variants: ['i-VTEC S', 'i-VTEC', 'S'] },
      { name: 'HR-V', variants: ['VTi', 'VTi-S', 'RS'] },
      { name: 'Vezel', variants: ['X', 'Z', 'Hybrid Z', 'RS'] },
      { name: 'Accord', variants: ['1.5T', '2.0 Hybrid'] },
      { name: 'Fit', variants: ['1.3 F', '1.5 S', 'Hybrid'] },
    ],
  },
  {
    name: 'Suzuki',
    models: [
      { name: 'Alto', variants: ['VX', 'VXR', 'VXL AGS'] },
      { name: 'Cultus', variants: ['VXR', 'VXL', 'VXL AGS'] },
      { name: 'WagonR', variants: ['VXR', 'VXL', 'AGS'] },
      { name: 'Swift', variants: ['GL MT', 'GL CVT', 'GLX CVT'] },
      { name: 'Bolan', variants: ['VX', 'Cargo'] },
      { name: 'Ravi', variants: ['Standard'] },
      { name: 'Every', variants: ['PA', 'Join', 'Wagon'] },
      { name: 'Jimny', variants: ['JLDX', 'GLX'] },
      { name: 'Mehran', variants: ['VX', 'VXR'] },
      { name: 'Ciaz', variants: ['Manual', 'Automatic'] },
      { name: 'Baleno', variants: ['1.3'] },
      { name: 'Liana', variants: ['LXi', 'RXi'] },
      { name: 'Khyber', variants: ['Standard'] },
      { name: 'Margalla', variants: ['Standard'] },
    ],
  },
  {
    name: 'KIA',
    models: [
      { name: 'Sportage', variants: ['Alpha', 'FWD', 'AWD', 'L'] },
      { name: 'Picanto', variants: ['1.0 MT', '1.0 AT'] },
      { name: 'Sorento', variants: ['2.4 FWD', '3.5 AWD', '1.6 Hybrid'] },
      { name: 'Stonic', variants: ['EX', 'EX+'] },
      { name: 'Carnival', variants: ['8-Seater', '11-Seater'] },
      { name: 'Cerato', variants: ['1.6'] },
    ],
  },
  {
    name: 'Hyundai',
    models: [
      { name: 'Tucson', variants: ['GLS Sport', 'GLS', 'Ultimate', 'FWD', 'AWD'] },
      { name: 'Elantra', variants: ['GLS 1.6', 'GLS 2.0'] },
      { name: 'Sonata', variants: ['2.0', '2.5'] },
      { name: 'Santa Fe', variants: ['2.4', 'Diesel'] },
      { name: 'Porter', variants: ['H-100'] },
      { name: 'Ioniq 5', variants: ['Standard', 'Long Range'] },
    ],
  },
  {
    name: 'Changan',
    models: [
      { name: 'Alsvin', variants: ['1.3 DCT Comfort', '1.5 DCT Comfort', '1.5 DCT Lumiere'] },
      { name: 'Oshan X7', variants: ['Comfort', 'FutureSense'] },
      { name: 'Karvaan', variants: ['Standard', 'Plus'] },
      { name: 'M9', variants: ['Pickup'] },
    ],
  },
  {
    name: 'MG',
    models: [
      { name: 'HS', variants: ['1.5 Turbo', 'Essence', 'PHEV'] },
      { name: 'ZS', variants: ['1.5', 'EV'] },
      { name: 'MG3', variants: ['Standard'] },
      { name: 'MG5', variants: ['Standard'] },
      { name: 'MG4 EV', variants: ['Standard'] },
    ],
  },
  {
    name: 'Proton',
    models: [
      { name: 'Saga', variants: ['1.3 Standard MT', '1.3 Ace AT'] },
      { name: 'X70', variants: ['Standard', 'Premium FWD', 'Executive AWD'] },
      { name: 'X50', variants: ['Standard', 'Premium', 'Flagship'] },
    ],
  },
  {
    name: 'Haval',
    models: [
      { name: 'H6', variants: ['1.5T', '2.0T', 'HEV'] },
      { name: 'Jolion', variants: ['1.5T', 'HEV'] },
    ],
  },
  {
    name: 'Daihatsu',
    models: [
      { name: 'Mira', variants: ['L', 'X', 'G'] },
      { name: 'Move', variants: ['L', 'X', 'Custom'] },
      { name: 'Cuore', variants: ['CX', 'CL'] },
      { name: 'Hijet', variants: ['Cargo', 'Deck Van'] },
      { name: 'Terios', variants: ['X', 'Kid'] },
    ],
  },
  {
    name: 'FAW',
    models: [
      { name: 'V2', variants: ['1.3 VCT'] },
      { name: 'X-PV', variants: ['Standard', 'Dual AC'] },
      { name: 'Carrier', variants: ['Standard', 'Dual AC'] },
      { name: 'Sirius S80', variants: ['Standard'] },
    ],
  },
  {
    name: 'Nissan',
    models: [
      { name: 'Dayz', variants: ['S', 'X', 'Highway Star'] },
      { name: 'Sunny', variants: ['1.5'] },
      { name: 'Sakura', variants: ['EV'] },
    ],
  },
  {
    name: 'DFSK',
    models: [
      { name: 'Glory 580', variants: ['Standard', 'Pro'] },
      { name: 'Glory 500', variants: ['Standard'] },
    ],
  },
  {
    name: 'Prince',
    models: [
      { name: 'Pearl', variants: ['REII'] },
      { name: 'K07', variants: ['Standard'] },
    ],
  },
  {
    name: 'United',
    models: [
      { name: 'Bravo', variants: ['Standard'] },
      { name: 'Alpha', variants: ['Standard'] },
    ],
  },
]

/** Sentinel value used in the dropdowns for a free-text make/model/variant. */
export const OTHER = 'Other'

/** Models for a given make (empty if unknown / "Other"). */
export function modelsForMake(make: string): CarModel[] {
  return CAR_MAKES.find((m) => m.name === make)?.models ?? []
}

/** Variants for a given make + model (empty if unknown / "Other"). */
export function variantsFor(make: string, model: string): string[] {
  return modelsForMake(make).find((m) => m.name === model)?.variants ?? []
}

/** Common engine-oil brands in Pakistan — suggestions for the service form. */
export const OIL_BRANDS = [
  'Shell Helix',
  'Total Quartz',
  'ZIC',
  'Caltex Havoline',
  'Castrol',
  'PSO Carlube',
  'QALCO Q6',
  'Liqui Moly',
  'Mobil',
  'Wolf',
  'Kixx',
]

/** Common engine-oil grades (viscosity). */
export const OIL_GRADES = ['0W-20', '5W-30', '5W-40', '10W-30', '10W-40', '15W-40', '20W-50']

/** Common exterior colours — suggestions for the car form. */
export const CAR_COLORS = [
  'White',
  'Pearl White',
  'Silver',
  'Grey',
  'Black',
  'Super White',
  'Beige',
  'Gold',
  'Red',
  'Maroon',
  'Blue',
  'Navy Blue',
  'Green',
  'Bronze',
]

/** A car the user owns and wants to track services for. */
export interface Car {
  id: string
  /** Make / manufacturer, e.g. "Toyota". */
  make: string
  /** Model, e.g. "Corolla". */
  model: string
  /** Variant / trim, e.g. "Altis Grande 1.8 CVT". */
  variant: string
  /** Model / make year, e.g. 2019 (optional). */
  year?: number
  /**
   * Oil-change interval (km) for *this* car. Overrides the global default when
   * set (> 0); falls back to the global default when 0 / undefined.
   */
  serviceIntervalKm?: number
  /** Exterior colour (optional). */
  color?: string
  /** Photo of the car as a data URL (optional). */
  imageUrl?: string
  /** Number-plate / registration number. */
  registrationNumber: string
  /** Latest known odometer reading (km). */
  currentMeter: number
  createdAt: string
}

/** What kind of work a service record covers. */
export type ServiceType = 'routine' | 'service' | 'repair'

/** Human label + accent colour for each service type. */
export const SERVICE_TYPES: { value: ServiceType; label: string; color: string }[] = [
  { value: 'routine', label: 'Routine Tuning', color: '#3b82f6' },
  { value: 'service', label: 'Service', color: '#0ea5e9' },
  { value: 'repair', label: 'Repair', color: '#f59e0b' },
]

export function serviceTypeMeta(type: ServiceType) {
  return SERVICE_TYPES.find((t) => t.value === type) ?? SERVICE_TYPES[1]
}

/** Per-user car settings, persisted in the database. */
export interface CarSettings {
  /**
   * Default distance (km) between oil changes. Used to flag when a car is due
   * for its next oil change. 0 means "don't track an interval".
   */
  oilChangeIntervalKm: number
}

/** A single service / tuning / repair record for a car. */
export interface CarService {
  id: string
  carId: string
  /** ISO date (yyyy-mm-dd) the work was done. */
  date: string
  /** Odometer reading (km) at the time of the service. */
  meterReading: number
  /** Kind of work: routine tuning, general service, or a repair. */
  type: ServiceType
  /** Total cost in Rs. */
  cost: number
  /** Whether the engine oil was changed. */
  oilChanged: boolean
  /** Oil brand, e.g. "Shell Helix" (when oil changed). */
  oilBrand?: string
  /** Oil grade / viscosity, e.g. "5W-30" (when oil changed). */
  oilGrade?: string
  /** Litres of oil used (when oil changed). */
  oilLiters?: number
  /** Whether the oil filter was replaced. */
  oilFilterChanged: boolean
  /** Whether the air filter was replaced. */
  airFilterChanged: boolean
  /** Whether the fuel/petrol filter was replaced. */
  fuelFilterChanged: boolean
  /** Whether the AC / cabin filter was replaced. */
  acFilterChanged: boolean
  /** Whether the coolant / antifreeze was changed or topped up. */
  coolantChanged: boolean
  /** Free-text notes — work done, parts, observations. */
  description?: string
  createdAt: string
}
