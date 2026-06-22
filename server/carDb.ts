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

interface CarService {
  id: string
  carId: string
  date: string
  meterReading: number
  type: string
  cost: number
  oilChanged: boolean
  oilBrand?: string
  oilGrade?: string
  oilLiters?: number
  oilFilterChanged: boolean
  airFilterChanged: boolean
  fuelFilterChanged: boolean
  acFilterChanged: boolean
  coolantChanged: boolean
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

function mapService(r: Row): CarService {
  return {
    id: String(r.id),
    carId: String(r.car_id),
    date: String(r.date),
    meterReading: Number(r.meter_reading),
    type: String(r.type),
    cost: Number(r.cost),
    oilChanged: Boolean(r.oil_changed),
    oilBrand: str(r.oil_brand),
    oilGrade: str(r.oil_grade),
    oilLiters: num(r.oil_liters),
    oilFilterChanged: Boolean(r.oil_filter_changed),
    airFilterChanged: Boolean(r.air_filter_changed),
    fuelFilterChanged: Boolean(r.fuel_filter_changed),
    acFilterChanged: Boolean(r.ac_filter_changed),
    coolantChanged: Boolean(r.coolant_changed),
    description: str(r.description),
    createdAt: iso(r.created_at),
  }
}

const SERVICE_COLS = `s.id, s.car_id, to_char(s.date, 'YYYY-MM-DD') as date, s.meter_reading, s.type,
  s.cost, s.oil_changed, s.oil_brand, s.oil_grade, s.oil_liters, s.oil_filter_changed,
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
  const rows = await query(
    `insert into car_services (car_id, date, meter_reading, type, cost, oil_changed, oil_brand,
       oil_grade, oil_liters, oil_filter_changed, air_filter_changed, fuel_filter_changed,
       ac_filter_changed, coolant_changed, description)
     select $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
     where exists (select 1 from cars where id = $1 and user_id = $16)
     returning ${SERVICE_COLS.replace(/\bs\./g, '')}`,
    [
      input.carId,
      input.date,
      input.meterReading,
      input.type ?? 'service',
      input.cost ?? 0,
      input.oilChanged ?? false,
      input.oilBrand ?? null,
      input.oilGrade ?? null,
      input.oilLiters ?? null,
      input.oilFilterChanged ?? false,
      input.airFilterChanged ?? false,
      input.fuelFilterChanged ?? false,
      input.acFilterChanged ?? false,
      input.coolantChanged ?? false,
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
