import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import type { Bike } from '../types'
import { BIKE_BRANDS, OTHER, modelsForBrand } from '../types'
import type { NewBike } from '../data'

interface BikeFormDialogProps {
  open: boolean
  initial?: Bike
  onClose: () => void
  onSubmit: (values: NewBike) => Promise<unknown> | void
}

/** Build form state from an existing bike, resolving brand/model to the
 *  dropdown sentinel + free-text fields when they aren't in the catalog. */
function formFromBike(initial?: Bike) {
  if (!initial) {
    return {
      company: '',
      companyOther: '',
      model: '',
      modelOther: '',
      registrationNumber: '',
      currentMeter: '',
    }
  }
  const brandKnown = BIKE_BRANDS.some((b) => b.name === initial.company)
  const modelKnown = brandKnown && modelsForBrand(initial.company).includes(initial.model)
  return {
    company: brandKnown ? initial.company : OTHER,
    companyOther: brandKnown ? '' : initial.company,
    model: modelKnown ? initial.model : OTHER,
    modelOther: modelKnown ? '' : initial.model,
    registrationNumber: initial.registrationNumber,
    currentMeter: String(initial.currentMeter ?? ''),
  }
}

function BikeFormDialog({ open, initial, onClose, onSubmit }: BikeFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [form, setForm] = useState(() => formFromBike(initial))
  const [saving, setSaving] = useState(false)

  // Resolve the chosen company/model to their final string values.
  const company = form.company === OTHER ? form.companyOther.trim() : form.company
  const model = form.model === OTHER ? form.modelOther.trim() : form.model
  const models = modelsForBrand(form.company)

  const valid =
    company.length > 0 && model.length > 0 && form.registrationNumber.trim().length > 0

  const handleBrandChange = (value: string) =>
    // Reset the model whenever the brand changes so a stale model isn't kept.
    setForm((f) => ({ ...f, company: value, model: '', modelOther: '' }))

  const handleSave = async () => {
    if (!valid) return
    setSaving(true)
    try {
      const meter = Number(form.currentMeter)
      await onSubmit({
        company,
        model,
        registrationNumber: form.registrationNumber.trim(),
        currentMeter: Number.isFinite(meter) && meter > 0 ? meter : 0,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Edit bike' : 'Add bike'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            select
            label="Company"
            value={form.company}
            onChange={(e) => handleBrandChange(e.target.value)}
            fullWidth
          >
            {BIKE_BRANDS.map((b) => (
              <MenuItem key={b.name} value={b.name}>
                {b.name}
              </MenuItem>
            ))}
            <MenuItem value={OTHER}>Other…</MenuItem>
          </TextField>

          {form.company === OTHER && (
            <TextField
              label="Company name"
              value={form.companyOther}
              onChange={(e) => setForm((f) => ({ ...f, companyOther: e.target.value }))}
              fullWidth
              autoFocus
            />
          )}

          {/* Model dropdown is driven by the chosen brand. */}
          <TextField
            select
            label="Model"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            fullWidth
            disabled={!form.company}
            helperText={!form.company ? 'Pick a company first' : undefined}
          >
            {models.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
            <MenuItem value={OTHER}>Other…</MenuItem>
          </TextField>

          {form.model === OTHER && (
            <TextField
              label="Model name"
              value={form.modelOther}
              onChange={(e) => setForm((f) => ({ ...f, modelOther: e.target.value }))}
              fullWidth
            />
          )}

          <TextField
            label="Registration number"
            placeholder="e.g. LEB-1234"
            value={form.registrationNumber}
            onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
            fullWidth
          />

          <TextField
            label="Current meter reading (km)"
            value={form.currentMeter}
            onChange={(e) => setForm((f) => ({ ...f, currentMeter: e.target.value }))}
            fullWidth
            inputMode="numeric"
            helperText="Optional — current odometer reading"
          />
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

export default BikeFormDialog
