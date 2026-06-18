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
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useBike } from '../hooks/bikeContext'
import type { Tuning } from '../types'
import { AddTuningDialog, TuningList, UpdateMeterDialog, TuningGauge } from '../components'
import { formatDate, formatKm, formatRs, tuningStatus } from '../utils/format'

/** Emerald accent that signs the bike module across the app. */
const ACCENT = '#10b981'

/** A labelled stat block used in the bike summary card. */
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

function BikeDetailPage() {
  const { bikeId = '' } = useParams()
  const navigate = useNavigate()
  const { loading, bikes, tunings, addTuning, deleteTuning, updateBike, tuningIntervalKm } = useBike()

  const bike = bikes.find((b) => b.id === bikeId)
  const bikeTunings = useMemo(
    () => tunings.filter((t) => t.bikeId === bikeId),
    [tunings, bikeId],
  )

  const [adding, setAdding] = useState(false)
  const [updatingMeter, setUpdatingMeter] = useState(false)
  const [openSeq, setOpenSeq] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Tuning | null>(null)
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

  const totalSpent = bikeTunings.reduce((sum, t) => sum + t.cost, 0)
  const lastTuning = bikeTunings[0]
  const sinceLast =
    bike && lastTuning ? Math.max(0, bike.currentMeter - lastTuning.meterReading) : null
  const status = bike
    ? tuningStatus(tuningIntervalKm, bike.currentMeter, lastTuning?.meterReading ?? null)
    : null

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTuning(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete tuning.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <Screen title="Bike Tuning" back={ROUTES.bikes}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Screen>
    )
  }

  if (!bike) {
    return (
      <Screen title="Bike Tuning" back={ROUTES.bikes}>
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 8 }}>
          <Typography variant="h6">Bike not found</Typography>
          <Button variant="contained" onClick={() => navigate(ROUTES.bikes)}>
            Back to bikes
          </Button>
        </Stack>
      </Screen>
    )
  }

  return (
    <Screen title={`${bike.company} ${bike.model}`} back={ROUTES.bikes}>
      <Stack spacing={2} sx={{ pb: 10 }}>
        <Card variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
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
              <TwoWheelerIcon sx={{ color: ACCENT }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
                {bike.company} {bike.model}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={bike.registrationNumber}
                sx={{ mt: 0.25, bgcolor: 'background.paper' }}
              />
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
              <TuningGauge status={status} size={112} />
              <Box
                sx={{
                  flex: 1,
                  minWidth: 180,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1.5,
                }}
              >
                <Stat label="Current meter" value={formatKm(bike.currentMeter)} />
                <Stat label="Last tuning" value={lastTuning ? formatDate(lastTuning.date) : '—'} />
                <Stat
                  label="Since last tuning"
                  value={sinceLast != null ? formatKm(sinceLast) : '—'}
                />
                <Stat label="Total spent" value={formatRs(totalSpent)} />
              </Box>
            </Stack>
            {status?.overdue && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This bike is {formatKm(-status.remaining)} past its {formatKm(tuningIntervalKm)}{' '}
                tuning interval.
              </Alert>
            )}
          </Box>
        </Card>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            Tuning history
          </Typography>
          <TuningList tunings={bikeTunings} onDelete={setDeleteTarget} />
        </Box>
      </Stack>

      <Fab
        aria-label="add tuning"
        onClick={openAdd}
        variant="extended"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          color: '#fff',
          bgcolor: ACCENT,
          '&:hover': { bgcolor: '#0e9f6e' },
        }}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add tuning
      </Fab>

      <AddTuningDialog
        key={`tuning-${openSeq}`}
        open={adding}
        bikeId={bike.id}
        currentMeter={bike.currentMeter}
        onClose={() => setAdding(false)}
        onSubmit={async (input) => {
          try {
            await addTuning(input)
          } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Failed to add tuning.')
            throw err
          }
        }}
      />

      <UpdateMeterDialog
        key={`meter-${openSeq}`}
        open={updatingMeter}
        currentMeter={bike.currentMeter}
        onClose={() => setUpdatingMeter(false)}
        onSubmit={async (km) => {
          try {
            await updateBike(bike.id, { currentMeter: km })
          } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Failed to update meter.')
            throw err
          }
        }}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete this tuning?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The tuning from {deleteTarget ? formatDate(deleteTarget.date) : ''} will be permanently
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

export default BikeDetailPage
