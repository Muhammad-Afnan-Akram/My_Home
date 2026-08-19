import { useMemo, useState } from 'react'
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
import AlertTitle from '@mui/material/AlertTitle'
import LinearProgress from '@mui/material/LinearProgress'
import InputAdornment from '@mui/material/InputAdornment'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import type { NewCarService } from '../data'
import type { CarService, ServiceItem, ServiceType } from '../types'
import {
  ITEM_GROUPS,
  MAINTENANCE_ITEMS,
  SERVICE_TYPES,
  itemLabel,
  itemsInGroup,
  maintenanceItem,
} from '../types'
import { formatKm, formatRs, todayISO } from '../utils/format'
import SelectWithOther from './SelectWithOther'

const ACCENT = '#3b82f6'

/** One-tap bundles for the jobs that are almost always done together. */
const PRESETS: { label: string; keys: string[] }[] = [
  { label: 'Oil change', keys: ['engine-oil', 'oil-filter'] },
  {
    label: 'Full service',
    keys: ['engine-oil', 'oil-filter', 'air-filter', 'ac-filter', 'engine-tuneup'],
  },
]

/** Editable form state for one selected item — all strings while typing. */
interface Draft {
  brand: string
  spec: string
  qty: string
  cost: string
  note: string
}

const EMPTY_DRAFT: Draft = { brand: '', spec: '', qty: '', cost: '', note: '' }

function draftFrom(recorded: ServiceItem): Draft {
  return {
    brand: recorded.brand ?? '',
    spec: recorded.spec ?? '',
    qty: recorded.qty != null ? String(recorded.qty) : '',
    cost: recorded.cost != null ? String(recorded.cost) : '',
    note: recorded.note ?? '',
  }
}

/** Positive number from a form field, or undefined when blank / invalid. */
function positive(value: string): number | undefined {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) && n > 0 ? n : undefined
}

interface AddServiceDialogProps {
  open: boolean
  carId: string
  /** Car's current odometer, used as the default meter reading. */
  currentMeter: number
  /** Catalog keys currently due for this car — offered as one-tap suggestions. */
  dueKeys?: string[]
  /** When provided, the dialog edits this service instead of adding one. */
  initial?: CarService
  onClose: () => void
  onSubmit: (input: NewCarService) => Promise<void> | void
}

function AddServiceDialog({
  open,
  carId,
  currentMeter,
  dueKeys = [],
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
  // Once the total is typed by hand we stop mirroring the per-item costs.
  const [costEdited, setCostEdited] = useState(Boolean(initial?.cost))
  const [description, setDescription] = useState(initial?.description ?? '')

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries((initial?.items ?? []).map((i) => [i.key, draftFrom(i)])),
  )
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedKeys = useMemo(
    () => MAINTENANCE_ITEMS.filter((i) => i.key in drafts).map((i) => i.key),
    [drafts],
  )

  const toggle = (key: string) => {
    const wasSelected = key in drafts
    setDrafts((prev) => {
      const next = { ...prev }
      if (wasSelected) delete next[key]
      else next[key] = { ...EMPTY_DRAFT }
      return next
    })
    // Open the detail panel of whatever was just added, so brand/size fields
    // are right there instead of a second tap away.
    setExpandedKey(wasSelected ? null : key)
  }

  const addKeys = (keys: string[]) => {
    setDrafts((prev) => {
      const next = { ...prev }
      for (const key of keys) if (!(key in next)) next[key] = { ...EMPTY_DRAFT }
      return next
    })
  }

  const patchDraft = (key: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] ?? EMPTY_DRAFT), ...patch } }))
  }

  const itemsTotal = selectedKeys.reduce((sum, key) => sum + (positive(drafts[key].cost) ?? 0), 0)
  // The total mirrors the sum of item costs until it's overridden by hand.
  const costValue = !costEdited && itemsTotal > 0 ? String(itemsTotal) : cost

  const meterNum = Number(meter)
  const hasMeter = meter.trim().length > 0 && !Number.isNaN(meterNum)
  const lowerThanCurrent = hasMeter && currentMeter > 0 && meterNum < currentMeter

  const query = search.trim().toLowerCase()
  const suggestions = dueKeys.filter((key) => !(key in drafts) && maintenanceItem(key))

  const handleSave = async () => {
    if (!hasMeter) return
    setSaving(true)
    try {
      const items: ServiceItem[] = selectedKeys.map((key) => {
        const d = drafts[key]
        const item: ServiceItem = { key }
        if (d.brand.trim()) item.brand = d.brand.trim()
        if (d.spec.trim()) item.spec = d.spec.trim()
        if (d.note.trim()) item.note = d.note.trim()
        const qty = positive(d.qty)
        const itemCost = positive(d.cost)
        if (qty != null) item.qty = qty
        if (itemCost != null) item.cost = itemCost
        return item
      })
      const costNum = Number(costValue)
      await onSubmit({
        carId,
        date,
        meterReading: meterNum,
        type,
        cost: Number.isFinite(costNum) && costNum > 0 ? costNum : 0,
        items,
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

          {/* Due now — one tap to add what the car is actually asking for. */}
          {suggestions.length > 0 && (
            <Alert severity="info" icon={false} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
              <AlertTitle sx={{ fontSize: 14, mb: 0.75 }}>Due on this car</AlertTitle>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                {suggestions.map((key) => (
                  <Chip
                    key={key}
                    size="small"
                    label={`+ ${itemLabel(key)}`}
                    onClick={() => toggle(key)}
                    variant="outlined"
                  />
                ))}
                <Chip
                  size="small"
                  color="info"
                  label="Add all"
                  onClick={() => addKeys(suggestions)}
                />
              </Stack>
            </Alert>
          )}

          {/* Work done */}
          <Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Work done{selectedKeys.length > 0 && ` · ${selectedKeys.length} selected`}
              </Typography>
              <Stack direction="row" spacing={0.75}>
                {PRESETS.map((p) => (
                  <Chip
                    key={p.label}
                    size="small"
                    label={p.label}
                    onClick={() => addKeys(p.keys)}
                    variant="outlined"
                    sx={{ borderStyle: 'dashed' }}
                  />
                ))}
              </Stack>
            </Stack>

            <TextField
              placeholder="Search parts & jobs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 1.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label="clear search" onClick={() => setSearch('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />

            <Stack spacing={1.5}>
              {ITEM_GROUPS.map((group) => {
                const items = itemsInGroup(group.value).filter(
                  (i) => !query || i.label.toLowerCase().includes(query),
                )
                if (items.length === 0) return null
                return (
                  <Box key={group.value}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 0.5, fontWeight: 600, letterSpacing: 0.3 }}
                    >
                      {group.label.toUpperCase()}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                      {items.map((item) => {
                        const selected = item.key in drafts
                        const due = dueKeys.includes(item.key)
                        return (
                          <Tooltip key={item.key} title={item.hint ?? ''} enterDelay={600}>
                            <Chip
                              label={due && !selected ? `${item.label} · due` : item.label}
                              onClick={() => toggle(item.key)}
                              color={selected ? 'primary' : due ? 'warning' : 'default'}
                              variant={selected ? 'filled' : 'outlined'}
                              sx={{ fontWeight: selected ? 600 : 400 }}
                            />
                          </Tooltip>
                        )
                      })}
                    </Stack>
                  </Box>
                )
              })}
            </Stack>
          </Box>

          {/* Detail for each selected item — brand, size, quantity, its own cost. */}
          {selectedKeys.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Details
              </Typography>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
                {selectedKeys.map((key) => {
                  const item = maintenanceItem(key)
                  const d = drafts[key]
                  const summary = [
                    d.brand,
                    d.spec,
                    d.qty && `${d.qty} ${item?.qtyLabel ?? ''}`.trim(),
                    d.cost && formatRs(Number(d.cost)),
                  ]
                    .filter(Boolean)
                    .join(' · ')
                  return (
                    <Accordion
                      key={key}
                      disableGutters
                      elevation={0}
                      square
                      expanded={expandedKey === key}
                      onChange={() => setExpandedKey(expandedKey === key ? null : key)}
                      sx={{ '&:not(:last-of-type)': { borderBottom: 1, borderColor: 'divider' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {item?.label ?? key}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {summary || 'Tap to add brand, size, quantity or cost'}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <Stack spacing={2}>
                          {item?.hint && (
                            <Typography variant="caption" color="text.secondary">
                              {item.hint}
                            </Typography>
                          )}
                          {item?.brands && (
                            <SelectWithOther
                              label="Brand"
                              value={d.brand}
                              onChange={(v) => patchDraft(key, { brand: v })}
                              options={item.brands}
                            />
                          )}
                          {item?.specLabel &&
                            (item.specOptions ? (
                              <SelectWithOther
                                label={item.specLabel}
                                value={d.spec}
                                onChange={(v) => patchDraft(key, { spec: v })}
                                options={item.specOptions}
                              />
                            ) : (
                              <TextField
                                label={item.specLabel}
                                value={d.spec}
                                onChange={(e) => patchDraft(key, { spec: e.target.value })}
                                fullWidth
                              />
                            ))}
                          <Stack direction="row" spacing={2}>
                            {item?.qtyLabel && (
                              <TextField
                                label="Quantity"
                                value={d.qty}
                                onChange={(e) => patchDraft(key, { qty: e.target.value })}
                                inputMode="decimal"
                                fullWidth
                                slotProps={{
                                  input: {
                                    endAdornment: (
                                      <InputAdornment position="end">{item.qtyLabel}</InputAdornment>
                                    ),
                                  },
                                }}
                              />
                            )}
                            <TextField
                              label="Cost"
                              value={d.cost}
                              onChange={(e) => patchDraft(key, { cost: e.target.value })}
                              inputMode="numeric"
                              fullWidth
                              slotProps={{
                                input: {
                                  startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                                },
                              }}
                            />
                          </Stack>
                          <TextField
                            label="Note"
                            value={d.note}
                            onChange={(e) => patchDraft(key, { note: e.target.value })}
                            placeholder="e.g. front left only, workshop name"
                            fullWidth
                          />
                          <Button
                            size="small"
                            color="error"
                            onClick={() => toggle(key)}
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  )
                })}
              </Box>
            </Box>
          )}

          <TextField
            label="Total cost (Rs)"
            value={costValue}
            onChange={(e) => {
              setCostEdited(true)
              setCost(e.target.value)
            }}
            fullWidth
            inputMode="numeric"
            helperText={
              itemsTotal > 0
                ? `Item costs add up to ${formatRs(itemsTotal)}`
                : 'Leave blank if you only want to log the work'
            }
          />

          <TextField
            label="Notes / work done"
            placeholder="e.g. Rear brake pads squealing, replaced both sides"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          {hasMeter && (
            <Typography variant="caption" color="text.secondary">
              Logged at {formatKm(meterNum)} — this sets the baseline for the next due date of
              everything selected above.
            </Typography>
          )}
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
