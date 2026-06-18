import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import type { TuningStatus } from '../utils/format'

const COLOR = {
  safe: 'success',
  warning: 'warning',
  over: 'error',
} as const

interface TuningGaugeProps {
  /** Progress towards the next tuning, or null when it can't be derived. */
  status: TuningStatus | null
  size?: number
}

/**
 * Circular gauge mirroring the electricity module: the ring fills as the bike
 * approaches its next tuning, with remaining km in the centre. Falls back to a
 * wrench glyph when there's no interval / tuning to measure against.
 */
function TuningGauge({ status, size = 96 }: TuningGaugeProps) {
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
          <BuildOutlinedIcon sx={{ color: 'text.disabled' }} />
        ) : status.overdue ? (
          <>
            <Typography variant="subtitle1" component="div" color="error.main" sx={{ fontWeight: 700, lineHeight: 1 }}>
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

export default TuningGauge
