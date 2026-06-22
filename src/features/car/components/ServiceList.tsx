import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import type { CarService } from '../types'
import { serviceTypeMeta } from '../types'
import { formatDate, formatKm, formatRs, summarizeParts } from '../utils/format'

interface ServiceListProps {
  /** Services for one car, most recent first. */
  services: CarService[]
  onDelete: (service: CarService) => void
}

function ServiceList({ services, onDelete }: ServiceListProps) {
  if (services.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        No services yet. Tap “Add service” to record one.
      </Typography>
    )
  }

  return (
    <List disablePadding>
      {services.map((s) => {
        const meta = serviceTypeMeta(s.type)
        const parts = summarizeParts(s)
        return (
          <ListItem
            key={s.id}
            divider
            disableGutters
            sx={{ alignItems: 'flex-start', py: 1.5 }}
            secondaryAction={
              <Tooltip title="Delete service">
                <IconButton
                  edge="end"
                  aria-label="delete service"
                  onClick={() => onDelete(s)}
                  color="error"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            <Box sx={{ minWidth: 0, flex: 1, pr: 5 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
              >
                <Chip
                  size="small"
                  label={meta.label}
                  sx={{ bgcolor: `${meta.color}1f`, color: meta.color, fontWeight: 600 }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {formatDate(s.date)}
                </Typography>
                <Chip size="small" variant="outlined" label={formatKm(s.meterReading)} />
                {s.cost > 0 && (
                  <Chip size="small" color="primary" variant="outlined" label={formatRs(s.cost)} />
                )}
              </Stack>
              {parts && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {parts}
                </Typography>
              )}
              {s.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                >
                  {s.description}
                </Typography>
              )}
            </Box>
          </ListItem>
        )
      })}
    </List>
  )
}

export default ServiceList
