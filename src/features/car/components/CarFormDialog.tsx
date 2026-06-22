import { useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import AddAPhotoOutlinedIcon from '@mui/icons-material/AddAPhotoOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import type { Car } from '../types'
import { CAR_COLORS, CAR_MAKES, OTHER, modelsForMake, variantsFor } from '../types'
import type { NewCar } from '../data'
import { fileToResizedDataUrl } from '../utils/image'

const ACCENT = '#3b82f6'

interface CarFormDialogProps {
  open: boolean
  initial?: Car
  /** Global default oil-change interval (km), shown as the fallback hint. */
  defaultIntervalKm: number
  onClose: () => void
  onSubmit: (values: NewCar) => Promise<unknown> | void
}

/** Build form state from an existing car, resolving make/model/variant to the
 *  dropdown sentinel + free-text fields when they aren't in the catalog. */
function formFromCar(initial?: Car) {
  if (!initial) {
    return {
      make: '',
      makeOther: '',
      model: '',
      modelOther: '',
      variant: '',
      variantOther: '',
      year: '',
      serviceIntervalKm: '',
      color: '',
      imageUrl: '',
      registrationNumber: '',
      currentMeter: '',
    }
  }
  const makeKnown = CAR_MAKES.some((m) => m.name === initial.make)
  const modelKnown = makeKnown && modelsForMake(initial.make).some((m) => m.name === initial.model)
  const variantKnown = modelKnown && variantsFor(initial.make, initial.model).includes(initial.variant)
  return {
    make: makeKnown ? initial.make : OTHER,
    makeOther: makeKnown ? '' : initial.make,
    model: modelKnown ? initial.model : OTHER,
    modelOther: modelKnown ? '' : initial.model,
    variant: variantKnown ? initial.variant : initial.variant ? OTHER : '',
    variantOther: variantKnown ? '' : initial.variant,
    year: initial.year ? String(initial.year) : '',
    serviceIntervalKm: initial.serviceIntervalKm ? String(initial.serviceIntervalKm) : '',
    color: initial.color ?? '',
    imageUrl: initial.imageUrl ?? '',
    registrationNumber: initial.registrationNumber,
    currentMeter: String(initial.currentMeter ?? ''),
  }
}

function CarFormDialog({ open, initial, defaultIntervalKm, onClose, onSubmit }: CarFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const fileInput = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(() => formFromCar(initial))
  const [saving, setSaving] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  // Years offered in the dropdown: current year down to 1980.
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i)

  // Resolve the chosen make/model/variant to their final string values.
  const make = form.make === OTHER ? form.makeOther.trim() : form.make
  const model = form.model === OTHER ? form.modelOther.trim() : form.model
  const variant = form.variant === OTHER ? form.variantOther.trim() : form.variant
  const models = modelsForMake(form.make)
  const variants = variantsFor(form.make, form.model)

  const valid =
    make.length > 0 && model.length > 0 && form.registrationNumber.trim().length > 0

  const handleMakeChange = (value: string) =>
    // Reset model + variant whenever the make changes so stale values aren't kept.
    setForm((f) => ({ ...f, make: value, model: '', modelOther: '', variant: '', variantOther: '' }))

  const handleModelChange = (value: string) =>
    setForm((f) => ({ ...f, model: value, variant: '', variantOther: '' }))

  const handlePickImage = async (file?: File) => {
    if (!file) return
    setImageError(null)
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      setForm((f) => ({ ...f, imageUrl: dataUrl }))
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not load the image.')
    }
  }

  const handleSave = async () => {
    if (!valid) return
    setSaving(true)
    try {
      const meter = Number(form.currentMeter)
      const year = Number(form.year)
      const interval = Number(form.serviceIntervalKm)
      await onSubmit({
        make,
        model,
        variant,
        year: Number.isFinite(year) && year > 0 ? year : undefined,
        serviceIntervalKm: Number.isFinite(interval) && interval > 0 ? interval : undefined,
        color: form.color.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
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
      <DialogTitle>{initial ? 'Edit car' : 'Add car'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Photo picker */}
          <Box>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void handlePickImage(e.target.files?.[0])
                e.target.value = '' // allow re-picking the same file
              }}
            />
            {form.imageUrl ? (
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={form.imageUrl}
                  alt="Car"
                  sx={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 2,
                    display: 'block',
                  }}
                />
                <IconButton
                  aria-label="remove photo"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.55)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  }}
                  size="small"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Button
                onClick={() => fileInput.current?.click()}
                startIcon={<AddAPhotoOutlinedIcon />}
                fullWidth
                variant="outlined"
                sx={{
                  height: 96,
                  borderStyle: 'dashed',
                  color: 'text.secondary',
                  borderColor: 'divider',
                }}
              >
                Add photo (optional)
              </Button>
            )}
            {imageError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {imageError}
              </Alert>
            )}
          </Box>

          {/* Make */}
          <TextField
            select
            label="Make"
            value={form.make}
            onChange={(e) => handleMakeChange(e.target.value)}
            fullWidth
          >
            {CAR_MAKES.map((m) => (
              <MenuItem key={m.name} value={m.name}>
                {m.name}
              </MenuItem>
            ))}
            <MenuItem value={OTHER}>Other…</MenuItem>
          </TextField>
          {form.make === OTHER && (
            <TextField
              label="Make name"
              value={form.makeOther}
              onChange={(e) => setForm((f) => ({ ...f, makeOther: e.target.value }))}
              fullWidth
              autoFocus
            />
          )}

          {/* Model — driven by the chosen make */}
          <TextField
            select
            label="Model"
            value={form.model}
            onChange={(e) => handleModelChange(e.target.value)}
            fullWidth
            disabled={!form.make}
            helperText={!form.make ? 'Pick a make first' : undefined}
          >
            {models.map((m) => (
              <MenuItem key={m.name} value={m.name}>
                {m.name}
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

          {/* Variant — driven by the chosen model */}
          <TextField
            select
            label="Variant"
            value={form.variant}
            onChange={(e) => setForm((f) => ({ ...f, variant: e.target.value }))}
            fullWidth
            disabled={!form.model}
            helperText={!form.model ? 'Pick a model first' : 'Trim / engine, optional'}
          >
            {variants.map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
            <MenuItem value={OTHER}>Other…</MenuItem>
          </TextField>
          {form.variant === OTHER && (
            <TextField
              label="Variant name"
              value={form.variantOther}
              onChange={(e) => setForm((f) => ({ ...f, variantOther: e.target.value }))}
              fullWidth
            />
          )}

          {/* Make year */}
          <TextField
            select
            label="Year"
            value={form.year}
            onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
            fullWidth
            helperText="Make / model year, optional"
          >
            <MenuItem value="">
              <em>Not set</em>
            </MenuItem>
            {years.map((y) => (
              <MenuItem key={y} value={String(y)}>
                {y}
              </MenuItem>
            ))}
          </TextField>

          {/* Colour — free text with suggestions */}
          <Autocomplete
            freeSolo
            options={CAR_COLORS}
            value={form.color}
            onChange={(_, value) => setForm((f) => ({ ...f, color: value ?? '' }))}
            onInputChange={(_, value) => setForm((f) => ({ ...f, color: value }))}
            renderInput={(params) => (
              <TextField {...params} label="Colour" helperText="Optional" fullWidth />
            )}
          />

          <TextField
            label="Registration number"
            placeholder="e.g. LEA-1234"
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

          <TextField
            label="Oil-change interval (km)"
            value={form.serviceIntervalKm}
            onChange={(e) => setForm((f) => ({ ...f, serviceIntervalKm: e.target.value }))}
            fullWidth
            inputMode="numeric"
            placeholder={String(defaultIntervalKm)}
            helperText={`How often this car needs an oil change. Leave blank to use the default (${defaultIntervalKm.toLocaleString()} km).`}
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">km</InputAdornment>,
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!valid || saving}
          sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#2f6fd1' } }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CarFormDialog
