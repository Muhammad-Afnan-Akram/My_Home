// Data access for the Electricity module, backed by Supabase Postgres.
// Returns objects already shaped like the frontend types (camelCase).
import { query } from './db.js'

interface Meter {
  id: string
  name: string
  company: string
  referenceNumber: string
  cycleStartDay: number
  unitLimit: number
  billUrl?: string
  createdAt: string
}

interface Reading {
  id: string
  meterId: string
  date: string
  value: number
  note?: string
  createdAt: string
}

interface MonthlyUnit {
  month: string
  units: number
}

interface BillInfo {
  meterId: string
  units?: number
  amountDue?: number
  payableAfter?: number
  dueDate?: string
  readingDate?: string
  issueDate?: string
  billMonth?: string
  presentReading?: number
  previousReading?: number
  customerName?: string
  history?: MonthlyUnit[]
  source: 'manual' | 'scraped'
  updatedAt: string
}

type Row = Record<string, unknown>

const num = (v: unknown): number | undefined =>
  v == null ? undefined : Number(v)
const str = (v: unknown): string | undefined =>
  v == null ? undefined : String(v)
const iso = (v: unknown): string =>
  v instanceof Date ? v.toISOString() : String(v ?? '')

function mapMeter(r: Row): Meter {
  return {
    id: String(r.id),
    name: String(r.name),
    company: String(r.company),
    referenceNumber: String(r.reference_number),
    cycleStartDay: Number(r.cycle_start_day),
    unitLimit: Number(r.unit_limit),
    billUrl: str(r.bill_url),
    createdAt: iso(r.created_at),
  }
}

function mapReading(r: Row): Reading {
  return {
    id: String(r.id),
    meterId: String(r.meter_id),
    date: String(r.date),
    value: Number(r.value),
    note: str(r.note),
    createdAt: iso(r.created_at),
  }
}

function mapBill(r: Row): BillInfo {
  return {
    meterId: String(r.meter_id),
    units: num(r.units),
    amountDue: num(r.amount_due),
    payableAfter: num(r.payable_after),
    dueDate: str(r.due_date),
    readingDate: str(r.reading_date),
    issueDate: str(r.issue_date),
    billMonth: str(r.bill_month),
    presentReading: num(r.present_reading),
    previousReading: num(r.previous_reading),
    customerName: str(r.customer_name),
    history: (r.history as MonthlyUnit[] | null) ?? [],
    source: (str(r.source) as BillInfo['source']) ?? 'manual',
    updatedAt: iso(r.updated_at),
  }
}

const READING_COLS = `r.id, r.meter_id, to_char(r.date, 'YYYY-MM-DD') as date, r.value, r.note, r.created_at`

export async function getMeters(userId: string): Promise<Meter[]> {
  const rows = await query('select * from meters where user_id = $1 order by created_at asc', [
    userId,
  ])
  return rows.map(mapMeter)
}

