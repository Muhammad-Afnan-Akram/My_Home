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
import EventIcon from '@mui/icons-material/Event'
import PaymentsIcon from '@mui/icons-material/Payments'
import type { BillInfo, Meter, Reading } from '../types'
import { computeCycleConsumption } from '../utils/billing'
import { daysBetween, todayISO, formatRelative, formatLongDate, formatShort, isCurrentMonthISO } from '../utils/date'
import { consumptionStatus } from '../utils/consumption'
import { discoLabel } from '../utils/disco'
import ConsumptionGauge from './ConsumptionGauge'

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

interface MeterCardProps {
  meter: Meter
  readings: Reading[]
  fetching?: boolean
  /** Global protected-slab limit applied to every meter. */
  unitLimit: number
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
  unitLimit,
  bill,
  lastUpdated,
  billMonth,
  issueDate,
  onClick,
  onRefresh,
  onDelete,
}: MeterCardProps) {
  const c = computeCycleConsumption(meter, readings, undefined, bill, unitLimit)
  const status = consumptionStatus(c.unitsUsed, unitLimit)
  const daysLeft = Math.max(0, daysBetween(todayISO(), c.cycleEnd))

  // Latest if the bill was issued in the current calendar month.
  const isLatest = Boolean(issueDate && isCurrentMonthISO(issueDate))
  // Calculations lean on an old bill when we're anchored to one that isn't
  // this month's — surface that as an estimate rather than official data.
  const estimated = c.anchoredToBill && !isLatest

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea onClick={onClick} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <ConsumptionGauge unitsUsed={c.unitsUsed} limit={unitLimit} size={96} />
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
            {c.anchoredToBill && (
              <Typography
                variant="caption"
                noWrap
                sx={{ display: 'block', color: 'text.disabled', fontSize: '0.68rem' }}
              >
                Last Official Bill: {formatLongDate(c.cycleStart)}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
              {fetching ? (
                <>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">
                    Fetching bill…
                  </Typography>
                </>
              ) : (
                <>
                  {unitLimit > 0 && (
                    <Chip
                      size="small"
                      label={STATUS_LABEL[status]}
                      color={STATUS_COLOR[status]}
                      variant={status === 'safe' ? 'outlined' : 'filled'}
                    />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {c.unitsUsed == null
                      ? unitLimit > 0
                        ? `Limit ${unitLimit}`
                        : 'No limit set'
                      : unitLimit > 0
                        ? `${c.unitsUsed} / ${unitLimit} · ${daysLeft}d left`
                        : `${c.unitsUsed} units · ${daysLeft}d left`}
                  </Typography>
                  {estimated && (
                    <Chip
                      size="small"
                      color="warning"
                      variant="outlined"
                      label="⚠ Estimated from last bill"
                    />
                  )}
                </>
              )}
            </Stack>
            {(billMonth || issueDate) && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                {billMonth && <Chip size="small" variant="outlined" label={`Bill: ${billMonth}`} />}
                {issueDate &&
                  (isLatest ? (
                    <Chip size="small" color="success" variant="filled" label="Latest" />
                  ) : (
                    <Chip
                      size="small"
                      color="warning"
                      variant="filled"
                      label="Waiting for next bill"
                    />
                  ))}
              </Stack>
            )}
          </Box>
          {isLatest && bill && (
            <Stack spacing={0.75} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ lineHeight: 1.4, fontWeight: 700, letterSpacing: 0.5 }}
              >
                Current bill
              </Typography>
              {bill.units != null && (
                <Tooltip title="Units consumed">
                  <Chip
                    size="small"
                    variant="outlined"
                    color="warning"
                    icon={<BoltIcon />}
                    label={`${bill.units} units`}
                  />
                </Tooltip>
              )}
              {bill.dueDate && (
                <Tooltip title="Pay within this date">
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    icon={<EventIcon />}
                    label={`Due ${formatShort(bill.dueDate)}`}
                  />
                </Tooltip>
              )}
              {bill.amountDue != null && (
                <Tooltip title="Payable within due date">
                  <Chip
                    size="small"
                    variant="outlined"
                    color="primary"
                    icon={<PaymentsIcon />}
                    label={`Rs ${bill.amountDue.toLocaleString()}`}
                  />
                </Tooltip>
              )}
            </Stack>
          )}
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
