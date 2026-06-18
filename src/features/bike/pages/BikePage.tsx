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
import SettingsIcon from '@mui/icons-material/Settings'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import type { Bike } from '../types'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useBike } from '../hooks/bikeContext'
import { BikeCard, BikeFormDialog, SettingsDialog } from '../components'

/** Emerald accent that signs the bike module across the app. */
const ACCENT = '#10b981'

function BikePage() {
  const navigate = useNavigate()
  const { loading, error, bikes, tunings, addBike, updateBike, deleteBike, tuningIntervalKm, setTuningInterval } =
    useBike()
  const [formOpen, setFormOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Bike | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Bike | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  // Bump on open so each dialog remounts fresh (re-reads props) without a reset effect.
  const [openSeq, setOpenSeq] = useState(0)

  const openAdd = () => {
    setEditTarget(null)
    setOpenSeq((n) => n + 1)
    setFormOpen(true)
  }
  const openEdit = (bike: Bike) => {
    setEditTarget(bike)
    setOpenSeq((n) => n + 1)
    setFormOpen(true)
  }
  const openSettings = () => {
    setOpenSeq((n) => n + 1)
    setSettingsOpen(true)
  }

  const handleSubmit = async (values: Parameters<typeof addBike>[0]) => {
    try {
      if (editTarget) await updateBike(editTarget.id, values)
      else await addBike(values)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save bike.')
      throw err
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteBike(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete bike.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Screen
      title="Bike Tuning"
      back={ROUTES.home}
      actions={
        <IconButton aria-label="bike settings" onClick={openSettings}>
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
      ) : bikes.length === 0 ? (
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 8 }}>
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: `${ACCENT}1f`,
            }}
          >
            <TwoWheelerIcon sx={{ fontSize: 52, color: ACCENT }} />
          </Box>
          <Typography variant="h6">No bikes yet</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
            Add your bike with its company, model and registration number to start tracking tunings,
            costs and meter readings.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#0e9f6e' } }}
          >
            Add bike
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ pb: 10 }}>
          {bikes.map((bike) => (
            <BikeCard
              key={bike.id}
              bike={bike}
              tunings={tunings.filter((t) => t.bikeId === bike.id)}
              tuningIntervalKm={tuningIntervalKm}
              onClick={() => navigate(ROUTES.bike(bike.id))}
              onEdit={() => openEdit(bike)}
              onDelete={() => setDeleteTarget(bike)}
            />
          ))}
        </Stack>
      )}

      {!loading && bikes.length > 0 && (
        <Fab
          aria-label="add bike"
          onClick={openAdd}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            color: '#fff',
            bgcolor: ACCENT,
            '&:hover': { bgcolor: '#0e9f6e' },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <BikeFormDialog
        key={`form-${openSeq}`}
        open={formOpen}
        initial={editTarget ?? undefined}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <SettingsDialog
        key={`settings-${openSeq}`}
        open={settingsOpen}
        tuningIntervalKm={tuningIntervalKm}
        onClose={() => setSettingsOpen(false)}
        onSave={setTuningInterval}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete this bike?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{deleteTarget?.company} {deleteTarget?.model}” and all its tuning history will be
            permanently removed.
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
        open={Boolean(actionError)}
        autoHideDuration={6000}
        onClose={() => setActionError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      </Snackbar>
    </Screen>
  )
}

export default BikePage
