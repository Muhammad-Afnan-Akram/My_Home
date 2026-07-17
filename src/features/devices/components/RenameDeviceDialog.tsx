import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import type { ConnectedDevice } from '../types'

interface RenameDeviceDialogProps {
  /** The device to rename. Mount this dialog only while a device is selected. */
  device: ConnectedDevice
  onClose: () => void
  onSubmit: (name: string) => Promise<void> | void
}

/**
 * Rename a connected device. The name is saved against the device (by MAC) in
 * our database — the router itself can't store it. Clearing the field restores
 * the router-reported host name. Mount fresh per device (the parent renders it
 * only while a device is selected), so the field seeds from an initializer.
 */
function RenameDeviceDialog({ device, onClose, onSubmit }: RenameDeviceDialogProps) {
  const [value, setValue] = useState(device.customName || device.hostName || '')
  const [saving, setSaving] = useState(false)

  const trimmed = value.trim()
  const current = device.customName ?? ''
  const changed = trimmed !== current

  const handleSave = async () => {
    if (saving || !changed) return
    setSaving(true)
    try {
      await onSubmit(trimmed)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={() => !saving && onClose()} fullWidth maxWidth="xs">
      <DialogTitle>Rename device</DialogTitle>
      {saving && <LinearProgress />}
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Give this device a name you'll recognise. It's saved just for you
            {device.ipAddress ? ` (${device.ipAddress})` : ''}.
          </Typography>
          <TextField
            label="Device name"
            placeholder={device.hostName || 'e.g. Living room TV'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSave()
            }}
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { maxLength: 60 } }}
            helperText={current ? 'Clear the field to restore the default name.' : undefined}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleSave()} disabled={!changed || saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RenameDeviceDialog
