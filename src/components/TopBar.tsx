import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface TopBarProps {
  title: string
  /** Show a back button. Pass a path to go there, or `true` to go back. */
  back?: boolean | string
  /** Optional trailing actions (icons/buttons). */
  actions?: ReactNode
}

/** Mobile-style top app bar with optional back navigation and actions. */
function TopBar({ title, back, actions }: TopBarProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof back === 'string') navigate(back)
    else navigate(-1)
  }

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        {back && (
          <IconButton edge="start" onClick={handleBack} aria-label="back" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="h1" noWrap sx={{ flex: 1, fontWeight: 600 }}>
          {title}
        </Typography>
        {actions && <Box sx={{ display: 'flex', gap: 0.5 }}>{actions}</Box>}
      </Toolbar>
    </AppBar>
  )
}

export default TopBar
