export type ConsumptionStatus = 'safe' | 'warning' | 'over'

/** Classify usage against the protected-slab limit (0 = no limit set). */
export function consumptionStatus(unitsUsed: number | null, limit: number): ConsumptionStatus {
  // No slab limit set — nothing to exceed.
  if (unitsUsed == null || limit <= 0) return 'safe'
  const ratio = unitsUsed / limit
  if (ratio >= 1) return 'over'
  if (ratio >= 0.8) return 'warning'
  return 'safe'
}
