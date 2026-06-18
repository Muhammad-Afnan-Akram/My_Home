import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import type { CycleConsumption } from '../types'
import { formatShort, formatLongDate } from '../utils/date'
import ConsumptionGauge from './ConsumptionGauge'

interface CycleSummaryProps {
  consumption: CycleConsumption
  /** Global protected-slab limit applied to every meter. */
  unitLimit: number
  /** Calculations are based on an old bill — soften "official" wording. */
  estimated?: boolean
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  )
}

function CycleSummary({ consumption: c, unitLimit, estimated = false }: CycleSummaryProps) {
  const daysLeft = Math.max(0, c.daysInCycle - c.daysElapsed)

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <ConsumptionGauge unitsUsed={c.unitsUsed} limit={unitLimit} size={150} />
          <Stack spacing={0.25} sx={{ alignItems: 'center' }}>
            {c.anchoredToBill ? (
              <>
                <Typography variant="caption" color="text.secondary">
                  Based on last official bill:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatLongDate(c.cycleStart)}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Cycle {formatShort(c.cycleStart)} – {formatShort(c.cycleEnd)} · {daysLeft} days left
              </Typography>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" sx={{ mt: 2 }} divider={<Box sx={{ width: '1px', bgcolor: 'divider' }} />}>
          <Stat
            label={estimated ? 'Estimated Usage' : 'Used'}
            value={c.unitsUsed == null ? '—' : `${c.unitsUsed}`}
          />
          <Stat
            label="Per day"
            value={c.dailyAverage == null ? '—' : c.dailyAverage.toFixed(1)}
          />
          <Stat
            label={estimated ? 'Projected Units' : 'Projected'}
            value={c.projectedUnits == null ? '—' : `${c.projectedUnits}`}
          />
        </Stack>

        {c.projectedToExceed && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            At this rate you'll reach about {c.projectedUnits} units — over your {unitLimit}
            -unit limit. Ease off to stay in the cheaper slab.
          </Alert>
        )}
        {c.unitsRemaining != null && c.unitsRemaining < 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            You've crossed the {unitLimit}-unit protected slab by {Math.abs(c.unitsRemaining)}{' '}
            units this cycle.
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default CycleSummary
