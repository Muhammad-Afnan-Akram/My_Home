// Data access for custom device names in the Devices module.
// The router can't persist a friendly name, so users' renames live here,
// keyed by MAC (the device's stable identity — IP is DHCP-dynamic).
// Scoped per user, and returned as a { [mac]: name } map for easy merging.
import { query } from './db.js'

type Row = Record<string, unknown>

/** All custom names for a user, keyed by MAC address. */
export async function getDeviceNames(userId: string): Promise<Record<string, string>> {
  const rows = await query('select mac, name from device_names where user_id = $1', [userId])
  const map: Record<string, string> = {}
  for (const r of rows as Row[]) map[String(r.mac)] = String(r.name)
  return map
}

/**
 * Set (or clear) the custom name for a device. A blank name removes the
 * override so the router-reported host name shows again. Returns the fresh
 * name map so the caller can update its state in one round-trip.
 */
export async function setDeviceName(
  mac: string,
  name: string,
  userId: string,
): Promise<Record<string, string>> {
  const cleanMac = mac.trim()
  const cleanName = name.trim()
  if (!cleanMac) throw new Error('A device MAC address is required.')
  if (cleanName) {
    await query(
      `insert into device_names (user_id, mac, name) values ($1, $2, $3)
       on conflict (user_id, mac) do update set name = excluded.name, updated_at = now()`,
      [userId, cleanMac, cleanName],
    )
  } else {
    await query('delete from device_names where user_id = $1 and mac = $2', [userId, cleanMac])
  }
  return getDeviceNames(userId)
}

/**
 * Whitelisted RPC dispatch used by the /api/device-names endpoint. Every op is
 * scoped to the authenticated user, so a user only sees and edits their own names.
 */
export async function handleDeviceNamesOp(
  op: string,
  payload: Record<string, unknown>,
  userId: string,
): Promise<unknown> {
  switch (op) {
    case 'getDeviceNames':
      return getDeviceNames(userId)
    case 'setDeviceName':
      return setDeviceName(String(payload.mac), String(payload.name ?? ''), userId)
    default:
      throw new Error(`Unknown op: ${op}`)
  }
}
