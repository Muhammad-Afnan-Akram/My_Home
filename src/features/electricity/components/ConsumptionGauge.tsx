import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { consumptionStatus, type ConsumptionStatus } from '../utils/consumption'

const COLOR: Record<ConsumptionStatus, 'success' | 'warning' | 'error'> = {
  safe: 'success',
  warning: 'warning',
  over: 'error',
}

interface ConsumptionGaugeProps {
  unitsUsed: number | null
  limit: number
  size?: number
}

/** Pick a Typography variant for the big centre number that suits the ring size. */
function centreVariant(size: number) {
  return size < 90 ? 'h5' : 'h4'
}

/** Circular gauge: remaining units in the centre, ring fills as you consume. */
function ConsumptionGauge({ unitsUsed, limit, size = 132 }: ConsumptionGaugeProps) {
  const hasLimit = limit > 0
  const status = consumptionStatus(unitsUsed, limit)
  const color = COLOR[status]
  const used = unitsUsed ?? 0
  const pct = hasLimit ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const remaining = unitsUsed == null || !hasLimit ? null : limit - used

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
        {unitsUsed == null ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            No
            <br />
            readings
          </Typography>
        ) : !hasLimit ? (
          <>
            <Typography
              variant={centreVariant(size)}
              component="div"
              color="text.primary"
              sx={{ fontWeight: 700, lineHeight: 1 }}
            >
              {used}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              units used
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant={centreVariant(size)}
              component="div"
              color={`${color}.main`}
              sx={{ fontWeight: 700, lineHeight: 1 }}
            >
              {remaining}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {remaining != null && remaining >= 0 ? 'units left' : 'over limit'}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  )
}

export default ConsumptionGauge
