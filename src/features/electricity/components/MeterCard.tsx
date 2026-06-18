import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import BoltIcon from '@mui/icons-material/Bolt'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import type { BillInfo, Meter, Reading } from '../types'
import { DISCOS } from '../types'
import { computeCycleConsumption } from '../utils/billing'
import { daysBetween, todayISO, formatRelative, isCurrentMonthISO } from '../utils/date'
import ConsumptionGauge, { consumptionStatus } from './ConsumptionGauge'

const STATUS_LABEL = {
  safe: 'On track',
  warning: 'Near limit',
  over: 'Over limit',
} as const

const STATUS_COLOR = {
  safe: 'success',
  warning: 'warning',
  over: 'error',
} as const

export function discoLabel(code: Meter['company']): string {
  return DISCOS.find((d) => d.code === code)?.label ?? code.toUpperCase()
}

interface MeterCardProps {
  meter: Meter
  readings: Reading[]
  fetching?: boolean
  /** Latest bill snapshot — anchors the consumption cycle when present. */
  bill?: BillInfo | null
  /** ISO timestamp of the last successful bill update, if any. */
  lastUpdated?: string
  /** Bill month token from the latest bill, e.g. "MAY 26". */
  billMonth?: string
  /** Bill issue date (yyyy-mm-dd) — used to judge Latest vs Outdated. */
  issueDate?: string
  onClick: () => void
  onRefresh: () => void
  onDelete: () => void
}

function MeterCard({
  meter,
  readings,
  fetching = false,
  bill,
  lastUpdated,
  billMonth,
  issueDate,
  onClick,
  onRefresh,
  onDelete,
}: MeterCardProps) {
  const c = computeCycleConsumption(meter, readings, undefined, bill)
  const status = consumptionStatus(c.unitsUsed, meter.unitLimit)
  const daysLeft = Math.max(0, daysBetween(todayISO(), c.cycleEnd))

  // Latest if the bill was issued in the current calendar month.
  const isLatest = Boolean(issueDate && isCurrentMonthISO(issueDate))

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea onClick={onClick} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <ConsumptionGauge unitsUsed={c.unitsUsed} limit={meter.unitLimit} size={96} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <BoltIcon fontSize="small" color="warning" />
              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                {meter.name}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              {discoLabel(meter.company)}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              Ref: {meter.referenceNumber}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
              {fetching ? (
                <>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">
                    Fetching bill…
                  </Typography>
                </>
              ) : (
                <>
                  <Chip
                    size="small"
                    label={STATUS_LABEL[status]}
                    color={STATUS_COLOR[status]}
                    variant={status === 'safe' ? 'outlined' : 'filled'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {c.unitsUsed == null
                      ? `Limit ${meter.unitLimit}`
                      : `${c.unitsUsed} / ${meter.unitLimit} · ${daysLeft}d left`}
                  </Typography>
                </>
              )}
            </Stack>
            {(billMonth || issueDate) && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                {billMonth && <Chip size="small" variant="outlined" label={`Bill: ${billMonth}`} />}
                {issueDate && (
                  <Chip
                    size="small"
                    color={isLatest ? 'success' : 'warning'}
                    variant="filled"
                    label={isLatest ? 'Latest' : 'Outdated'}
                  />
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </CardActionArea>

      <Divider />
      <Stack direction="row" sx={{ alignItems: 'center', px: 1.5, py: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {fetching
            ? 'Updating…'
            : lastUpdated
              ? `Updated ${formatRelative(lastUpdated)}`
              : 'Not updated yet'}
        </Typography>
        <Tooltip title="Refresh now">
          <span>
            <IconButton size="small" aria-label="refresh" onClick={onRefresh} disabled={fetching}>
              {fetching ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete meter">
          <IconButton size="small" aria-label="delete" onClick={onDelete} color="error">
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Card>
  )
}

export default MeterCard
