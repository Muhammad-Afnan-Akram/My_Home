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
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import type { Car } from '../types'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useCar } from '../hooks/carContext'
import { CarCard, CarFormDialog, SettingsDialog } from '../components'

/** Blue accent that signs the car module across the app. */
const ACCENT = '#3b82f6'
const ACCENT_HOVER = '#2f6fd1'

function CarPage() {
  const navigate = useNavigate()
  const {
    loading,
    error,
    cars,
    services,
    addCar,
    updateCar,
    deleteCar,
    oilChangeIntervalKm,
    setOilChangeInterval,
  } = useCar()
  const [formOpen, setFormOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Car | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Car | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  // Bump on open so each dialog remounts fresh (re-reads props) without a reset effect.
  const [openSeq, setOpenSeq] = useState(0)

  const openAdd = () => {
    setEditTarget(null)
    setOpenSeq((n) => n + 1)
    setFormOpen(true)
  }
  const openEdit = (car: Car) => {
    setEditTarget(car)
    setOpenSeq((n) => n + 1)
    setFormOpen(true)
  }
  const openSettings = () => {
    setOpenSeq((n) => n + 1)
    setSettingsOpen(true)
  }

  const handleSubmit = async (values: Parameters<typeof addCar>[0]) => {
    try {
      if (editTarget) await updateCar(editTarget.id, values)
      else await addCar(values)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to save car.')
      throw err
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCar(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete car.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Screen
      title="Car"
      back={ROUTES.home}
      actions={
        <IconButton aria-label="car settings" onClick={openSettings}>
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
      ) : cars.length === 0 ? (
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
            <DirectionsCarIcon sx={{ fontSize: 52, color: ACCENT }} />
          </Box>
          <Typography variant="h6">No cars yet</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
            Add your car with its make, model and variant to start tracking oil changes, filters,
            tuning and repairs.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: ACCENT_HOVER } }}
          >
            Add car
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ pb: 10 }}>
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              services={services.filter((s) => s.carId === car.id)}
              oilChangeIntervalKm={oilChangeIntervalKm}
              onClick={() => navigate(ROUTES.car(car.id))}
              onEdit={() => openEdit(car)}
              onDelete={() => setDeleteTarget(car)}
            />
          ))}
        </Stack>
      )}

      {!loading && cars.length > 0 && (
        <Fab
          aria-label="add car"
          onClick={openAdd}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            color: '#fff',
            bgcolor: ACCENT,
            '&:hover': { bgcolor: ACCENT_HOVER },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <CarFormDialog
        key={`form-${openSeq}`}
        open={formOpen}
        initial={editTarget ?? undefined}
        defaultIntervalKm={oilChangeIntervalKm}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <SettingsDialog
        key={`settings-${openSeq}`}
        open={settingsOpen}
        oilChangeIntervalKm={oilChangeIntervalKm}
        onClose={() => setSettingsOpen(false)}
        onSave={setOilChangeInterval}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete this car?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{deleteTarget?.make} {deleteTarget?.model}” and all its service history will be
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

export default CarPage
