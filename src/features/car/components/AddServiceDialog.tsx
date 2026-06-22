import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Collapse from '@mui/material/Collapse'
import LinearProgress from '@mui/material/LinearProgress'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import type { NewCarService } from '../data'
import type { CarService, ServiceType } from '../types'
import { OIL_BRANDS, OIL_GRADES, SERVICE_TYPES } from '../types'
import { todayISO } from '../utils/format'
import SelectWithOther from './SelectWithOther'

const ACCENT = '#3b82f6'

interface AddServiceDialogProps {
  open: boolean
  carId: string
  /** Car's current odometer, used as the default meter reading. */
  currentMeter: number
  /** When provided, the dialog edits this service instead of adding one. */
  initial?: CarService
  onClose: () => void
  onSubmit: (input: NewCarService) => Promise<void> | void
}

/** A small toggleable chip used for the "filters replaced" picker. */
function FilterChip({
  label,
  selected,
  onToggle,
}: {
  label: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <Chip
      label={label}
      onClick={onToggle}
      color={selected ? 'primary' : 'default'}
      variant={selected ? 'filled' : 'outlined'}
      sx={{ fontWeight: selected ? 600 : 400 }}
    />
  )
}

function AddServiceDialog({
  open,
  carId,
  currentMeter,
  initial,
  onClose,
  onSubmit,
}: AddServiceDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [type, setType] = useState<ServiceType>(initial?.type ?? 'routine')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [meter, setMeter] = useState(
    initial ? String(initial.meterReading) : currentMeter > 0 ? String(currentMeter) : '',
  )
  const [cost, setCost] = useState(initial?.cost ? String(initial.cost) : '')
  const [description, setDescription] = useState(initial?.description ?? '')

  const [oilChanged, setOilChanged] = useState(initial?.oilChanged ?? false)
  const [oilBrand, setOilBrand] = useState(initial?.oilBrand ?? '')
  const [oilGrade, setOilGrade] = useState(initial?.oilGrade ?? '')
  const [oilLiters, setOilLiters] = useState(initial?.oilLiters ? String(initial.oilLiters) : '')
  const [oilFilter, setOilFilter] = useState(initial?.oilFilterChanged ?? false)
  const [airFilter, setAirFilter] = useState(initial?.airFilterChanged ?? false)
  const [fuelFilter, setFuelFilter] = useState(initial?.fuelFilterChanged ?? false)
  const [acFilter, setAcFilter] = useState(initial?.acFilterChanged ?? false)
  const [coolant, setCoolant] = useState(initial?.coolantChanged ?? false)

  const [saving, setSaving] = useState(false)

  const meterNum = Number(meter)
  const hasMeter = meter.trim().length > 0 && !Number.isNaN(meterNum)
  const lowerThanCurrent = hasMeter && currentMeter > 0 && meterNum < currentMeter

  const handleSave = async () => {
    if (!hasMeter) return
    setSaving(true)
    try {
      const costNum = Number(cost)
      const litersNum = Number(oilLiters)
      await onSubmit({
        carId,
        date,
        meterReading: meterNum,
        type,
        cost: Number.isFinite(costNum) && costNum > 0 ? costNum : 0,
        oilChanged,
        oilBrand: oilChanged && oilBrand.trim() ? oilBrand.trim() : undefined,
        oilGrade: oilChanged && oilGrade.trim() ? oilGrade.trim() : undefined,
        oilLiters:
          oilChanged && Number.isFinite(litersNum) && litersNum > 0 ? litersNum : undefined,
        oilFilterChanged: oilFilter,
        airFilterChanged: airFilter,
        fuelFilterChanged: fuelFilter,
        acFilterChanged: acFilter,
        coolantChanged: coolant,
        description: description.trim() || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Edit service' : 'Add service'}</DialogTitle>
      {saving && <LinearProgress />}
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Type */}
          <ToggleButtonGroup
            value={type}
            exclusive
            fullWidth
            onChange={(_, v) => v && setType(v as ServiceType)}
            size="small"
          >
            {SERVICE_TYPES.map((t) => (
              <ToggleButton key={t.value} value={t.value} sx={{ textTransform: 'none' }}>
                {t.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Meter (km)"
              value={meter}
              onChange={(e) => setMeter(e.target.value)}
              fullWidth
              inputMode="numeric"
            />
          </Stack>
          {lowerThanCurrent && (
            <Alert severity="warning">
              This is lower than the last reading ({currentMeter.toLocaleString()} km). Saved as-is —
              check for a typo.
            </Alert>
          )}

          {/* Parts replaced */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Engine oil
            </Typography>
            <FormControlLabel
              control={
                <Switch checked={oilChanged} onChange={(e) => setOilChanged(e.target.checked)} />
              }
              label="Oil changed"
            />
            <Collapse in={oilChanged} unmountOnExit>
              <Stack spacing={2} sx={{ mt: 1, pl: 0.5 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <SelectWithOther
                      label="Oil brand"
                      value={oilBrand}
                      onChange={setOilBrand}
                      options={OIL_BRANDS}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <SelectWithOther
                      label="Grade"
                      value={oilGrade}
                      onChange={setOilGrade}
                      options={OIL_GRADES}
                    />
                  </Box>
                </Stack>
                <TextField
                  label="Quantity"
                  value={oilLiters}
                  onChange={(e) => setOilLiters(e.target.value)}
                  inputMode="decimal"
                  sx={{ maxWidth: 180 }}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">litres</InputAdornment>,
                    },
                  }}
                />
              </Stack>
            </Collapse>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Filters replaced
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <FilterChip label="Oil filter" selected={oilFilter} onToggle={() => setOilFilter((v) => !v)} />
              <FilterChip label="Air filter" selected={airFilter} onToggle={() => setAirFilter((v) => !v)} />
              <FilterChip label="Fuel filter" selected={fuelFilter} onToggle={() => setFuelFilter((v) => !v)} />
              <FilterChip label="AC filter" selected={acFilter} onToggle={() => setAcFilter((v) => !v)} />
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Fluids
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <FilterChip label="Coolant" selected={coolant} onToggle={() => setCoolant((v) => !v)} />
            </Stack>
          </Box>

          <TextField
            label="Cost (Rs)"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            fullWidth
            inputMode="numeric"
          />

          <TextField
            label="Notes / work done"
            placeholder="e.g. Routine tuning, brake pads, coolant top-up"
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
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasMeter || saving}
          sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#2f6fd1' } }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddServiceDialog
