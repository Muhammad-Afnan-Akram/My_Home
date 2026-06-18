import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Surfaced early so a missing .env is obvious during development.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(url ?? '', anonKey ?? '')

/**
 * Current access token (JWT) for authorizing API calls, or null.
 *
 * Access tokens live ~1 hour; `getSession()` can hand back one that's already
 * expired (or about to), which the server then rejects with 401. So refresh
 * proactively when the token is within 60s of expiry.
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) return null

  const nowSec = Math.floor(Date.now() / 1000)
  if ((session.expires_at ?? 0) - nowSec > 60) {
    return session.access_token
  }

  // Token expired or expiring — try to refresh before using it.
  const { data: refreshed, error } = await supabase.auth.refreshSession()
  if (error) return session.access_token // let the server reject; the UI surfaces it
  return refreshed.session?.access_token ?? session.access_token
}
