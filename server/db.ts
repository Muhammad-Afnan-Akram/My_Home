// Postgres connection for Supabase. Server-only.
// The connection string lives in DATABASE_URL (.env locally, project env
// vars on Vercel) — never in client code.
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set. Add it to your .env file.')
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    })
  }
  return pool
}

const SCHEMA_SQL = `
create table if not exists meters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  company text not null,
  reference_number text not null,
  cycle_start_day int not null default 1,
  unit_limit int not null default 200,
  bill_url text,
  created_at timestamptz not null default now()
);
alter table meters add column if not exists user_id uuid;
create index if not exists meters_user_idx on meters(user_id);
create table if not exists readings (
  id uuid primary key default gen_random_uuid(),
  meter_id uuid not null references meters(id) on delete cascade,
  date date not null,
  value double precision not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists readings_meter_idx on readings(meter_id);
create table if not exists settings (
  user_id uuid primary key,
  unit_limit int not null default 200,
  updated_at timestamptz not null default now()
);
create table if not exists bills (
  meter_id uuid primary key references meters(id) on delete cascade,
  units double precision,
  amount_due double precision,
  payable_after double precision,
  due_date text,
  reading_date text,
  issue_date text,
  bill_month text,
  present_reading double precision,
  previous_reading double precision,
  customer_name text,
  history jsonb,
  source text,
  updated_at timestamptz not null default now()
);
create table if not exists bikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  company text not null,
  model text not null,
  registration_number text not null,
  current_meter double precision not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists bikes_user_idx on bikes(user_id);
create table if not exists tunings (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references bikes(id) on delete cascade,
  date date not null,
  meter_reading double precision not null,
  cost double precision not null default 0,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists tunings_bike_idx on tunings(bike_id);
create table if not exists bike_settings (
  user_id uuid primary key,
  tuning_interval_km int not null default 1000,
  updated_at timestamptz not null default now()
);
`

let schemaReady: Promise<void> | null = null

/** Create tables once per process (idempotent). */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((err) => {
        schemaReady = null // allow retry on next call
        throw err
      })
  }
  return schemaReady
}

/** Run a query after ensuring the schema exists; returns the rows. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureSchema()
  const result = await getPool().query(text, params)
  return result.rows as T[]
}
