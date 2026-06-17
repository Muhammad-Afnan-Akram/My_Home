import type { DiscoCode, ScrapedBill } from '../types'
import { getAccessToken } from '@/lib/supabase'

/**
 * Fetch a bill from the server scraper (Vite dev middleware in development,
 * the Vercel function in production). When `company` is omitted, the server
 * auto-detects it from the reference number. Throws an Error with a readable
 * message on failure.
 */
export async function fetchScrapedBill(
  referenceNumber: string,
  company?: DiscoCode,
): Promise<ScrapedBill> {
  const params = new URLSearchParams({ refno: referenceNumber })
  if (company) params.set('company', company)
  const token = await getAccessToken()
  const res = await fetch(`/api/bill?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const data = (await res.json().catch(() => null)) as ScrapedBill | { error?: string } | null

  if (!res.ok || !data) {
    const message = data && 'error' in data && data.error ? data.error : 'Failed to fetch bill.'
    throw new Error(message)
  }
  return data as ScrapedBill
}
