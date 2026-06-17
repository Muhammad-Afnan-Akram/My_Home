import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import type { CycleConsumption, Meter } from '../types'
import { formatShort } from '../utils/date'
import ConsumptionGauge from './ConsumptionGauge'

interface CycleSummaryProps {
  meter: Meter
  consumption: CycleConsumption
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

function CycleSummary({ meter, consumption: c }: CycleSummaryProps) {
  const daysLeft = Math.max(0, c.daysInCycle - c.daysElapsed)

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <ConsumptionGauge unitsUsed={c.unitsUsed} limit={meter.unitLimit} size={150} />
          <Typography variant="body2" color="text.secondary">
            Cycle {formatShort(c.cycleStart)} – {formatShort(c.cycleEnd)} · {daysLeft} days left
          </Typography>
        </Stack>

        <Stack direction="row" sx={{ mt: 2 }} divider={<Box sx={{ width: '1px', bgcolor: 'divider' }} />}>
          <Stat label="Used" value={c.unitsUsed == null ? '—' : `${c.unitsUsed}`} />
          <Stat
            label="Per day"
            value={c.dailyAverage == null ? '—' : c.dailyAverage.toFixed(1)}
          />
          <Stat
            label="Projected"
            value={c.projectedUnits == null ? '—' : `${c.projectedUnits}`}
          />
        </Stack>

        {c.projectedToExceed && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            At this rate you'll reach about {c.projectedUnits} units — over your {meter.unitLimit}
            -unit limit. Ease off to stay in the cheaper slab.
          </Alert>
        )}
        {c.unitsRemaining != null && c.unitsRemaining < 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            You've crossed the {meter.unitLimit}-unit protected slab by {Math.abs(c.unitsRemaining)}{' '}
            units this cycle.
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default CycleSummary
