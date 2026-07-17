import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import LaptopMacIcon from '@mui/icons-material/LaptopMac'
import DevicesOtherIcon from '@mui/icons-material/DevicesOther'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import type { ReactNode } from 'react'
import type { ConnectedDevice } from '../types'

const ACCENT = '#6366f1'

/** Rough device-type guess from the host name, just to pick an icon. */
function iconFor(name: string | undefined): ReactNode {
  const n = (name ?? '').toLowerCase()
  if (/pc|laptop|macbook|desktop|lenovo|dell|hp|win/.test(n)) return <LaptopMacIcon />
  if (/phone|redmi|infinix|iphone|galaxy|vivo|oppo|realme|note|android|a0/.test(n)) {
    return <SmartphoneIcon />
  }
  return <DevicesOtherIcon />
}

interface DeviceCardProps {
  device: ConnectedDevice
  busy: boolean
  /** Another device's action is in flight — disable this one's button too. */
  disabled: boolean
  /**
   * Router is in allow-list mode. Per-device actions still work — blocking
   * removes the device from the allowed set — but the "restore" action reads
   * as "Allow" rather than "Unblock", and non-blocked devices show an
   * "Allowed" chip.
   */
  whitelistMode: boolean
  onBlock: () => void
  onUnblock: () => void
  /** Open the rename dialog for this device. */
  onRename: () => void
}

function DeviceCard({
  device,
  busy,
  disabled,
  whitelistMode,
  onBlock,
  onUnblock,
  onRename,
}: DeviceCardProps) {
  const icon = iconFor(device.customName || device.hostName)
  const title = device.customName || device.hostName || 'Unknown device'
  // When a custom name overrides a different router name, keep the original
  // visible as a hint so the device is still recognisable.
  const originalHint =
    device.customName && device.hostName && device.hostName !== device.customName
      ? device.hostName
      : null
  // What the "restore access" action is called depends on the router mode.
  const restoreLabel = whitelistMode ? 'Allow' : 'Unblock'

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: 1.75,
        opacity: device.blocked ? 0.85 : 1,
        borderColor: device.blocked ? 'error.light' : 'divider',
        transition: 'border-color .2s',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: device.blocked ? 'error.50' : `${ACCENT}1f`,
            color: device.blocked ? 'error.main' : ACCENT,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, minWidth: 0 }}>
              {title}
            </Typography>
            <IconButton
              size="small"
              aria-label="Rename device"
              onClick={onRename}
              disabled={disabled}
              sx={{ flexShrink: 0, color: 'text.secondary', p: 0.25 }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {device.ipAddress ? `${device.ipAddress} · ` : ''}
            {device.mac}
            {originalHint ? ` · ${originalHint}` : ''}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
            {device.online ? (
              <Chip
                size="small"
                icon={<CheckCircleIcon />}
                label="Online"
                color="success"
                variant="outlined"
                sx={{ height: 22 }}
              />
            ) : (
              <Chip size="small" label="Offline" variant="outlined" sx={{ height: 22 }} />
            )}
            {device.blocked && (
              <Chip
                size="small"
                icon={<BlockIcon />}
                label="Blocked"
                color="error"
                sx={{ height: 22 }}
              />
            )}
            {whitelistMode && !device.blocked && (
              <Chip
                size="small"
                icon={<CheckCircleIcon />}
                label="Allowed"
                color="success"
                sx={{ height: 22 }}
              />
            )}
          </Stack>
        </Box>

        <Button
          size="small"
          variant={device.blocked ? 'contained' : 'outlined'}
          color="error"
          disabled={disabled}
          onClick={device.blocked ? onUnblock : onBlock}
          startIcon={
            busy ? (
              <CircularProgress size={14} color="inherit" />
            ) : device.blocked ? (
              <CheckCircleIcon />
            ) : (
              <BlockIcon />
            )
          }
          sx={{
            flexShrink: 0,
            minWidth: 96,
            ...(device.blocked ? { bgcolor: ACCENT, '&:hover': { bgcolor: '#4f46e5' } } : {}),
          }}
        >
          {device.blocked ? restoreLabel : 'Block'}
        </Button>
      </Stack>
    </Card>
  )
}

export default DeviceCard
