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

/** Common tyre brands sold in Pakistan — suggestions for the service form. */
export const TYRE_BRANDS = [
  'General',
  'Giti',
  'Service (Euro)',
  'Panther',
  'Diamond',
  'Yokohama',
  'Dunlop',
  'Bridgestone',
  'Maxxis',
  'Michelin',
  'Hankook',
  'Kumho',
  'GT Radial',
  'Chaoyang',
  'Sailun',
]

/** Common tyre sizes on Pakistani-market cars. */
export const TYRE_SIZES = [
  '145/70R12',
  '155/65R13',
  '165/65R14',
  '175/65R14',
  '185/65R15',
  '195/65R15',
  '205/55R16',
  '215/60R17',
  '225/65R17',
  '265/65R17',
]

/** Common battery brands in Pakistan. */
export const BATTERY_BRANDS = [
  'Exide',
  'Osaka',
  'AGS',
  'Volta',
  'Phoenix',
  'Daewoo',
  'Bridgepower',
  'Millat',
]

/** Common brake / mechanical part brands. */
export const PART_BRANDS = [
  'Genuine (OEM)',
  'Aisin',
  'Bosch',
  'Denso',
  'NGK',
  'TRW',
  'Nibco',
  'Local',
]

/** Common fluid brands (coolant, brake fluid, ATF…). */
export const FLUID_BRANDS = [
  'Genuine (OEM)',
  'Shell',
  'Total',
  'Castrol',
  'ZIC',
  'Bosch',
  'Prestone',
]

/** Where a maintenance item sits in the service form and status list. */
export type ItemGroup =
  | 'engine'
  | 'filters'
  | 'fluids'
  | 'brakes'
  | 'tyres'
  | 'electrical'
  | 'driveline'

/** Group headings, in the order they're shown. */
export const ITEM_GROUPS: { value: ItemGroup; label: string }[] = [
  { value: 'engine', label: 'Engine' },
  { value: 'filters', label: 'Filters' },
  { value: 'fluids', label: 'Fluids' },
  { value: 'brakes', label: 'Brakes' },
  { value: 'tyres', label: 'Tyres & wheels' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'driveline', label: 'Suspension & driveline' },
]

/**
 * One trackable maintenance job — what it is, how often it falls due, and which
 * extra details are worth recording for it.
 *
 * Intervals are typical manufacturer / workshop recommendations for
 * Pakistani-market cars: dusty roads and stop-go city traffic pull the air
 * filter, brake and coolant intervals to the shorter end of the range.
 * `intervalKm: 0` means the job is purely time-based, `intervalMonths: 0` means
 * purely distance-based; when both are set, whichever comes first wins.
 */
export interface MaintenanceItem {
  /** Stable key stored on the service record. Never rename these. */
  key: string
  label: string
  group: ItemGroup
  /** Recommended distance between replacements (km); 0 = time-based only. */
  intervalKm: number
  /** Recommended time between replacements (months); 0 = distance-based only. */
  intervalMonths: number
  /** Brand suggestions, when a brand is worth recording. */
  brands?: string[]
  /** Label for the spec field (oil grade, tyre size, battery rating…). */
  specLabel?: string
  /** Suggestions for the spec field. */
  specOptions?: string[]
  /** Label for the quantity field (litres, tyres, plugs…). */
  qtyLabel?: string
  /** One-line best-practice note shown in the form and status list. */
  hint?: string
}

/**
 * The maintenance catalog. Drives the "work done" picker in the service form
 * and the per-item due tracking on the car screens.
 */
