import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import type { DiscoCode, Meter } from '../types'
import { DISCOS } from '../types'
import type { NewMeter } from '../data'
import { billUrlFor } from '../utils/billing'

interface MeterFormDialogProps {
  open: boolean
  initial?: Meter
  /** Global protected-slab limit applied to every meter (stored on save). */
  unitLimit: number
  onClose: () => void
  onSubmit: (values: NewMeter) => Promise<unknown> | void
}

const EMPTY = {
  name: '',
  company: 'mepco' as DiscoCode,
  referenceNumber: '',
  cycleStartDay: '1',
}

/** Build the form's initial values from a meter (or blanks for a new one). */
function formFromMeter(initial?: Meter): typeof EMPTY {
  return initial
    ? {
        name: initial.name,
        company: initial.company,
        referenceNumber: initial.referenceNumber,
        cycleStartDay: String(initial.cycleStartDay),
      }
    : EMPTY
}

function MeterFormDialog({ open, initial, unitLimit, onClose, onSubmit }: MeterFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [form, setForm] = useState(() => formFromMeter(initial))
  const [saving, setSaving] = useState(false)

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const refTrimmed = form.referenceNumber.trim()
  const valid = form.name.trim().length > 0 && refTrimmed.length > 0

  const handleSave = async () => {
    if (!valid) return
    setSaving(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        company: form.company,
        referenceNumber: refTrimmed,
        cycleStartDay: Math.min(28, Math.max(1, Number(form.cycleStartDay) || 1)),
        unitLimit,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Edit meter' : 'Add meter'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            placeholder="e.g. Main, Annexe, Shop"
            value={form.name}
            onChange={set('name')}
            fullWidth
            autoFocus
          />
          <TextField select label="Company (DISCO)" value={form.company} onChange={set('company')} fullWidth>
            {DISCOS.map((d) => (
              <MenuItem key={d.code} value={d.code}>
                {d.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Reference / consumer number"
            value={form.referenceNumber}
            onChange={set('referenceNumber')}
            fullWidth
            inputMode="numeric"
          />
          <TextField
            label="Billing cycle start day"
            helperText="1–28 (from your bill)"
            value={form.cycleStartDay}
            onChange={set('cycleStartDay')}
            fullWidth
            inputMode="numeric"
          />
          {refTrimmed && (
            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              Bill URL: {billUrlFor(form.company, refTrimmed)}
            </Typography>
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

export default MeterFormDialog
