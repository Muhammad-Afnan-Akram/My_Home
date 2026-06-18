import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import type { Bike, Tuning } from '../types'
import { formatDate, formatKm, formatRs, tuningStatus } from '../utils/format'
import TuningGauge from './TuningGauge'

/** Emerald accent that signs the bike module across the app. */
const ACCENT = '#10b981'

interface BikeCardProps {
  bike: Bike
  /** This bike's tunings (already filtered), most recent first. */
  tunings: Tuning[]
  /** Default distance (km) between tunings; 0 = not tracked. */
  tuningIntervalKm: number
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

function BikeCard({ bike, tunings, tuningIntervalKm, onClick, onEdit, onDelete }: BikeCardProps) {
  const lastTuning = tunings[0]
  const sinceLast =
    lastTuning != null ? Math.max(0, bike.currentMeter - lastTuning.meterReading) : null
  const status = tuningStatus(tuningIntervalKm, bike.currentMeter, lastTuning?.meterReading ?? null)
  const totalSpent = tunings.reduce((sum, t) => sum + t.cost, 0)

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'box-shadow .2s, transform .2s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        // Coloured rail on the left edge that reflects tuning urgency.
        borderLeft: '4px solid',
        borderLeftColor: status
          ? status.overdue
            ? 'error.main'
            : status.level === 'warning'
              ? 'warning.main'
              : ACCENT
          : ACCENT,
      }}
    >
      <CardActionArea onClick={onClick} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <TuningGauge status={status} size={88} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <TwoWheelerIcon fontSize="small" sx={{ color: ACCENT }} />
              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                {bike.company} {bike.model}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 0.5, alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
            >
              <Chip size="small" variant="outlined" label={bike.registrationNumber} />
              <Typography variant="caption" color="text.secondary">
                {formatKm(bike.currentMeter)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ mt: 1, alignItems: 'center' }}>
              <BuildOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {lastTuning
                  ? `Last tuning ${formatDate(lastTuning.date)}${
                      sinceLast != null ? ` · ${formatKm(sinceLast)} ago` : ''
                    }`
                  : 'No tuning recorded yet'}
              </Typography>
            </Stack>

            {status?.overdue && (
              <Chip
                size="small"
                color="warning"
                label="Tuning due"
                sx={{ mt: 1, fontWeight: 600 }}
              />
            )}
          </Box>
        </Stack>
      </CardActionArea>

      <Divider />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 1.5, py: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {tunings.length} tuning{tunings.length === 1 ? '' : 's'}
        </Typography>
        {totalSpent > 0 && (
          <Typography variant="caption" color="text.secondary">
            · {formatRs(totalSpent)}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Edit bike">
          <IconButton size="small" aria-label="edit" onClick={onEdit}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete bike">
          <IconButton size="small" aria-label="delete" onClick={onDelete} color="error">
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Card>
  )
}

export default BikeCard
