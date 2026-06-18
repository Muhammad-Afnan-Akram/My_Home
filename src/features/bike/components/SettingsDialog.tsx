import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import InputAdornment from '@mui/material/InputAdornment'

interface SettingsDialogProps {
  open: boolean
  /** Current default tuning interval in km (0 = not tracked). */
  tuningIntervalKm: number
  onClose: () => void
  onSave: (km: number) => void
}

const DEFAULT_INTERVAL = '1000'

/** Edit the default tuning interval (km) applied to every bike. */
function SettingsDialog({ open, tuningIntervalKm, onClose, onSave }: SettingsDialogProps) {
  const [enabled, setEnabled] = useState(tuningIntervalKm > 0)
  const [value, setValue] = useState(
    tuningIntervalKm > 0 ? String(tuningIntervalKm) : DEFAULT_INTERVAL,
  )

  const numeric = Number(value)
  const valueValid = value.trim().length > 0 && Number.isFinite(numeric) && numeric > 0
  // When tracking is disabled the number field doesn't need to be valid.
  const canSave = !enabled || valueValid

  const handleSave = () => {
    if (!canSave) return
    onSave(enabled ? numeric : 0)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Bike settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            The tuning interval applies to every bike. We'll flag a bike as due once it's been
            ridden this far since its last tuning, or turn it off to just log tunings.
          </Typography>
          <FormControlLabel
            control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
            label="Track a tuning interval"
          />
          {enabled && (
            <TextField
              label="Tuning interval"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              fullWidth
              autoFocus
              inputMode="numeric"
              error={value.trim().length > 0 && !valueValid}
              helperText="Common interval is every 1,000 km"
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">km</InputAdornment>,
                },
              }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SettingsDialog
