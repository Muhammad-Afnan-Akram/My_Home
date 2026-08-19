import { useState } from 'react'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined'
import type { ItemStatus } from '../utils/format'
import { formatKm, isTracked, statusHistory, statusSummary } from '../utils/format'

const LEVEL_COLOR = {
  safe: 'success',
  warning: 'warning',
  over: 'error',
} as const

/** One item: where it stands, when it was last done, how close it is to due. */
function StatusRow({ status }: { status: ItemStatus }) {
  const color = LEVEL_COLOR[status.level]
  const interval = [
    status.intervalKm > 0 ? formatKm(status.intervalKm) : null,
    status.intervalMonths > 0 ? `${status.intervalMonths} mo` : null,
  ]
    .filter(Boolean)
    .join(' / ')

  return (
    <Box sx={{ py: 1.25 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
          {status.item.label}
        </Typography>
        <Typography
          variant="caption"
          color={status.level === 'safe' ? 'text.secondary' : `${color}.main`}
          sx={{ fontWeight: 600, flexShrink: 0 }}
        >
          {statusSummary(status)}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={status.pct}
        color={color}
        sx={{ height: 6, borderRadius: 3, my: 0.75, bgcolor: 'action.hover' }}
      />
      <Tooltip title={status.item.hint ?? ''} enterDelay={600}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {statusHistory(status)}
          {interval && ` · every ${interval}`}
        </Typography>
      </Tooltip>
    </Box>
  )
}

interface MaintenanceCardProps {
  /** Every catalog item's status for this car, most urgent first. */
  statuses: ItemStatus[]
}

/**
 * Per-item maintenance status: what's overdue, what's coming up, how far the
 * current tyres / pads / filters have run, and what has never been logged.
 */
function MaintenanceCard({ statuses }: MaintenanceCardProps) {
  const [showAll, setShowAll] = useState(false)
  const [showNever, setShowNever] = useState(false)

  const tracked = statuses.filter((s) => !s.never && isTracked(s))
  const due = tracked.filter((s) => s.level !== 'safe')
  const healthy = tracked.filter((s) => s.level === 'safe')
  const never = statuses.filter((s) => s.never)

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
        <BuildCircleOutlinedIcon sx={{ color: 'text.secondary' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
          Maintenance status
        </Typography>
        {due.length > 0 ? (
          <Chip
            size="small"
            color={due.some((s) => s.overdue) ? 'error' : 'warning'}
            label={`${due.length} due`}
            sx={{ fontWeight: 600 }}
          />
        ) : (
          tracked.length > 0 && <Chip size="small" color="success" label="All good" />
        )}
      </Stack>

      {tracked.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nothing to measure yet. Log a service and tick what was done — each item then tracks its
          own interval from that reading.
        </Typography>
      ) : (
        <>
          {due.length > 0 ? (
            <Stack divider={<Divider flexItem />}>
              {due.map((s) => (
                <StatusRow key={s.item.key} status={s} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Nothing due — the closest is {healthy[0]?.item.label.toLowerCase()} at{' '}
              {statusSummary(healthy[0])}.
            </Typography>
          )}

          {healthy.length > 0 && (
            <>
              <Button
                size="small"
                onClick={() => setShowAll((v) => !v)}
                sx={{ mt: 1, textTransform: 'none' }}
              >
                {showAll ? 'Hide' : `Show ${healthy.length} more tracked item${healthy.length === 1 ? '' : 's'}`}
              </Button>
              <Collapse in={showAll} unmountOnExit>
                <Stack divider={<Divider flexItem />} sx={{ mt: 0.5 }}>
                  {healthy.map((s) => (
                    <StatusRow key={s.item.key} status={s} />
                  ))}
                </Stack>
              </Collapse>
            </>
          )}
        </>
      )}

      {never.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Button
            size="small"
            color="inherit"
            onClick={() => setShowNever((v) => !v)}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            {showNever ? 'Hide' : `${never.length} item${never.length === 1 ? '' : 's'} never logged`}
          </Button>
          <Collapse in={showNever} unmountOnExit>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, mt: 1 }}>
              {never.map((s) => (
                <Tooltip key={s.item.key} title={s.item.hint ?? ''} enterDelay={600}>
                  <Chip size="small" variant="outlined" label={s.item.label} />
                </Tooltip>
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Tick these in a service once you know when they were last done — tracking starts from
              that reading.
            </Typography>
          </Collapse>
        </>
      )}
    </Card>
  )
}

export default MaintenanceCard