export async function addMeter(
  input: Omit<Meter, 'id' | 'createdAt'>,
  userId: string,
): Promise<Meter> {
  const rows = await query(
    `insert into meters (user_id, name, company, reference_number, cycle_start_day, unit_limit, bill_url)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [
      userId,
      input.name,
      input.company,
      input.referenceNumber,
      input.cycleStartDay,
      input.unitLimit,
      input.billUrl ?? null,
    ],
  )
  return mapMeter(rows[0])
}

const METER_COLUMNS: Record<string, string> = {
  name: 'name',
  company: 'company',
  referenceNumber: 'reference_number',
  cycleStartDay: 'cycle_start_day',
  unitLimit: 'unit_limit',
  billUrl: 'bill_url',
}

export async function updateMeter(
  id: string,
  patch: Record<string, unknown>,
  userId: string,
): Promise<Meter> {
  const sets: string[] = []
  const values: unknown[] = []
  for (const [key, column] of Object.entries(METER_COLUMNS)) {
    if (key in patch) {
      values.push(patch[key])
      sets.push(`${column} = $${values.length}`)
    }
  }
  if (sets.length === 0) {
    const rows = await query('select * from meters where id = $1 and user_id = $2', [id, userId])
    if (!rows.length) throw new Error('Meter not found.')
    return mapMeter(rows[0])
  }
  values.push(id, userId)
  const rows = await query(
    `update meters set ${sets.join(', ')}
     where id = $${values.length - 1} and user_id = $${values.length} returning *`,
    values,
  )
  if (!rows.length) throw new Error('Meter not found.')
  return mapMeter(rows[0])
}

export async function deleteMeter(id: string, userId: string): Promise<void> {
  await query('delete from meters where id = $1 and user_id = $2', [id, userId])
}

export async function getReadings(userId: string, meterId?: string): Promise<Reading[]> {
  if (meterId) {
    const rows = await query(
      `select ${READING_COLS} from readings r join meters m on m.id = r.meter_id
       where m.user_id = $1 and r.meter_id = $2 order by r.date asc`,
      [userId, meterId],
    )
    return rows.map(mapReading)
  }
  const rows = await query(
    `select ${READING_COLS} from readings r join meters m on m.id = r.meter_id
     where m.user_id = $1 order by r.date asc`,
    [userId],
  )
  return rows.map(mapReading)
}

export async function addReading(
  input: Omit<Reading, 'id' | 'createdAt'>,
  userId: string,
): Promise<Reading> {
  const rows = await query(
    `insert into readings (meter_id, date, value, note)
     select $1, $2, $3, $4
     where exists (select 1 from meters where id = $1 and user_id = $5)
     returning id, meter_id, to_char(date, 'YYYY-MM-DD') as date, value, note, created_at`,
    [input.meterId, input.date, input.value, input.note ?? null, userId],
  )
  if (!rows.length) throw new Error('Meter not found.')
  return mapReading(rows[0])
}

export async function deleteReading(id: string, userId: string): Promise<void> {
  await query(
    `delete from readings where id = $1
     and meter_id in (select id from meters where user_id = $2)`,
    [id, userId],
  )
}

export async function getBill(meterId: string, userId: string): Promise<BillInfo | null> {
  const rows = await query(
    `select b.* from bills b join meters m on m.id = b.meter_id
     where m.user_id = $1 and b.meter_id = $2`,
    [userId, meterId],
  )
  return rows.length ? mapBill(rows[0]) : null
}

export async function saveBill(bill: BillInfo, userId: string): Promise<BillInfo> {
  const rows = await query(
    `insert into bills (
       meter_id, units, amount_due, payable_after, due_date, reading_date,
       issue_date, bill_month, present_reading, previous_reading,
       customer_name, history, source, updated_at
     )
     select $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now()
     where exists (select 1 from meters where id = $1 and user_id = $14)
     on conflict (meter_id) do update set
       units = excluded.units,
       amount_due = excluded.amount_due,
       payable_after = excluded.payable_after,
       due_date = excluded.due_date,
       reading_date = excluded.reading_date,
       issue_date = excluded.issue_date,
       bill_month = excluded.bill_month,
       present_reading = excluded.present_reading,
       previous_reading = excluded.previous_reading,
       customer_name = excluded.customer_name,
       history = excluded.history,
       source = excluded.source,
       updated_at = now()
     returning *`,
    [
      bill.meterId,
      bill.units ?? null,
      bill.amountDue ?? null,
      bill.payableAfter ?? null,
      bill.dueDate ?? null,
      bill.readingDate ?? null,
      bill.issueDate ?? null,
      bill.billMonth ?? null,
      bill.presentReading ?? null,
      bill.previousReading ?? null,
      bill.customerName ?? null,
      JSON.stringify(bill.history ?? []),
      bill.source,
      userId,
    ],
  )
  if (!rows.length) throw new Error('Meter not found.')
  return mapBill(rows[0])
}

/**
 * Whitelisted RPC dispatch used by the /api/db endpoint. Every op is scoped
 * to the authenticated user, so a user can only touch their own data.
 */
export async function handleDbOp(
  op: string,
  payload: Record<string, unknown>,
  userId: string,
): Promise<unknown> {
  switch (op) {
    case 'getMeters':
      return getMeters(userId)
    case 'addMeter':
      return addMeter(payload as unknown as Omit<Meter, 'id' | 'createdAt'>, userId)
    case 'updateMeter':
      return updateMeter(String(payload.id), payload.patch as Record<string, unknown>, userId)
    case 'deleteMeter':
      return deleteMeter(String(payload.id), userId)
    case 'getReadings':
      return getReadings(userId, payload.meterId ? String(payload.meterId) : undefined)
    case 'addReading':
      return addReading(payload as unknown as Omit<Reading, 'id' | 'createdAt'>, userId)
    case 'deleteReading':
      return deleteReading(String(payload.id), userId)
    case 'getBill':
      return getBill(String(payload.meterId), userId)
    case 'saveBill':
      return saveBill(payload as unknown as BillInfo, userId)
    default:
      throw new Error(`Unknown op: ${op}`)
  }
}
