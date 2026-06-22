import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined'
import type { Car, CarService } from '../types'
import {
  effectiveInterval,
  formatDate,
  formatKm,
  formatRs,
  lastOilChangeReading,
  serviceStatus,
  sortServicesByDate,
} from '../utils/format'
import ServiceGauge from './ServiceGauge'

const ACCENT = '#3b82f6'

interface CarCardProps {
  car: Car
  /** This car's services (already filtered), most recent first. */
  services: CarService[]
  /** Default distance (km) between oil changes; 0 = not tracked. */
  oilChangeIntervalKm: number
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
}

function CarCard({
  car,
  services,
  oilChangeIntervalKm,
  onClick,
  onEdit,
  onDelete,
  onReport,
}: CarCardProps) {
  const sorted = sortServicesByDate(services)
  const lastService = sorted[0]
  const lastOil = lastOilChangeReading(sorted)
  const interval = effectiveInterval(car, oilChangeIntervalKm)
  const status = serviceStatus(interval, car.currentMeter, lastOil)
  const totalSpent = services.reduce((sum, s) => sum + s.cost, 0)

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'box-shadow .2s, transform .2s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        // Coloured rail on the left edge that reflects oil-change urgency.
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
          {car.imageUrl ? (
            <Box
              component="img"
              src={car.imageUrl}
              alt={`${car.make} ${car.model}`}
              sx={{ width: 88, height: 88, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <ServiceGauge status={status} size={88} />
          )}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <DirectionsCarIcon fontSize="small" sx={{ color: ACCENT }} />
              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                {car.make} {car.model}
              </Typography>
            </Stack>

            {(car.variant || car.year) && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {[car.year, car.variant].filter(Boolean).join(' · ')}
              </Typography>
            )}

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 0.5, alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
            >
              <Chip size="small" variant="outlined" label={car.registrationNumber} />
              {car.color && (
                <Typography variant="caption" color="text.secondary">
                  {car.color}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {formatKm(car.currentMeter)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ mt: 1, alignItems: 'center' }}>
              <BuildOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {lastService
                  ? `Last service ${formatDate(lastService.date)}`
                  : 'No service recorded yet'}
              </Typography>
            </Stack>

            {status?.overdue && (
              <Chip size="small" color="warning" label="Oil change due" sx={{ mt: 1, fontWeight: 600 }} />
            )}
          </Box>
        </Stack>
      </CardActionArea>

      <Divider />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 1.5, py: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {services.length} service{services.length === 1 ? '' : 's'}
        </Typography>
        {totalSpent > 0 && (
          <Typography variant="caption" color="text.secondary">
            · {formatRs(totalSpent)}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Service report">
          <IconButton size="small" aria-label="report" onClick={onReport} sx={{ color: ACCENT }}>
            <SummarizeOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit car">
          <IconButton size="small" aria-label="edit" onClick={onEdit}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete car">
          <IconButton size="small" aria-label="delete" onClick={onDelete} color="error">
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Card>
  )
}

export default CarCard
