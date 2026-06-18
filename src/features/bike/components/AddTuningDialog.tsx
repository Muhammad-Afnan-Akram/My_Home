import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import type { NewTuning } from '../data'
import { todayISO } from '../utils/format'

interface AddTuningDialogProps {
  open: boolean
  bikeId: string
  /** Bike's current odometer, used as the default meter reading. */
  currentMeter: number
  onClose: () => void
  onSubmit: (input: NewTuning) => Promise<void> | void
}

function AddTuningDialog({ open, bikeId, currentMeter, onClose, onSubmit }: AddTuningDialogProps) {
  const [date, setDate] = useState(todayISO())
  const [meter, setMeter] = useState(currentMeter > 0 ? String(currentMeter) : '')
  const [cost, setCost] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const meterNum = Number(meter)
  const hasMeter = meter.trim().length > 0 && !Number.isNaN(meterNum)
  const lowerThanCurrent = hasMeter && currentMeter > 0 && meterNum < currentMeter

  const handleSave = async () => {
    if (!hasMeter) return
    setSaving(true)
    try {
      const costNum = Number(cost)
      await onSubmit({
        bikeId,
        date,
        meterReading: meterNum,
        cost: Number.isFinite(costNum) && costNum > 0 ? costNum : 0,
        description: description.trim() || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add tuning</DialogTitle>
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
            label="Current meter reading (km)"
            value={meter}
            onChange={(e) => setMeter(e.target.value)}
            fullWidth
            autoFocus
            inputMode="numeric"
            helperText={currentMeter > 0 ? `Last known: ${currentMeter.toLocaleString()} km` : undefined}
          />
          {lowerThanCurrent && (
            <Alert severity="warning">
              This is lower than the last reading ({currentMeter.toLocaleString()} km). Saved as-is —
              check for a typo.
            </Alert>
          )}
          <TextField
            label="Tuning cost (Rs)"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            fullWidth
            inputMode="numeric"
          />
          <TextField
            label="Description"
            placeholder="e.g. Oil change, carburetor cleaning"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!hasMeter || saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddTuningDialog
