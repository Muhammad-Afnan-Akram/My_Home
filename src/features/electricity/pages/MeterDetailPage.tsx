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
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useElectricity } from '../hooks/electricityContext'
import { computeCycleConsumption } from '../utils/billing'
import { formatLongDate, isCurrentMonthISO } from '../utils/date'
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
    unitLimit,
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
  // Bump on open so each dialog remounts fresh (re-reads props) without a reset effect.
  const [openSeq, setOpenSeq] = useState(0)
  const openEditing = () => {
    setOpenSeq((n) => n + 1)
    setEditing(true)
  }
  const openAddReading = () => {
    setOpenSeq((n) => n + 1)
    setAddingReading(true)
  }

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

  const bill = bills[meter.id]
  const consumption = computeCycleConsumption(meter, meterReadings, undefined, bill, unitLimit)
  const latestValue = consumption.latestValue

  // The bill we're calculating from isn't this month's — flag usage as estimated.
  const isLatestBill = Boolean(bill?.issueDate && isCurrentMonthISO(bill.issueDate))
  const estimated = consumption.anchoredToBill && !isLatestBill

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

        {estimated && (
          <Alert
            severity="warning"
            icon={false}
            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'warning.main' }}
          >
            <AlertTitle sx={{ fontWeight: 700 }}>⚠ Estimated Data</AlertTitle>
            No newer MEPCO bill is available yet. Current usage is being calculated using the
            last official bill dated {formatLongDate(consumption.cycleStart)}.
          </Alert>
        )}

        <CycleSummary consumption={consumption} unitLimit={unitLimit} estimated={estimated} />

        <BillPanel
          meter={meter}
          bill={bills[meter.id]}
          unitLimit={unitLimit}
          onFetch={() => fetchBill(meter)}
          onSave={saveBill}
        />

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
        onClick={openAddReading}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        <AddIcon sx={{ mr: 1 }} />
        Add reading
      </Fab>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            openEditing()
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
        key={`edit-${openSeq}`}
        open={editing}
        initial={meter}
        unitLimit={unitLimit}
        onClose={() => setEditing(false)}
        onSubmit={(values) => updateMeter(meter.id, values)}
      />

      <AddReadingDialog
        key={`reading-${openSeq}`}
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
