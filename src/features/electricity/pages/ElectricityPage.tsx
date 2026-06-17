import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Fab from '@mui/material/Fab'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import AddIcon from '@mui/icons-material/Add'
import BoltIcon from '@mui/icons-material/Bolt'
import type { Meter } from '../types'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useElectricity } from '../hooks/useElectricity'
import { MeterCard, AddMeterDialog } from '../components'

function ElectricityPage() {
  const navigate = useNavigate()
  const { loading, error, meters, readings, bills, fetchingIds, addMeterFromBill, fetchBill, deleteMeter } =
    useElectricity()
  const [adding, setAdding] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Meter | null>(null)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMeter(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Screen title="Electricity" back={ROUTES.home}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : meters.length === 0 ? (
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 8 }}>
          <BoltIcon sx={{ fontSize: 56 }} color="warning" />
          <Typography variant="h6">No meters yet</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
            Add your first meter with its reference number to start tracking monthly units against
            the 200-unit protected slab.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
            Add meter
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ pb: 10 }}>
          {meters.map((meter) => (
            <MeterCard
              key={meter.id}
              meter={meter}
              readings={readings.filter((r) => r.meterId === meter.id)}
              fetching={fetchingIds.has(meter.id)}
              lastUpdated={bills[meter.id]?.updatedAt}
              billMonth={bills[meter.id]?.billMonth}
              issueDate={bills[meter.id]?.issueDate}
              onClick={() => navigate(ROUTES.meter(meter.id))}
              onRefresh={() => fetchBill(meter)}
              onDelete={() => setDeleteTarget(meter)}
            />
          ))}
        </Stack>
      )}

      {!loading && meters.length > 0 && (
        <Fab
          color="primary"
          aria-label="add meter"
          onClick={() => setAdding(true)}
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          <AddIcon />
        </Fab>
      )}

      <AddMeterDialog open={adding} onClose={() => setAdding(false)} onSubmit={addMeterFromBill} />

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete this meter?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{deleteTarget?.name}” and all its readings and bill history will be permanently
            removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Screen>
  )
}

export default ElectricityPage
