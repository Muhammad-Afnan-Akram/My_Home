import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Fab from '@mui/material/Fab'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import AddIcon from '@mui/icons-material/Add'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useCar } from '../hooks/carContext'
import type { CarService } from '../types'
import { AddServiceDialog, ServiceList, UpdateMeterDialog, ServiceGauge } from '../components'
import {
  effectiveInterval,
  formatDate,
  formatKm,
  formatRs,
  lastOilChangeReading,
  serviceStatus,
  sortServicesByDate,
} from '../utils/format'

/** Blue accent that signs the car module across the app. */
const ACCENT = '#3b82f6'
const ACCENT_HOVER = '#2f6fd1'

/** A labelled stat block used in the car summary card. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
        {value}
      </Typography>
    </Box>
  )
}

function CarDetailPage() {
  const { carId = '' } = useParams()
  const navigate = useNavigate()
  const { loading, cars, services, addService, deleteService, updateCar, oilChangeIntervalKm } =
    useCar()

  const car = cars.find((c) => c.id === carId)
  const carServices = useMemo(
    () => sortServicesByDate(services.filter((s) => s.carId === carId)),
    [services, carId],
  )

  const [adding, setAdding] = useState(false)
  const [updatingMeter, setUpdatingMeter] = useState(false)
  const [openSeq, setOpenSeq] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<CarService | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const openAdd = () => {
    setOpenSeq((n) => n + 1)
    setAdding(true)
  }
  const openUpdateMeter = () => {
    setOpenSeq((n) => n + 1)
    setUpdatingMeter(true)
  }

  const totalSpent = carServices.reduce((sum, s) => sum + s.cost, 0)
  const lastService = carServices[0]
  const lastOil = lastOilChangeReading(carServices)
  const sinceOil = car && lastOil != null ? Math.max(0, car.currentMeter - lastOil) : null
  const interval = car ? effectiveInterval(car, oilChangeIntervalKm) : oilChangeIntervalKm
  const status = car ? serviceStatus(interval, car.currentMeter, lastOil) : null

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteService(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete service.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Screen title="Car" back={ROUTES.cars}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Screen>
    )
  }

  if (!car) {
    return (
      <Screen title="Car" back={ROUTES.cars}>
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 8 }}>
          <Typography variant="h6">Car not found</Typography>
          <Button variant="contained" onClick={() => navigate(ROUTES.cars)}>
            Back to cars
          </Button>
        </Stack>
      </Screen>
    )
  }

  return (
    <Screen title={`${car.make} ${car.model}`} back={ROUTES.cars}>
      <Stack spacing={2} sx={{ pb: 10 }}>
        <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {car.imageUrl && (
            <Box
              component="img"
              src={car.imageUrl}
              alt={`${car.make} ${car.model}`}
              sx={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
            />
          )}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
              px: 2,
              py: 1.75,
              background: `linear-gradient(135deg, ${ACCENT}24, ${ACCENT}08)`,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'background.paper',
                boxShadow: 1,
              }}
            >
              <DirectionsCarIcon sx={{ color: ACCENT }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
                {car.make} {car.model}
              </Typography>
              {(car.variant || car.year) && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                  {[car.year, car.variant].filter(Boolean).join(' · ')}
                </Typography>
              )}
              <Stack direction="row" spacing={0.75} sx={{ mt: 0.25, flexWrap: 'wrap', rowGap: 0.5 }}>
                <Chip
                  size="small"
                  variant="outlined"
                  label={car.registrationNumber}
                  sx={{ bgcolor: 'background.paper' }}
                />
                {car.color && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={car.color}
                    sx={{ bgcolor: 'background.paper' }}
                  />
                )}
              </Stack>
            </Box>
            <Tooltip title="Update meter reading">
              <IconButton aria-label="update meter reading" onClick={openUpdateMeter}>
                <SpeedOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Stack
              direction="row"
              spacing={2.5}
              sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}
            >
              <ServiceGauge status={status} size={112} />
              <Box
                sx={{
                  flex: 1,
                  minWidth: 180,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1.5,
                }}
              >
                <Stat label="Current meter" value={formatKm(car.currentMeter)} />
                <Stat label="Last service" value={lastService ? formatDate(lastService.date) : '—'} />
                <Stat
                  label="Since oil change"
                  value={sinceOil != null ? formatKm(sinceOil) : '—'}
                />
                <Stat label="Total spent" value={formatRs(totalSpent)} />
              </Box>
            </Stack>
            {status?.overdue && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This car is {formatKm(-status.remaining)} past its {formatKm(interval)} oil-change
                interval.
              </Alert>
            )}
          </Box>
        </Card>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            Service history
          </Typography>
          <ServiceList services={carServices} onDelete={setDeleteTarget} />
        </Box>
      </Stack>

      <Fab
        aria-label="add service"
        onClick={openAdd}
        variant="extended"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          color: '#fff',
          bgcolor: ACCENT,
          '&:hover': { bgcolor: ACCENT_HOVER },
        }}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add service
      </Fab>

      <AddServiceDialog
        key={`service-${openSeq}`}
        open={adding}
        carId={car.id}
        currentMeter={car.currentMeter}
        onClose={() => setAdding(false)}
        onSubmit={async (input) => {
          try {
            await addService(input)
          } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Failed to add service.')
            throw err
          }
        }}
      />

      <UpdateMeterDialog
        key={`meter-${openSeq}`}
        open={updatingMeter}
        currentMeter={car.currentMeter}
        onClose={() => setUpdatingMeter(false)}
        onSubmit={async (km) => {
          try {
            await updateCar(car.id, { currentMeter: km })
          } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Failed to update meter.')
            throw err
          }
        }}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete this service?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The service from {deleteTarget ? formatDate(deleteTarget.date) : ''} will be permanently
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

export default CarDetailPage
