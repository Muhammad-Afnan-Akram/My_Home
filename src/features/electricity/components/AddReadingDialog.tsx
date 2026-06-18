import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import type { NewReading } from '../data'
import { todayISO } from '../utils/date'

interface AddReadingDialogProps {
  open: boolean
  meterId: string
  /** Most recent reading value, to validate the new one isn't lower. */
  lastValue?: number | null
  onClose: () => void
  onSubmit: (input: NewReading) => Promise<void> | void
}

function AddReadingDialog({ open, meterId, lastValue, onClose, onSubmit }: AddReadingDialogProps) {
  const [date, setDate] = useState(todayISO())
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const numeric = Number(value)
  const hasValue = value.trim().length > 0 && !Number.isNaN(numeric)
  const lowerThanLast = hasValue && lastValue != null && numeric < lastValue

  const handleSave = async () => {
    if (!hasValue) return
    setSaving(true)
    try {
      await onSubmit({ meterId, date, value: numeric, note: note.trim() || undefined })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add reading</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Meter reading (units)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            fullWidth
            autoFocus
            inputMode="decimal"
            helperText={lastValue != null ? `Last reading: ${lastValue}` : undefined}
          />
          {lowerThanLast && (
            <Alert severity="warning">
              This is lower than the last reading ({lastValue}). Saved as-is — check for a typo.
            </Alert>
          )}
          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!hasValue || saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddReadingDialog
