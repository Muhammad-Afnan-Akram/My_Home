// Data access for the Bike Tuning module, backed by Supabase Postgres.
// Returns objects already shaped like the frontend types (camelCase).
import { query } from './db.js'

interface Bike {
  id: string
  company: string
  model: string
  registrationNumber: string
  currentMeter: number
  createdAt: string
}

interface Tuning {
  id: string
  bikeId: string
  date: string
  meterReading: number
  cost: number
  description?: string
  createdAt: string
}

interface BikeSettings {
  tuningIntervalKm: number
}

type Row = Record<string, unknown>

const str = (v: unknown): string | undefined => (v == null ? undefined : String(v))
const iso = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v ?? ''))

function mapBike(r: Row): Bike {
  return {
    id: String(r.id),
    company: String(r.company),
    model: String(r.model),
    registrationNumber: String(r.registration_number),
    currentMeter: Number(r.current_meter),
    createdAt: iso(r.created_at),
  }
}

function mapTuning(r: Row): Tuning {
  return {
    id: String(r.id),
    bikeId: String(r.bike_id),
    date: String(r.date),
    meterReading: Number(r.meter_reading),
    cost: Number(r.cost),
    description: str(r.description),
    createdAt: iso(r.created_at),
  }
}

const TUNING_COLS = `t.id, t.bike_id, to_char(t.date, 'YYYY-MM-DD') as date, t.meter_reading, t.cost, t.description, t.created_at`

export async function getBikes(userId: string): Promise<Bike[]> {
  const rows = await query('select * from bikes where user_id = $1 order by created_at asc', [
    userId,
  ])
  return rows.map(mapBike)
}

export async function addBike(
  input: Omit<Bike, 'id' | 'createdAt'>,
  userId: string,
): Promise<Bike> {
  const rows = await query(
    `insert into bikes (user_id, company, model, registration_number, current_meter)
     values ($1,$2,$3,$4,$5) returning *`,
    [userId, input.company, input.model, input.registrationNumber, input.currentMeter ?? 0],
  )
  return mapBike(rows[0])
}

const BIKE_COLUMNS: Record<string, string> = {
  company: 'company',
  model: 'model',
  registrationNumber: 'registration_number',
  currentMeter: 'current_meter',
}

export async function updateBike(
  id: string,
  patch: Record<string, unknown>,
  userId: string,
): Promise<Bike> {
  const sets: string[] = []
  const values: unknown[] = []
  for (const [key, column] of Object.entries(BIKE_COLUMNS)) {
    if (key in patch) {
      values.push(patch[key])
      sets.push(`${column} = $${values.length}`)
    }
  }
  if (sets.length === 0) {
    const rows = await query('select * from bikes where id = $1 and user_id = $2', [id, userId])
    if (!rows.length) throw new Error('Bike not found.')
    return mapBike(rows[0])
  }
  values.push(id, userId)
  const rows = await query(
    `update bikes set ${sets.join(', ')}
     where id = $${values.length - 1} and user_id = $${values.length} returning *`,
    values,
  )
  if (!rows.length) throw new Error('Bike not found.')
  return mapBike(rows[0])
}

export async function deleteBike(id: string, userId: string): Promise<void> {
  await query('delete from bikes where id = $1 and user_id = $2', [id, userId])
}

export async function getTunings(userId: string, bikeId?: string): Promise<Tuning[]> {
  if (bikeId) {
    const rows = await query(
      `select ${TUNING_COLS} from tunings t join bikes b on b.id = t.bike_id
       where b.user_id = $1 and t.bike_id = $2 order by t.date desc, t.created_at desc`,
      [userId, bikeId],
    )
    return rows.map(mapTuning)
  }
  const rows = await query(
    `select ${TUNING_COLS} from tunings t join bikes b on b.id = t.bike_id
     where b.user_id = $1 order by t.date desc, t.created_at desc`,
    [userId],
  )
  return rows.map(mapTuning)
}

export async function addTuning(
  input: Omit<Tuning, 'id' | 'createdAt'>,
  userId: string,
): Promise<Tuning> {
  const rows = await query(
    `insert into tunings (bike_id, date, meter_reading, cost, description)
     select $1, $2, $3, $4, $5
     where exists (select 1 from bikes where id = $1 and user_id = $6)
     returning ${TUNING_COLS.replace(/\bt\./g, '')}`,
    [input.bikeId, input.date, input.meterReading, input.cost ?? 0, input.description ?? null, userId],
  )
  if (!rows.length) throw new Error('Bike not found.')
  // Keep the bike's current odometer in sync with its latest tuning reading.
  await query(
    `update bikes set current_meter = greatest(current_meter, $1)
     where id = $2 and user_id = $3`,
    [input.meterReading, input.bikeId, userId],
  )
  return mapTuning(rows[0])
}

export async function deleteTuning(id: string, userId: string): Promise<void> {
  await query(
    `delete from tunings where id = $1
     and bike_id in (select id from bikes where user_id = $2)`,
    [id, userId],
  )
}

const DEFAULT_TUNING_INTERVAL_KM = 1000

/** Per-user bike settings. Falls back to defaults when no row exists yet. */
export async function getBikeSettings(userId: string): Promise<BikeSettings> {
  const rows = await query('select tuning_interval_km from bike_settings where user_id = $1', [
    userId,
  ])
  return {
    tuningIntervalKm: rows.length
      ? Number(rows[0].tuning_interval_km)
      : DEFAULT_TUNING_INTERVAL_KM,
  }
}

export async function saveBikeSettings(
  input: BikeSettings,
  userId: string,
): Promise<BikeSettings> {
  const rows = await query(
    `insert into bike_settings (user_id, tuning_interval_km, updated_at) values ($1, $2, now())
     on conflict (user_id) do update set tuning_interval_km = excluded.tuning_interval_km, updated_at = now()
     returning tuning_interval_km`,
    [userId, Math.max(0, Math.round(input.tuningIntervalKm))],
  )
  return { tuningIntervalKm: Number(rows[0].tuning_interval_km) }
}

/**
 * Whitelisted RPC dispatch used by the /api/bike endpoint. Every op is scoped
 * to the authenticated user, so a user can only touch their own data.
 */
export async function handleBikeOp(
  op: string,
  payload: Record<string, unknown>,
  userId: string,
): Promise<unknown> {
  switch (op) {
    case 'getBikes':
      return getBikes(userId)
    case 'addBike':
      return addBike(payload as unknown as Omit<Bike, 'id' | 'createdAt'>, userId)
    case 'updateBike':
      return updateBike(String(payload.id), payload.patch as Record<string, unknown>, userId)
    case 'deleteBike':
      return deleteBike(String(payload.id), userId)
    case 'getTunings':
      return getTunings(userId, payload.bikeId ? String(payload.bikeId) : undefined)
    case 'addTuning':
      return addTuning(payload as unknown as Omit<Tuning, 'id' | 'createdAt'>, userId)
    case 'deleteTuning':
      return deleteTuning(String(payload.id), userId)
    case 'getBikeSettings':
      return getBikeSettings(userId)
    case 'saveBikeSettings':
      return saveBikeSettings(payload as unknown as BikeSettings, userId)
    default:
      throw new Error(`Unknown op: ${op}`)
  }
}
