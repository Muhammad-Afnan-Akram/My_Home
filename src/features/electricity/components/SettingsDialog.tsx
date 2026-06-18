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
  /** Current global unit limit (0 = no slab). */
  unitLimit: number
  onClose: () => void
  onSave: (limit: number) => void
}

const DEFAULT_LIMIT = '200'

/** Edit the global protected-slab unit limit applied to every meter. */
function SettingsDialog({ open, unitLimit, onClose, onSave }: SettingsDialogProps) {
  const [enabled, setEnabled] = useState(unitLimit > 0)
  const [value, setValue] = useState(unitLimit > 0 ? String(unitLimit) : DEFAULT_LIMIT)

  const numeric = Number(value)
  const valueValid = value.trim().length > 0 && Number.isFinite(numeric) && numeric > 0
  // When the limit is disabled the number field doesn't need to be valid.
  const canSave = !enabled || valueValid

  const handleSave = () => {
    if (!canSave) return
    onSave(enabled ? numeric : 0)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Electricity settings</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            The protected-slab limit applies to every meter. Stay under it to keep the cheaper
            tariff, or turn it off to just track usage.
          </Typography>
          <FormControlLabel
            control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
            label="Track against a unit limit"
          />
          {enabled && (
            <TextField
              label="Unit limit"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              fullWidth
              autoFocus
              inputMode="numeric"
              error={value.trim().length > 0 && !valueValid}
              helperText="Common protected slab is 200 units"
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">units</InputAdornment>,
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
