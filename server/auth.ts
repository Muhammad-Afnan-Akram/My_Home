// Verifies Supabase Auth access tokens server-side. The frontend sends the
// logged-in user's JWT as `Authorization: Bearer <token>`; we ask Supabase
// who it belongs to and return their user id. Server-only.
import 'dotenv/config'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!client) {
    const url = process.env.VITE_SUPABASE_URL
    const key = process.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set in .env')
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

export class AuthError extends Error {}

/** Resolve the authenticated user's id from an Authorization header. */
export async function getUserId(authHeader: string | null | undefined): Promise<string> {
  const token = (authHeader ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!token) throw new AuthError('Not signed in.')
  const { data, error } = await getClient().auth.getUser(token)
  if (error || !data.user) throw new AuthError('Session expired. Please sign in again.')
  return data.user.id
}