export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  // Engine
  {
    key: 'engine-oil',
    label: 'Engine oil',
    group: 'engine',
    intervalKm: 5000,
    intervalMonths: 6,
    brands: OIL_BRANDS,
    specLabel: 'Grade',
    specOptions: OIL_GRADES,
    qtyLabel: 'litres',
    hint: 'Mineral ~3,000 km · semi-synthetic ~5,000 km · full synthetic 7,500–10,000 km',
  },
  {
    key: 'engine-tuneup',
    label: 'Engine tune-up',
    group: 'engine',
    intervalKm: 10000,
    intervalMonths: 12,
    hint: 'Idle, timing and emissions check — usually done with an oil change',
  },
  {
    key: 'spark-plugs',
    label: 'Spark plugs',
    group: 'engine',
    intervalKm: 20000,
    intervalMonths: 0,
    brands: ['NGK', 'Denso', 'Bosch', 'Genuine (OEM)'],
    specLabel: 'Type',
    specOptions: ['Copper', 'Platinum', 'Double platinum', 'Iridium'],
    qtyLabel: 'plugs',
    hint: 'Copper ~20,000 km · platinum ~60,000 km · iridium up to 100,000 km',
  },
  {
    key: 'throttle-body-clean',
    label: 'Throttle body cleaning',
    group: 'engine',
    intervalKm: 20000,
    intervalMonths: 0,
    hint: 'Clears rough idle and hesitation on EFI engines',
  },
  {
    key: 'injector-clean',
    label: 'Injector cleaning',
    group: 'engine',
    intervalKm: 30000,
    intervalMonths: 0,
    hint: 'Worth doing sooner on poor-quality fuel',
  },
  {
    key: 'timing-belt',
    label: 'Timing belt',
    group: 'engine',
    intervalKm: 100000,
    intervalMonths: 84,
    brands: PART_BRANDS,
    hint: 'Belt-driven engines only — a snapped belt wrecks the engine. Chains are lifetime.',
  },
  {
    key: 'drive-belt',
    label: 'Drive / AC belt',
    group: 'engine',
    intervalKm: 60000,
    intervalMonths: 48,
    brands: PART_BRANDS,
    hint: 'Replace at the first sign of cracks or squealing',
  },
  {
    key: 'radiator-flush',
    label: 'Radiator flush',
    group: 'engine',
    intervalKm: 40000,
    intervalMonths: 24,
    hint: 'Do it alongside the coolant change to clear scale',
  },

  // Filters
  {
    key: 'oil-filter',
    label: 'Oil filter',
    group: 'filters',
    intervalKm: 5000,
    intervalMonths: 6,
    brands: PART_BRANDS,
    hint: 'Change with every oil change',
  },
  {
    key: 'air-filter',
    label: 'Air filter',
    group: 'filters',
    intervalKm: 10000,
    intervalMonths: 12,
    brands: PART_BRANDS,
    hint: 'Dusty routes: blow it out every 5,000 km, replace by 10,000 km',
  },
  {
    key: 'ac-filter',
    label: 'AC / cabin filter',
    group: 'filters',
    intervalKm: 15000,
    intervalMonths: 12,
    brands: PART_BRANDS,
    hint: 'Weak AC airflow usually means a clogged cabin filter',
  },
  {
    key: 'fuel-filter',
    label: 'Fuel filter',
    group: 'filters',
    intervalKm: 30000,
    intervalMonths: 0,
    brands: PART_BRANDS,
    hint: 'EFI petrol ~30,000 km · sooner if fuel quality is doubtful',
  },

  // Fluids
  {
    key: 'coolant',
    label: 'Coolant / antifreeze',
    group: 'fluids',
    intervalKm: 40000,
    intervalMonths: 24,
    brands: FLUID_BRANDS,
    qtyLabel: 'litres',
    hint: 'Topping up with plain water long-term scales the radiator',
  },
  {
    key: 'brake-fluid',
    label: 'Brake fluid',
    group: 'fluids',
    intervalKm: 40000,
    intervalMonths: 24,
    brands: FLUID_BRANDS,
    specLabel: 'Grade',
    specOptions: ['DOT 3', 'DOT 4', 'DOT 5.1'],
    hint: 'Absorbs moisture with age — a spongy pedal means it is overdue',
  },
  {
    key: 'transmission-fluid',
    label: 'Transmission fluid (ATF / CVT)',
    group: 'fluids',
    intervalKm: 40000,
    intervalMonths: 0,
    brands: FLUID_BRANDS,
    qtyLabel: 'litres',
    hint: 'CVT ~40,000 km · conventional automatic ~60,000 km. Use the exact specified fluid.',
  },
  {
    key: 'gear-oil',
    label: 'Manual gear oil',
    group: 'fluids',
    intervalKm: 60000,
    intervalMonths: 0,
    brands: FLUID_BRANDS,
    qtyLabel: 'litres',
  },
  {
    key: 'differential-oil',
    label: 'Differential oil',
    group: 'fluids',
    intervalKm: 40000,
    intervalMonths: 0,
    qtyLabel: 'litres',
    hint: '4x4 and rear-wheel-drive vehicles only',
  },
  {
    key: 'power-steering-fluid',
    label: 'Power steering fluid',
    group: 'fluids',
    intervalKm: 40000,
    intervalMonths: 24,
    brands: FLUID_BRANDS,
    hint: 'Hydraulic racks only — electric power steering has no fluid',
  },
  {
    key: 'ac-gas',
    label: 'AC gas recharge',
    group: 'fluids',
    intervalKm: 0,
    intervalMonths: 24,
    hint: 'Needing gas every season means a leak, not a top-up',
  },

  // Brakes
  {
    key: 'brake-pads-front',
    label: 'Brake pads — front',
    group: 'brakes',
    intervalKm: 40000,
    intervalMonths: 0,
    brands: PART_BRANDS,
    hint: 'Inspect every 10,000 km — city stop-go traffic can halve their life',
  },
  {
    key: 'brake-pads-rear',
    label: 'Brake pads / shoes — rear',
    group: 'brakes',
    intervalKm: 60000,
    intervalMonths: 0,
    brands: PART_BRANDS,
    hint: 'Rear pads normally outlast the front set by about half again',
  },
  {
    key: 'brake-discs',
    label: 'Brake discs / drums',
    group: 'brakes',
    intervalKm: 80000,
    intervalMonths: 0,
    brands: PART_BRANDS,
    hint: 'Skim or replace once below the minimum thickness stamped on the disc',
  },

  // Tyres & wheels
  {
    key: 'tyres',
    label: 'Tyres (new set)',
    group: 'tyres',
    intervalKm: 40000,
    intervalMonths: 60,
    brands: TYRE_BRANDS,
    specLabel: 'Size',
    specOptions: TYRE_SIZES,
    qtyLabel: 'tyres',
    hint: 'Replace by ~40,000 km or 5 years, whichever comes first — rubber hardens with age',
  },
  {
    key: 'tyre-rotation',
    label: 'Tyre rotation',
    group: 'tyres',
    intervalKm: 10000,
    intervalMonths: 0,
    hint: 'A front-to-back swap every 10,000 km evens out the wear',
  },
  {
    key: 'wheel-alignment',
    label: 'Alignment & balancing',
    group: 'tyres',
    intervalKm: 10000,
    intervalMonths: 12,
    hint: 'Also after fitting new tyres, or any hard pothole hit',
  },

  // Electrical
  {
    key: 'battery',
    label: 'Battery',
    group: 'electrical',
    intervalKm: 40000,
    intervalMonths: 30,
    brands: BATTERY_BRANDS,
    specLabel: 'Rating',
    specOptions: ['9 plate', '11 plate', '13 plate', '15 plate', '45 Ah', '55 Ah', '70 Ah'],
    hint: 'Most batteries here last 2–3 years — slow cranking is the first warning',
  },
  {
    key: 'wiper-blades',
    label: 'Wiper blades',
    group: 'electrical',
    intervalKm: 0,
    intervalMonths: 12,
    hint: 'Replace before the monsoon, not during it',
  },

  // Suspension & driveline
  {
    key: 'shock-absorbers',
    label: 'Shock absorbers / struts',
    group: 'driveline',
    intervalKm: 80000,
    intervalMonths: 0,
    brands: PART_BRANDS,
    hint: 'A bouncy ride or cupped tyre wear means they are done',
  },
  {
    key: 'suspension-bushes',
    label: 'Suspension bushes / links',
    group: 'driveline',
    intervalKm: 60000,
    intervalMonths: 0,
    brands: PART_BRANDS,
    hint: 'Knocking over speed breakers is the usual giveaway',
  },
  {
    key: 'clutch-plate',
    label: 'Clutch plate',
    group: 'driveline',
    intervalKm: 80000,
    intervalMonths: 0,
    brands: PART_BRANDS,
    hint: 'Manual only — replace the pressure plate and release bearing with it',
  },
]

/** Catalog lookup by key. Undefined for an unknown / retired key. */
export function maintenanceItem(key: string): MaintenanceItem | undefined {
  return MAINTENANCE_ITEMS.find((i) => i.key === key)
}

/** Display label for a key, falling back to the raw key. */
export function itemLabel(key: string): string {
  return maintenanceItem(key)?.label ?? key
}

/** Catalog items in one group, in catalog order. */
export function itemsInGroup(group: ItemGroup): MaintenanceItem[] {
  return MAINTENANCE_ITEMS.filter((i) => i.group === group)
}

/** The catalog key the oil-change interval setting applies to. */
export const ENGINE_OIL_KEY = 'engine-oil'

/** The oil filter is replaced with the oil, so it follows the same interval. */
export const OIL_FILTER_KEY = 'oil-filter'

/** Items measured against the car's oil-change interval, not the catalog's. */
export const OIL_INTERVAL_KEYS = [ENGINE_OIL_KEY, OIL_FILTER_KEY]

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

/**
 * One job done during a service — a catalog key plus whatever detail was worth
 * recording (brand, spec, quantity, its own cost).
 */
export interface ServiceItem {
  /** Catalog key, e.g. 'engine-oil', 'brake-pads-front', 'tyres'. */
  key: string
  /** Brand fitted, e.g. "Shell Helix", "Yokohama". */
  brand?: string
  /** Spec: oil grade "5W-30", tyre size "185/65R15", plug type "Iridium". */
  spec?: string
  /** Quantity — litres of oil, number of tyres / plugs. */
  qty?: number
  /** What this item alone cost (Rs), when known. */
  cost?: number
  /** Free note for this item. */
  note?: string
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
  /** Everything replaced / serviced during this visit. */
  items: ServiceItem[]
  /** Free-text notes — work done, parts, observations. */
  description?: string
  createdAt: string
}

/** The recorded detail for a key on a service, if it was done. */
export function findItem(service: CarService, key: string): ServiceItem | undefined {
  return service.items.find((i) => i.key === key)
}

/** Whether a service covered a given maintenance item. */
export function hasItem(service: CarService, key: string): boolean {
  return service.items.some((i) => i.key === key)
}
