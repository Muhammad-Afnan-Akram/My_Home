import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import type { Tuning } from '../types'
import { formatDate, formatKm, formatRs } from '../utils/format'

interface TuningListProps {
  /** Tunings for one bike, most recent first. */
  tunings: Tuning[]
  onDelete: (tuning: Tuning) => void
}

function TuningList({ tunings, onDelete }: TuningListProps) {
  if (tunings.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        No tunings yet. Tap “Add tuning” to record one.
      </Typography>
    )
  }

  return (
    <List disablePadding>
      {tunings.map((t) => (
        <ListItem
          key={t.id}
          divider
          disableGutters
          sx={{ alignItems: 'flex-start', py: 1.5 }}
          secondaryAction={
            <Tooltip title="Delete tuning">
              <IconButton edge="end" aria-label="delete tuning" onClick={() => onDelete(t)} color="error">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        >
          <Box sx={{ minWidth: 0, flex: 1, pr: 5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {formatDate(t.date)}
              </Typography>
              <Chip size="small" variant="outlined" label={formatKm(t.meterReading)} />
              {t.cost > 0 && <Chip size="small" color="primary" variant="outlined" label={formatRs(t.cost)} />}
            </Stack>
            {t.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {t.description}
              </Typography>
            )}
          </Box>
        </ListItem>
      ))}
    </List>
  )
}

export default TuningList
