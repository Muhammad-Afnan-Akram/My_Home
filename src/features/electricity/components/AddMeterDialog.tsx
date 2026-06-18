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
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import type { ScrapedBill } from '../types'
import type { NewMeter } from '../data'
import { fetchScrapedBill } from '../data'
import { discoLabel } from '../utils/disco'

interface AddMeterDialogProps {
  open: boolean
  /** Global protected-slab limit applied to every meter (stored on save). */
  unitLimit: number
  onClose: () => void
  onSubmit: (input: NewMeter, scraped: ScrapedBill) => Promise<unknown> | void
}

/** Day-of-month the billing cycle resets, taken from the bill reading date. */
function cycleStartFromReadingDate(readingDate?: string): number {
  if (!readingDate) return 1
  const day = Number(readingDate.slice(8, 10))
  return Number.isFinite(day) && day >= 1 ? Math.min(28, day) : 1
}

function DetailRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
        {value ?? '—'}
      </Typography>
    </Stack>
  )
}

function AddMeterDialog({ open, unitLimit, onClose, onSubmit }: AddMeterDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [refno, setRefno] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scraped, setScraped] = useState<ScrapedBill | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const refTrimmed = refno.replace(/\s+/g, '')

  const handleFind = async () => {
    if (!refTrimmed) return
    setLoading(true)
    setError(null)
    try {
      const bill = await fetchScrapedBill(refTrimmed)
      setScraped(bill)
      setName(bill.customerName ? bill.customerName.split(/\s+/).slice(0, 2).join(' ') : 'My meter')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not find this bill.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!scraped) return
    setSaving(true)
    try {
      await onSubmit(
        {
          name: name.trim() || 'My meter',
          company: scraped.company,
          referenceNumber: scraped.referenceNumber,
          cycleStartDay: cycleStartFromReadingDate(scraped.readingDate),
          unitLimit,
        },
        scraped,
      )
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const cycleDay = scraped ? cycleStartFromReadingDate(scraped.readingDate) : 1

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      <DialogTitle>{scraped ? 'Confirm meter' : 'Add meter'}</DialogTitle>
      <DialogContent>
        {!scraped ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the 14-digit reference number from your bill. We'll fetch the rest.
            </Typography>
            <TextField
              label="Reference number"
              value={refno}
              onChange={(e) => setRefno(e.target.value)}
              fullWidth
              autoFocus
              inputMode="numeric"
              placeholder="e.g. 05158121642400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) handleFind()
              }}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="success" variant="outlined">
              Found a {discoLabel(scraped.company)} bill — check the details below.
            </Alert>
            <TextField
              label="Name this meter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              helperText="A label you'll recognise, e.g. Main, Annexe, Shop"
            />
            <Box>
              <Stack spacing={1}>
                <DetailRow label="Company" value={discoLabel(scraped.company)} />
                <DetailRow label="Reference no" value={scraped.referenceNumber} />
                <DetailRow label="Customer" value={scraped.customerName} />
                <Divider sx={{ my: 0.5 }} />
                <DetailRow label="Bill month" value={scraped.billMonth} />
                <DetailRow label="Units consumed" value={scraped.unitsConsumed} />
                <DetailRow label="Reading date" value={scraped.readingDate} />
                <DetailRow label="Issue date" value={scraped.issueDate} />
                <DetailRow label="Due date" value={scraped.dueDate} />
                <DetailRow
                  label="Payable (within due)"
                  value={scraped.payableWithinDueDate != null ? `Rs ${scraped.payableWithinDueDate}` : undefined}
                />
                <DetailRow
                  label="Payable (after due)"
                  value={scraped.payableAfterDueDate != null ? `Rs ${scraped.payableAfterDueDate}` : undefined}
                />
              </Stack>
            </Box>
            <Alert severity="info" variant="outlined">
              Billing cycle will reset on day <b>{cycleDay}</b> each month (from the reading date).
            </Alert>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!scraped ? (
          <>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleFind}
              disabled={!refTrimmed || loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            >
              {loading ? 'Finding…' : 'Find bill'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setScraped(null)} disabled={saving}>
              Back
            </Button>
            <Button variant="contained" onClick={handleConfirm} disabled={saving}>
              {saving ? 'Adding…' : 'Add meter'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default AddMeterDialog
