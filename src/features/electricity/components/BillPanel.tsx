import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import EditIcon from '@mui/icons-material/Edit'
import type { BillInfo, Meter, MonthlyUnit } from '../types'
import { billUrlFor } from '../utils/billing'

interface BillPanelProps {
  meter: Meter
  bill?: BillInfo
  /** Trigger an auto-fetch from the portal; resolves when saved, throws on error. */
  onFetch: () => Promise<void>
  onSave: (bill: BillInfo) => Promise<void> | void
}

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value ?? '—'}
      </Typography>
    </Stack>
  )
}

/** Compact bar chart of recent monthly consumption. */
function History({ history, limit }: { history: MonthlyUnit[]; limit: number }) {
  const recent = history.slice(-6)
  const max = Math.max(limit, ...recent.map((h) => h.units), 1)
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Recent months
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end', height: 88 }}>
        {recent.map((h) => {
          const over = h.units > limit
          const near = !over && h.units >= limit * 0.8
          return (
            <Stack key={h.month} sx={{ flex: 1, alignItems: 'center' }} spacing={0.5}>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 10 }}>
                {h.units}
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: `${Math.max(4, (h.units / max) * 56)}px`,
                  borderRadius: 1,
                  bgcolor: over ? 'error.main' : near ? 'warning.main' : 'success.main',
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {h.month}
              </Typography>
            </Stack>
          )
        })}
      </Stack>
    </Box>
  )
}

function BillPanel({ meter, bill, onFetch, onSave }: BillPanelProps) {
  const url = meter.billUrl || billUrlFor(meter.company, meter.referenceNumber)
  const [editing, setEditing] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ units: '', amountDue: '', dueDate: '', readingDate: '' })
  const [saving, setSaving] = useState(false)

  const handleFetch = async () => {
    setFetching(true)
    setError(null)
    try {
      await onFetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bill.')
    } finally {
      setFetching(false)
    }
  }

  const openEdit = () => {
    setForm({
      units: bill?.units?.toString() ?? '',
      amountDue: bill?.amountDue?.toString() ?? '',
      dueDate: bill?.dueDate ?? '',
      readingDate: bill?.readingDate ?? '',
    })
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        ...bill,
        meterId: meter.id,
        units: form.units ? Number(form.units) : undefined,
        amountDue: form.amountDue ? Number(form.amountDue) : undefined,
        dueDate: form.dueDate || undefined,
        readingDate: form.readingDate || undefined,
        source: 'manual',
        updatedAt: new Date().toISOString(),
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Latest bill{bill?.billMonth ? ` · ${bill.billMonth}` : ''}
          </Typography>
          {bill && (
            <Chip
              size="small"
              label={bill.source === 'scraped' ? 'Auto-fetched' : 'Manual'}
              color={bill.source === 'scraped' ? 'success' : 'default'}
              variant="outlined"
            />
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={1}>
          {bill?.customerName && <Row label="Name" value={bill.customerName} />}
          <Row label="Billed units" value={bill?.units} />
          <Row label="Within due date" value={bill?.amountDue != null ? `Rs ${bill.amountDue}` : undefined} />
          <Row label="After due date" value={bill?.payableAfter != null ? `Rs ${bill.payableAfter}` : undefined} />
          <Row label="Reading date" value={bill?.readingDate} />
          <Row label="Issue date" value={bill?.issueDate} />
          <Row label="Due date" value={bill?.dueDate} />
          {bill?.presentReading != null && <Row label="Reading on bill" value={bill.presentReading} />}
        </Stack>

        {bill?.history && bill.history.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <History history={bill.history} limit={meter.unitLimit} />
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1.5}>
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={handleFetch}
            disabled={fetching}
            fullWidth
          >
            {fetching ? 'Fetching…' : 'Fetch latest bill'}
          </Button>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="text"
              startIcon={<OpenInNewIcon />}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
            >
              Official bill
            </Button>
            <Button variant="text" startIcon={<EditIcon />} onClick={openEdit} fullWidth>
              Enter manually
            </Button>
          </Stack>
        </Stack>
      </CardContent>

      <Dialog open={editing} onClose={() => setEditing(false)} fullWidth maxWidth="xs">
        <DialogTitle>Enter bill details</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Billed units"
              value={form.units}
              onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
              inputMode="numeric"
              fullWidth
            />
            <TextField
              label="Amount due (Rs)"
              value={form.amountDue}
              onChange={(e) => setForm((f) => ({ ...f, amountDue: e.target.value }))}
              inputMode="numeric"
              fullWidth
            />
            <TextField
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="Bill reading date"
              type="date"
              value={form.readingDate}
              onChange={(e) => setForm((f) => ({ ...f, readingDate: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default BillPanel
