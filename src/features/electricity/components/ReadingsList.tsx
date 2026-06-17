import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import type { Reading } from '../types'
import { formatShort } from '../utils/date'

interface ReadingsListProps {
  readings: Reading[]
  onDelete: (id: string) => void
}

function ReadingsList({ readings, onDelete }: ReadingsListProps) {
  if (readings.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No readings yet. Tap “Add reading”.</Typography>
      </Box>
    )
  }

  // Newest first, with delta vs the chronologically previous reading.
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date))
  const rows = sorted
    .map((r, i) => ({ reading: r, delta: i > 0 ? r.value - sorted[i - 1].value : null }))
    .reverse()

  return (
    <List disablePadding>
      {rows.map(({ reading, delta }) => (
        <ListItem
          key={reading.id}
          divider
          secondaryAction={
            <IconButton edge="end" aria-label="delete" onClick={() => onDelete(reading.id)}>
              <DeleteOutlineIcon />
            </IconButton>
          }
        >
          <ListItemText
            primary={
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {reading.value} units
                {delta != null && (
                  <Typography
                    component="span"
                    variant="body2"
                    color={delta >= 0 ? 'text.secondary' : 'error.main'}
                    sx={{ ml: 1 }}
                  >
                    ({delta >= 0 ? '+' : ''}
                    {delta})
                  </Typography>
                )}
              </Typography>
            }
            secondary={[formatShort(reading.date), reading.note].filter(Boolean).join(' · ')}
          />
        </ListItem>
      ))}
    </List>
  )
}

export default ReadingsList
