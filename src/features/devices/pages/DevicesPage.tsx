import { useState } from 'react'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Snackbar from '@mui/material/Snackbar'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import RefreshIcon from '@mui/icons-material/Refresh'
import RouterIcon from '@mui/icons-material/Router'
import ShieldIcon from '@mui/icons-material/Shield'
import SouthIcon from '@mui/icons-material/South'
import NorthIcon from '@mui/icons-material/North'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useDevices } from '../hooks/useDevices'
import { DeviceCard } from '../components'
import { formatBytes, formatRate, formatDuration } from '../utils/format'
import type { ConnectedDevice } from '../types'

const ACCENT = '#6366f1'

function DevicesPage() {
  const {
    loading,
    error,
    devices,
    traffic,
    whitelistMode,
    busyMac,
    applyingWhitelist,
    actionError,
    clearActionError,
    refresh,
    refreshing,
    block,
    unblock,
    setWhitelist,
  } = useDevices()
  const [confirmTarget, setConfirmTarget] = useState<ConnectedDevice | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const onlineCount = devices.filter((d) => d.online && !d.blocked).length
  const blockedCount = devices.filter((d) => d.blocked).length
  const allowedCount = devices.filter((d) => !d.blocked).length

  const confirmBlock = async () => {
    if (!confirmTarget) return
    const target = confirmTarget
    setConfirmTarget(null)
    await block(target)
  }

  // Open the keep-picker. In whitelist mode, preselect the devices that are
  // already allowed so editing starts from the current list.
  const openPicker = () => {
    setSelected(new Set(whitelistMode ? devices.filter((d) => !d.blocked).map((d) => d.mac) : []))
    setPickerOpen(true)
  }

  const toggle = (mac: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(mac)) next.delete(mac)
      else next.add(mac)
      return next
    })

  const applyWhitelist = async () => {
    setPickerOpen(false)
    await setWhitelist([...selected])
  }

  return (
    <Screen
      title="Devices"
      back={ROUTES.home}
      actions={
        <IconButton aria-label="refresh" onClick={() => void refresh()} disabled={loading || refreshing}>
          {refreshing ? <CircularProgress size={22} /> : <RefreshIcon />}
        </IconButton>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="warning" sx={{ mt: 1 }}>
          <AlertTitle>Can't reach the router</AlertTitle>
          {error}
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
            This tool talks to your Zong 4G device at <b>192.168.8.1</b>, which is only reachable on
            your home Wi-Fi. Run the app locally (<code>npm run dev</code>) on a device connected to
            that Wi-Fi.
          </Typography>
          <Button size="small" onClick={() => void refresh()} sx={{ mt: 1 }}>
            Try again
          </Button>
        </Alert>
      ) : (
        <>
          {/* Summary strip */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: `${ACCENT}1f`,
                color: ACCENT,
              }}
            >
              <RouterIcon />
            </Box>
            <Box sx={{ flex: 1, minWidth: 120 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Zong 4G
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {devices.length} device{devices.length === 1 ? '' : 's'} known
              </Typography>
            </Box>
            <Chip size="small" color="success" variant="outlined" label={`${onlineCount} online`} />
            {blockedCount > 0 && (
              <Chip size="small" color="error" label={`${blockedCount} blocked`} />
            )}
          </Stack>

          {/* Router traffic. Shown only when the firmware exposes counters; these
              are whole-router totals, not per device. */}
          {traffic && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flex: 1 }}>
                  <SouthIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                      {formatRate(traffic.downloadRate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      download
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flex: 1 }}>
                  <NorthIcon sx={{ fontSize: 18, color: ACCENT }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                      {formatRate(traffic.uploadRate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      upload
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
              <Typography variant="caption" color="text.secondary" component="div">
                This session: {formatBytes(traffic.sessionDownload)} ↓ ·{' '}
                {formatBytes(traffic.sessionUpload)} ↑
                {traffic.connectTime > 0 ? ` · up ${formatDuration(traffic.connectTime)}` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                Total: {formatBytes(traffic.totalDownload)} ↓ · {formatBytes(traffic.totalUpload)} ↑
              </Typography>
            </Box>
          )}

          {whitelistMode ? (
            <Alert
              severity="warning"
              icon={<ShieldIcon />}
              sx={{ mb: 2 }}
              action={
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Button size="small" color="inherit" onClick={openPicker} disabled={applyingWhitelist}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => void setWhitelist([])}
                    disabled={applyingWhitelist}
                  >
                    {applyingWhitelist ? <CircularProgress size={16} color="inherit" /> : 'Allow all'}
                  </Button>
                </Stack>
              }
            >
              <AlertTitle sx={{ mb: 0 }}>Only allowed devices can connect</AlertTitle>
              {allowedCount} device{allowedCount === 1 ? '' : 's'} allowed — everything else is blocked.
            </Alert>
          ) : (
            devices.length > 0 && (
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={
                  applyingWhitelist ? <CircularProgress size={16} color="inherit" /> : <ShieldIcon />
                }
                onClick={openPicker}
                disabled={applyingWhitelist || busyMac !== null}
                sx={{ mb: 2 }}
              >
                Block all except selected devices…
              </Button>
            )
          )}

          {devices.length === 0 ? (
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
                <RouterIcon sx={{ fontSize: 52, color: ACCENT }} />
              </Box>
              <Typography variant="h6">No devices found</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                Nothing is connected to the Zong Wi-Fi right now.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5} sx={{ pb: 4 }}>
              {devices.map((device) => (
                <DeviceCard
                  key={device.mac}
                  device={device}
                  busy={busyMac === device.mac}
                  disabled={busyMac !== null || applyingWhitelist}
                  whitelistMode={whitelistMode}
                  onBlock={() => setConfirmTarget(device)}
                  onUnblock={() => void unblock(device)}
                />
              ))}
            </Stack>
          )}
        </>
      )}

      <Dialog open={pickerOpen} onClose={() => setPickerOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Keep only these devices</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 1.5 }}>
            Ticked devices stay connected. <b>Every other device is blocked</b> and can't rejoin the
            Wi-Fi until you allow it again. Make sure the device you're using right now is ticked.
          </DialogContentText>
          <Stack>
            {devices.map((d) => (
              <FormControlLabel
                key={d.mac}
                sx={{ alignItems: 'flex-start', m: 0, py: 0.5 }}
                control={
                  <Checkbox
                    size="small"
                    checked={selected.has(d.mac)}
                    onChange={() => toggle(d.mac)}
                    sx={{ pt: 0.25 }}
                  />
                }
                label={
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {d.hostName || 'Unknown device'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap component="div">
                      {d.ipAddress ? `${d.ipAddress} · ` : ''}
                      {d.mac}
                      {d.online ? '' : ' · offline'}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickerOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={selected.size === 0}
            onClick={() => void applyWhitelist()}
          >
            Block all others ({selected.size})
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmTarget)} onClose={() => setConfirmTarget(null)}>
        <DialogTitle>Block this device?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            “{confirmTarget?.hostName || confirmTarget?.mac}” will be disconnected and won't be able
            to rejoin the Zong Wi-Fi until you unblock it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmBlock()}>
            Block
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(actionError)}
        autoHideDuration={6000}
        onClose={clearActionError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={clearActionError}>
          {actionError}
        </Alert>
      </Snackbar>
    </Screen>
  )
}

export default DevicesPage
