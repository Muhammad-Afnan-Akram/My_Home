import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

type Status = 'safe' | 'warning' | 'over'

export function consumptionStatus(unitsUsed: number | null, limit: number): Status {
  if (unitsUsed == null) return 'safe'
  const ratio = unitsUsed / limit
  if (ratio >= 1) return 'over'
  if (ratio >= 0.8) return 'warning'
  return 'safe'
}

const COLOR: Record<Status, 'success' | 'warning' | 'error'> = {
  safe: 'success',
  warning: 'warning',
  over: 'error',
}

interface ConsumptionGaugeProps {
  unitsUsed: number | null
  limit: number
  size?: number
}

/** Circular gauge: remaining units in the centre, ring fills as you consume. */
function ConsumptionGauge({ unitsUsed, limit, size = 132 }: ConsumptionGaugeProps) {
  const status = consumptionStatus(unitsUsed, limit)
  const color = COLOR[status]
  const used = unitsUsed ?? 0
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const remaining = unitsUsed == null ? null : limit - used

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={4}
        sx={{ color: 'action.hover' }}
      />
      <CircularProgress
        variant="determinate"
        value={pct}
        size={size}
        thickness={4}
        color={color}
        sx={{ position: 'absolute', left: 0, strokeLinecap: 'round' }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {remaining == null ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            No
            <br />
            readings
          </Typography>
        ) : (
          <>
            <Typography
              variant="h4"
              component="div"
              color={`${color}.main`}
              sx={{ fontWeight: 700, lineHeight: 1 }}
            >
              {remaining}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {remaining >= 0 ? 'units left' : 'over limit'}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  )
}

export default ConsumptionGauge
