import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Fab from '@mui/material/Fab'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import BoltIcon from '@mui/icons-material/Bolt'
import SettingsIcon from '@mui/icons-material/Settings'
import type { Meter } from '../types'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useElectricity } from '../hooks/electricityContext'
import { MeterCard, AddMeterDialog, SettingsDialog } from '../components'

function ElectricityPage() {
  const navigate = useNavigate()
  const {
    loading,
    error,
    meters,
    readings,
    bills,
    fetchingIds,
    unitLimit,
    setUnitLimit,
    addMeterFromBill,
    fetchBill,
    deleteMeter,
  } = useElectricity()
  const [adding, setAdding] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Meter | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  // Refresh from the card's button. Catch failures (expired session, portal
  // down) so they surface as a toast instead of an uncaught promise rejection.
  const handleRefresh = (meter: Meter) => {
    void fetchBill(meter).catch((err) =>
      setRefreshError(err instanceof Error ? err.message : 'Failed to refresh bill.'),
    )
  }
  // Bump on open so each dialog remounts fresh (re-reads props) without a reset effect.
  const [openSeq, setOpenSeq] = useState(0)
  const openAdding = () => {
    setOpenSeq((n) => n + 1)
    setAdding(true)
  }
  const openSettings = () => {
    setOpenSeq((n) => n + 1)
    setSettingsOpen(true)
  }

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
    <Screen
      title="Electricity"
      back={ROUTES.home}
      actions={
        <IconButton aria-label="electricity settings" onClick={openSettings}>
          <SettingsIcon />
        </IconButton>
      }
    >
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdding}>
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
              unitLimit={unitLimit}
              bill={bills[meter.id]}
              lastUpdated={bills[meter.id]?.updatedAt}
              billMonth={bills[meter.id]?.billMonth}
              issueDate={bills[meter.id]?.issueDate}
              onClick={() => navigate(ROUTES.meter(meter.id))}
              onRefresh={() => handleRefresh(meter)}
              onDelete={() => setDeleteTarget(meter)}
            />
          ))}
        </Stack>
      )}

      {!loading && meters.length > 0 && (
        <Fab
          color="primary"
          aria-label="add meter"
          onClick={openAdding}
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          <AddIcon />
        </Fab>
      )}

      <AddMeterDialog
        key={`add-${openSeq}`}
        open={adding}
        unitLimit={unitLimit}
        onClose={() => setAdding(false)}
        onSubmit={addMeterFromBill}
      />

      <SettingsDialog
        key={`settings-${openSeq}`}
        open={settingsOpen}
        unitLimit={unitLimit}
        onClose={() => setSettingsOpen(false)}
        onSave={setUnitLimit}
      />

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

      <Snackbar
        open={Boolean(refreshError)}
        autoHideDuration={6000}
        onClose={() => setRefreshError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setRefreshError(null)}>
          {refreshError}
        </Alert>
      </Snackbar>
    </Screen>
  )
}

export default ElectricityPage
