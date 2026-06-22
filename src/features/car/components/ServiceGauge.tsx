import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import OilBarrelOutlinedIcon from '@mui/icons-material/OilBarrelOutlined'
import type { ServiceStatus } from '../utils/format'

const COLOR = {
  safe: 'success',
  warning: 'warning',
  over: 'error',
} as const

interface ServiceGaugeProps {
  /** Progress towards the next oil change, or null when it can't be derived. */
  status: ServiceStatus | null
  size?: number
}

/**
 * Circular gauge: the ring fills as the car approaches its next oil change,
 * with the remaining km in the centre. Falls back to an oil-barrel glyph when
 * there's no interval / oil change to measure against.
 */
function ServiceGauge({ status, size = 96 }: ServiceGaugeProps) {
  const color = status ? COLOR[status.level] : 'success'
  const pct = status ? status.pct : 0

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
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
        {status == null ? (
          <OilBarrelOutlinedIcon sx={{ color: 'text.disabled' }} />
        ) : status.overdue ? (
          <>
            <Typography
              variant="subtitle1"
              component="div"
              color="error.main"
              sx={{ fontWeight: 700, lineHeight: 1 }}
            >
              Due
            </Typography>
            <Typography variant="caption" color="text.secondary">
              now
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant="h5"
              component="div"
              color={`${color}.main`}
              sx={{ fontWeight: 700, lineHeight: 1 }}
            >
              {Math.round(status.remaining).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              km left
            </Typography>
          </>
        )}
      </Box>
    </Box>
  )
}

export default ServiceGauge
