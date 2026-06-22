import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import InputAdornment from '@mui/material/InputAdornment'

interface UpdateMeterDialogProps {
  open: boolean
  /** The car's last known odometer reading (km). */
  currentMeter: number
  onClose: () => void
  onSubmit: (km: number) => Promise<void> | void
}

/**
 * Quick way to bump a car's odometer without logging a service, so the
 * "distance since last oil change" / "due" figures stay current.
 */
function UpdateMeterDialog({ open, currentMeter, onClose, onSubmit }: UpdateMeterDialogProps) {
  const [value, setValue] = useState(currentMeter > 0 ? String(currentMeter) : '')
  const [saving, setSaving] = useState(false)

  const numeric = Number(value)
  const valid = value.trim().length > 0 && Number.isFinite(numeric) && numeric >= 0
  const lowerThanCurrent = valid && numeric < currentMeter

  const handleSave = async () => {
    if (!valid) return
    setSaving(true)
    try {
      await onSubmit(numeric)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>Update meter reading</DialogTitle>
      {saving && <LinearProgress />}
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Enter the car's latest odometer reading to refresh how far it's been driven since the
            last oil change.
          </Typography>
          <TextField
            label="Current meter reading"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            fullWidth
            autoFocus
            inputMode="numeric"
            error={value.trim().length > 0 && !valid}
            helperText={currentMeter > 0 ? `Last known: ${currentMeter.toLocaleString()} km` : undefined}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">km</InputAdornment>,
              },
            }}
          />
          {lowerThanCurrent && (
            <Alert severity="warning">
              This is lower than the last reading ({currentMeter.toLocaleString()} km). Saved as-is —
              check for a typo.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!valid || saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UpdateMeterDialog
