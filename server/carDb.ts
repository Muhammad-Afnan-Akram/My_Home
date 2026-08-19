// Data access for the Car module, backed by Supabase Postgres.
// Returns objects already shaped like the frontend types (camelCase).
import { query } from './db.js'

interface Car {
  id: string
  make: string
  model: string
  variant: string
  year?: number
  serviceIntervalKm?: number
  color?: string
  imageUrl?: string
  registrationNumber: string
  currentMeter: number
  createdAt: string
}

/** One maintenance job recorded against a service (see the frontend catalog). */
interface ServiceItem {
  key: string
  brand?: string
  spec?: string
  qty?: number
  cost?: number
  note?: string
}

interface CarService {
  id: string
  carId: string
  date: string
  meterReading: number
  type: string
  cost: number
  items: ServiceItem[]
  description?: string
  createdAt: string
}

interface CarSettings {
  oilChangeIntervalKm: number
}

type Row = Record<string, unknown>

const str = (v: unknown): string | undefined => (v == null ? undefined : String(v))
const num = (v: unknown): number | undefined => (v == null ? undefined : Number(v))
const iso = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v ?? ''))

function mapCar(r: Row): Car {
  return {
    id: String(r.id),
    make: String(r.make),
    model: String(r.model),
    variant: String(r.variant ?? ''),
    year: num(r.year),
    serviceIntervalKm: num(r.service_interval_km),
    color: str(r.color),
    imageUrl: str(r.image_url),
    registrationNumber: String(r.registration_number),
    currentMeter: Number(r.current_meter),
    createdAt: iso(r.created_at),
  }
}

/**
 * The boolean columns that predate the maintenance-item list, mapped to their
 * catalog keys. Rows written before `items` existed are read through these, and
 * new writes keep them in sync so nothing that still reads them breaks.
 */
const LEGACY_ITEM_COLUMNS: Record<string, string> = {
  'engine-oil': 'oil_changed',
  'oil-filter': 'oil_filter_changed',
  'air-filter': 'air_filter_changed',
  'fuel-filter': 'fuel_filter_changed',
  'ac-filter': 'ac_filter_changed',
  coolant: 'coolant_changed',
}

const ENGINE_OIL_KEY = 'engine-oil'
/** Guard rails on free text going into jsonb. */
const MAX_TEXT = 120

function text(v: unknown): string | undefined {
  if (v == null) return undefined
  const s = String(v).trim().slice(0, MAX_TEXT)
  return s.length ? s : undefined
}

function positive(v: unknown): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/** Validate + strip the item list coming from the client before storing it. */
function normalizeItems(raw: unknown): ServiceItem[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const items: ServiceItem[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const key = text((entry as Row).key)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const item: ServiceItem = { key }
    const brand = text((entry as Row).brand)
    const spec = text((entry as Row).spec)
    const note = text((entry as Row).note)
    const qty = positive((entry as Row).qty)
    const cost = positive((entry as Row).cost)
    if (brand) item.brand = brand
    if (spec) item.spec = spec
    if (note) item.note = note
    if (qty != null) item.qty = qty
    if (cost != null) item.cost = cost
    items.push(item)
  }
  return items
}

/** Legacy boolean / oil columns derived from an item list. */
function legacyColumnsFor(items: ServiceItem[]): Row {
  const oil = items.find((i) => i.key === ENGINE_OIL_KEY)
  const out: Row = {
    oil_brand: oil?.brand ?? null,
    oil_grade: oil?.spec ?? null,
    oil_liters: oil?.qty ?? null,
  }
  for (const [key, column] of Object.entries(LEGACY_ITEM_COLUMNS)) {
    out[column] = items.some((i) => i.key === key)
  }
  return out
}

/** Item list rebuilt from the legacy boolean columns, for pre-`items` rows. */
function legacyItemsFrom(r: Row): ServiceItem[] {
  const items: ServiceItem[] = []
  for (const [key, column] of Object.entries(LEGACY_ITEM_COLUMNS)) {
    if (!r[column]) continue
    if (key === ENGINE_OIL_KEY) {
      const oil: ServiceItem = { key }
      const brand = text(r.oil_brand)
      const spec = text(r.oil_grade)
      const qty = positive(r.oil_liters)
      if (brand) oil.brand = brand
      if (spec) oil.spec = spec
      if (qty != null) oil.qty = qty
      items.push(oil)
    } else {
      items.push({ key })
    }
  }
  return items
}

function readItems(r: Row): ServiceItem[] {
  const raw = r.items
  const parsed = typeof raw === 'string' ? safeParse(raw) : raw
  const items = normalizeItems(parsed)
  // Rows written before the `items` column existed still carry only booleans.
  return items.length ? items : legacyItemsFrom(r)
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return []
  }
}

function mapService(r: Row): CarService {
  return {
    id: String(r.id),
    carId: String(r.car_id),
    date: String(r.date),
    meterReading: Number(r.meter_reading),
    type: String(r.type),
    cost: Number(r.cost),
    items: readItems(r),
    description: str(r.description),
    createdAt: iso(r.created_at),
  }
}

const SERVICE_COLS = `s.id, s.car_id, to_char(s.date, 'YYYY-MM-DD') as date, s.meter_reading, s.type,
  s.cost, s.items, s.oil_changed, s.oil_brand, s.oil_grade, s.oil_liters, s.oil_filter_changed,
  s.air_filter_changed, s.fuel_filter_changed, s.ac_filter_changed, s.coolant_changed,
  s.description, s.created_at`

export async function getCars(userId: string): Promise<Car[]> {
  const rows = await query('select * from cars where user_id = $1 order by created_at asc', [userId])
  return rows.map(mapCar)
}

export async function addCar(
  input: Omit<Car, 'id' | 'createdAt'>,
  userId: string,
): Promise<Car> {
  const rows = await query(
    `insert into cars (user_id, make, model, variant, year, service_interval_km, color, image_url, registration_number, current_meter)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [
      userId,
      input.make,
      input.model,
      input.variant ?? '',
      input.year ?? null,
      input.serviceIntervalKm ?? null,
      input.color ?? null,
      input.imageUrl ?? null,
      input.registrationNumber,
      input.currentMeter ?? 0,
    ],
  )
  return mapCar(rows[0])
}

const CAR_COLUMNS: Record<string, string> = {
  make: 'make',
  model: 'model',
  variant: 'variant',
  year: 'year',
  serviceIntervalKm: 'service_interval_km',
  color: 'color',
  imageUrl: 'image_url',
  registrationNumber: 'registration_number',
  currentMeter: 'current_meter',
}

export async function updateCar(
  id: string,
  patch: Record<string, unknown>,
  userId: string,
): Promise<Car> {
  const sets: string[] = []
  const values: unknown[] = []
  for (const [key, column] of Object.entries(CAR_COLUMNS)) {
    if (key in patch) {
      values.push(patch[key])
      sets.push(`${column} = $${values.length}`)
    }
  }
  if (sets.length === 0) {
    const rows = await query('select * from cars where id = $1 and user_id = $2', [id, userId])
    if (!rows.length) throw new Error('Car not found.')
    return mapCar(rows[0])
  }
  values.push(id, userId)
  const rows = await query(
    `update cars set ${sets.join(', ')}
     where id = $${values.length - 1} and user_id = $${values.length} returning *`,
    values,
  )
  if (!rows.length) throw new Error('Car not found.')
  return mapCar(rows[0])
}

export async function deleteCar(id: string, userId: string): Promise<void> {
  await query('delete from cars where id = $1 and user_id = $2', [id, userId])
}

export async function getServices(userId: string, carId?: string): Promise<CarService[]> {
  if (carId) {
    const rows = await query(
      `select ${SERVICE_COLS} from car_services s join cars c on c.id = s.car_id
       where c.user_id = $1 and s.car_id = $2 order by s.date desc, s.created_at desc`,
      [userId, carId],
    )
    return rows.map(mapService)
  }
  const rows = await query(
    `select ${SERVICE_COLS} from car_services s join cars c on c.id = s.car_id
     where c.user_id = $1 order by s.date desc, s.created_at desc`,
    [userId],
  )
  return rows.map(mapService)
}

export async function addService(
  input: Omit<CarService, 'id' | 'createdAt'>,
  userId: string,
): Promise<CarService> {
  const items = normalizeItems(input.items)
  const legacy = legacyColumnsFor(items)
  const rows = await query(
    `insert into car_services (car_id, date, meter_reading, type, cost, items, oil_changed, oil_brand,
       oil_grade, oil_liters, oil_filter_changed, air_filter_changed, fuel_filter_changed,
       ac_filter_changed, coolant_changed, description)
     select $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
     where exists (select 1 from cars where id = $1 and user_id = $17)
     returning ${SERVICE_COLS.replace(/\bs\./g, '')}`,
    [
      input.carId,
      input.date,
      input.meterReading,
      input.type ?? 'service',
      input.cost ?? 0,
      JSON.stringify(items),
      legacy.oil_changed,
      legacy.oil_brand,
      legacy.oil_grade,
      legacy.oil_liters,
      legacy.oil_filter_changed,
      legacy.air_filter_changed,
      legacy.fuel_filter_changed,
      legacy.ac_filter_changed,
      legacy.coolant_changed,
      input.description ?? null,
      userId,
    ],
  )
  if (!rows.length) throw new Error('Car not found.')
  // Keep the car's current odometer in sync with its latest service reading.
  await query(
    `update cars set current_meter = greatest(current_meter, $1)
     where id = $2 and user_id = $3`,
    [input.meterReading, input.carId, userId],
  )
  return mapService(rows[0])
}

const SERVICE_COLUMNS: Record<string, string> = {
  date: 'date',
  meterReading: 'meter_reading',
  type: 'type',
  cost: 'cost',
  description: 'description',
}

const SERVICE_RETURN = SERVICE_COLS.replace(/\bs\./g, '')

/** Column → value pairs for a service patch, expanding `items` into its columns. */
function serviceColumnValues(patch: Record<string, unknown>): Row {
  const out: Row = {}
  for (const [key, column] of Object.entries(SERVICE_COLUMNS)) {
    if (key in patch) out[column] = patch[key]
  }
  if ('items' in patch) {
    const items = normalizeItems(patch.items)
    // jsonb must go over the wire as text — node-postgres would otherwise turn
    // a JS array into a Postgres array literal.
    out.items = JSON.stringify(items)
    Object.assign(out, legacyColumnsFor(items))
  }
  return out
}

export async function updateService(
  id: string,
  patch: Record<string, unknown>,
  userId: string,
): Promise<CarService> {
  const columns = serviceColumnValues(patch)
  const sets: string[] = []
  const values: unknown[] = []
  for (const [column, value] of Object.entries(columns)) {
    values.push(value)
    sets.push(`${column} = $${values.length}${column === 'items' ? '::jsonb' : ''}`)
  }
  if (sets.length === 0) {
    const rows = await query(
      `select ${SERVICE_COLS} from car_services s join cars c on c.id = s.car_id
       where s.id = $1 and c.user_id = $2`,
      [id, userId],
    )
    if (!rows.length) throw new Error('Service not found.')
    return mapService(rows[0])
  }
  values.push(id, userId)
  const rows = await query(
    `update car_services set ${sets.join(', ')}
     where id = $${values.length - 1}
       and car_id in (select id from cars where user_id = $${values.length})
     returning ${SERVICE_RETURN}`,
    values,
  )
  if (!rows.length) throw new Error('Service not found.')
  const service = mapService(rows[0])
  // Keep the car's odometer in sync if the corrected reading is higher.
  if ('meterReading' in patch) {
    await query(
      `update cars set current_meter = greatest(current_meter, $1) where id = $2 and user_id = $3`,
      [service.meterReading, service.carId, userId],
    )
  }
  return service
}

export async function deleteService(id: string, userId: string): Promise<void> {
  await query(
    `delete from car_services where id = $1
     and car_id in (select id from cars where user_id = $2)`,
    [id, userId],
  )
}

const DEFAULT_OIL_INTERVAL_KM = 5000

/** Per-user car settings. Falls back to defaults when no row exists yet. */
export async function getCarSettings(userId: string): Promise<CarSettings> {
  const rows = await query('select oil_change_interval_km from car_settings where user_id = $1', [
    userId,
  ])
  return {
    oilChangeIntervalKm: rows.length
      ? Number(rows[0].oil_change_interval_km)
      : DEFAULT_OIL_INTERVAL_KM,
  }
}

export async function saveCarSettings(input: CarSettings, userId: string): Promise<CarSettings> {
  const rows = await query(
    `insert into car_settings (user_id, oil_change_interval_km, updated_at) values ($1, $2, now())
     on conflict (user_id) do update set oil_change_interval_km = excluded.oil_change_interval_km, updated_at = now()
     returning oil_change_interval_km`,
    [userId, Math.max(0, Math.round(input.oilChangeIntervalKm))],
  )
  return { oilChangeIntervalKm: Number(rows[0].oil_change_interval_km) }
}

/**
 * Whitelisted RPC dispatch used by the /api/car endpoint. Every op is scoped
 * to the authenticated user, so a user can only touch their own data.
 */
export async function handleCarOp(
  op: string,
  payload: Record<string, unknown>,
  userId: string,
): Promise<unknown> {
  switch (op) {
    case 'getCars':
      return getCars(userId)
    case 'addCar':
      return addCar(payload as unknown as Omit<Car, 'id' | 'createdAt'>, userId)
    case 'updateCar':
      return updateCar(String(payload.id), payload.patch as Record<string, unknown>, userId)
    case 'deleteCar':
      return deleteCar(String(payload.id), userId)
    case 'getServices':
      return getServices(userId, payload.carId ? String(payload.carId) : undefined)
    case 'addService':
      return addService(payload as unknown as Omit<CarService, 'id' | 'createdAt'>, userId)
    case 'updateService':
      return updateService(String(payload.id), payload.patch as Record<string, unknown>, userId)
    case 'deleteService':
      return deleteService(String(payload.id), userId)
    case 'getCarSettings':
      return getCarSettings(userId)
    case 'saveCarSettings':
      return saveCarSettings(payload as unknown as CarSettings, userId)
    default:
      throw new Error(`Unknown op: ${op}`)
  }
}
