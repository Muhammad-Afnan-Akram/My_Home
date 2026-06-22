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
  /** Current default oil-change interval in km (0 = not tracked). */
  oilChangeIntervalKm: number
  onClose: () => void
  onSave: (km: number) => void
}

const DEFAULT_INTERVAL = '5000'

/** Edit the default oil-change interval (km) applied to every car. */
function SettingsDialog({ open, oilChangeIntervalKm, onClose, onSave }: SettingsDialogProps) {
  const [enabled, setEnabled] = useState(oilChangeIntervalKm > 0)
  const [value, setValue] = useState(
    oilChangeIntervalKm > 0 ? String(oilChangeIntervalKm) : DEFAULT_INTERVAL,
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
      <DialogTitle>Car settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            The oil-change interval applies to every car. We'll flag a car as due once it's been
            driven this far since its last oil change, or turn it off to just log services.
          </Typography>
          <FormControlLabel
            control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
            label="Track an oil-change interval"
          />
          {enabled && (
            <TextField
              label="Oil-change interval"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              fullWidth
              autoFocus
              inputMode="numeric"
              error={value.trim().length > 0 && !valueValid}
              helperText="Mineral ~3,000 km · Synthetic ~5,000–10,000 km"
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
