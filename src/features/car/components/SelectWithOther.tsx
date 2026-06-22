import { useState } from 'react'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import { OTHER } from '../types'

interface SelectWithOtherProps {
  label: string
  /** The resolved value (a listed option, or a custom free-text value). */
  value: string
  onChange: (value: string) => void
  options: string[]
  helperText?: string
  /** Disable the whole control (e.g. until a parent field is chosen). */
  disabled?: boolean
}

/**
 * A dropdown whose last entry is "Other…". Picking it reveals a text field so
 * the user can type any value not in the list. Custom values survive editing:
 * if `value` isn't one of `options`, the control opens in "Other" mode.
 */
function SelectWithOther({
  label,
  value,
  onChange,
  options,
  helperText,
  disabled,
}: SelectWithOtherProps) {
  const [otherMode, setOtherMode] = useState(() => value !== '' && !options.includes(value))

  const handleSelect = (selected: string) => {
    if (selected === OTHER) {
      setOtherMode(true)
      onChange('') // start the custom value empty
    } else {
      setOtherMode(false)
      onChange(selected)
    }
  }

  return (
    <Stack spacing={2}>
      <TextField
        select
        label={label}
        value={otherMode ? OTHER : value}
        onChange={(e) => handleSelect(e.target.value)}
        fullWidth
        disabled={disabled}
        helperText={!otherMode ? helperText : undefined}
      >
        {options.map((o) => (
          <MenuItem key={o} value={o}>
            {o}
          </MenuItem>
        ))}
        <MenuItem value={OTHER}>Other…</MenuItem>
      </TextField>
      {otherMode && (
        <TextField
          label={`${label} name`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          fullWidth
          autoFocus
          placeholder="Type a name"
        />
      )}
    </Stack>
  )
}

export default SelectWithOther
