import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useElectricity } from '../hooks/useElectricity'
import { computeCycleConsumption } from '../utils/billing'
import {
  AddReadingDialog,
  BillPanel,
  CycleSummary,
  MeterFormDialog,
  ReadingsList,
  discoLabel,
} from '../components'

function MeterDetailPage() {
  const { meterId = '' } = useParams()
  const navigate = useNavigate()
  const {
    loading,
    meters,
    readings,
    bills,
    fetchingIds,
    updateMeter,
    deleteMeter,
    addReading,
    deleteReading,
    saveBill,
    fetchBill,
  } = useElectricity()

  const meter = meters.find((m) => m.id === meterId)
  const meterReadings = useMemo(
    () => readings.filter((r) => r.meterId === meterId),
    [readings, meterId],
  )

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [addingReading, setAddingReading] = useState(false)

  // Auto-fetch the bill the first time an empty meter is opened.
  const autoTried = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!meter || autoTried.current.has(meter.id)) return
    const hasData = Boolean(bills[meter.id]) || meterReadings.length > 0
    if (hasData) return
    autoTried.current.add(meter.id)
    fetchBill(meter).catch(() => {
      /* manual Fetch button surfaces errors */
    })
  }, [meter, bills, meterReadings.length, fetchBill])

  if (loading) {
    return (
      <Screen title="Meter" back={ROUTES.electricity}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Screen>
    )
  }

  if (!meter) {
    return (
      <Screen title="Meter" back={ROUTES.electricity}>
        <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
          <Typography color="text.secondary">This meter no longer exists.</Typography>
          <Button variant="contained" onClick={() => navigate(ROUTES.electricity)}>
            Back to meters
          </Button>
        </Stack>
      </Screen>
    )
  }

  const consumption = computeCycleConsumption(meter, meterReadings, undefined, bills[meter.id])
  const latestValue = consumption.latestValue

  const handleDelete = async () => {
    await deleteMeter(meter.id)
    navigate(ROUTES.electricity)
  }

  const isFetching = fetchingIds.has(meter.id)

  const actions = (
    <IconButton aria-label="meter options" onClick={(e) => setMenuAnchor(e.currentTarget)}>
      <MoreVertIcon />
    </IconButton>
  )

  return (
    <Screen title={meter.name} back={ROUTES.electricity} actions={actions}>
      <Stack spacing={2} sx={{ pb: 10 }}>
        <Typography variant="body2" color="text.secondary">
          {discoLabel(meter.company)} · Ref {meter.referenceNumber}
        </Typography>

        {isFetching && (
          <Box>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary">
              Fetching latest bill…
            </Typography>
          </Box>
        )}

        <CycleSummary meter={meter} consumption={consumption} />

        <BillPanel meter={meter} bill={bills[meter.id]} onFetch={() => fetchBill(meter)} onSave={saveBill} />

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Readings
          </Typography>
          <ReadingsList readings={meterReadings} onDelete={deleteReading} />
        </Box>
      </Stack>

      <Fab
        color="primary"
        variant="extended"
        aria-label="add reading"
        onClick={() => setAddingReading(true)}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add reading
      </Fab>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            setEditing(true)
          }}
        >
          Edit meter
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            setConfirmDelete(true)
          }}
          sx={{ color: 'error.main' }}
        >
          Delete meter
        </MenuItem>
      </Menu>

      <MeterFormDialog
        open={editing}
        initial={meter}
        onClose={() => setEditing(false)}
        onSubmit={(values) => updateMeter(meter.id, values)}
      />

      <AddReadingDialog
        open={addingReading}
        meterId={meter.id}
        lastValue={latestValue}
        onClose={() => setAddingReading(false)}
        onSubmit={addReading}
      />

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Delete this meter?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{meter.name}” and all its readings will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Screen>
  )
}

export default MeterDetailPage
