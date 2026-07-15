import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IosShareIcon from '@mui/icons-material/IosShare'
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'
import BoltIcon from '@mui/icons-material/Bolt'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import RouterIcon from '@mui/icons-material/Router'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import LogoutIcon from '@mui/icons-material/Logout'
import InstallMobileIcon from '@mui/icons-material/InstallMobile'
import type { SvgIconComponent } from '@mui/icons-material'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useAuth } from '@/features/auth'
import { useInstallPrompt } from '@/pwa/useInstallPrompt'

interface ModuleDef {
  key: string
  title: string
  desc: string
  icon: SvgIconComponent
  color: string
  route?: string
}

const MODULES: ModuleDef[] = [
  {
    key: 'electricity',
    title: 'Electricity',
    desc: 'Meters, bills & usage',
    icon: BoltIcon,
    color: '#f59e0b',
    route: ROUTES.electricity,
  },
  {
    key: 'car',
    title: 'Car',
    desc: 'Services, oil & repairs',
    icon: DirectionsCarIcon,
    color: '#3b82f6',
    route: ROUTES.cars,
  },
  {
    key: 'bike',
    title: 'Bike Tuning',
    desc: 'Tunings & meter',
    icon: TwoWheelerIcon,
    color: '#10b981',
    route: ROUTES.bikes,
  },
  {
    key: 'devices',
    title: 'Devices',
    desc: 'Wi-Fi clients & blocking',
    icon: RouterIcon,
    color: '#6366f1',
    route: ROUTES.devices,
  },
  {
    key: 'water',
    title: 'Water',
    desc: 'Coming soon',
    icon: WaterDropIcon,
    color: '#06b6d4',
  },
]

function HomePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { canInstall, promptInstall, showIOSInstall } = useInstallPrompt()
  const [iosGuideOpen, setIosGuideOpen] = useState(false)

  const actions = (
    <>
      {(canInstall || showIOSInstall) && (
        <Tooltip title="Install app">
          <IconButton
            aria-label="install app"
            onClick={() => (showIOSInstall ? setIosGuideOpen(true) : promptInstall())}
          >
            <InstallMobileIcon />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title={`Sign out${user?.email ? ` (${user.email})` : ''}`}>
        <IconButton aria-label="sign out" onClick={() => signOut()}>
          <LogoutIcon />
        </IconButton>
      </Tooltip>
    </>
  )

  return (
    <Screen title="My Home" actions={actions}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your home, one place. Pick a module to get started.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 2,
        }}
      >
        {MODULES.map((mod) => {
          const Icon = mod.icon
          const enabled = Boolean(mod.route)
          return (
            <Card
              key={mod.key}
              variant="outlined"
              sx={{
                borderRadius: 3,
                height: '100%',
                opacity: enabled ? 1 : 0.7,
                transition: 'box-shadow .2s, transform .2s, border-color .2s',
                ...(enabled && {
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-3px)',
                    borderColor: mod.color,
                  },
                }),
              }}
            >
              <CardActionArea
                disabled={!enabled}
                onClick={() => mod.route && navigate(mod.route)}
                sx={{
                  height: '100%',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  justifyContent: 'flex-start',
                  // Subtle accent wash so each tile reads as its module's colour.
                  background: `linear-gradient(150deg, ${mod.color}14, transparent 70%)`,
                }}
              >
                <Stack spacing={1.25} sx={{ height: 150, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: `${mod.color}22`,
                      color: mod.color,
                    }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {mod.title}
                  </Typography>
                  {enabled ? (
                    <Typography variant="caption" color="text.secondary">
                      {mod.desc}
                    </Typography>
                  ) : (
                    <Chip size="small" label="Coming soon" variant="outlined" />
                  )}
                </Stack>
              </CardActionArea>
            </Card>
          )
        })}
      </Box>

      <Dialog open={iosGuideOpen} onClose={() => setIosGuideOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add to Home Screen</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            On iPhone, install from <b>Safari</b> (this doesn't work in Chrome on iOS):
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <IosShareIcon color="primary" />
              <Typography variant="body2">
                1. Tap the <b>Share</b> button in Safari's toolbar.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <AddBoxOutlinedIcon color="primary" />
              <Typography variant="body2">
                2. Scroll down and tap <b>Add to Home Screen</b>.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <InstallMobileIcon color="primary" />
              <Typography variant="body2">
                3. Tap <b>Add</b> — “My Home” appears on your home screen.
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setIosGuideOpen(false)}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Screen>
  )
}

export default HomePage
