import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import BoltIcon from '@mui/icons-material/Bolt'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import LogoutIcon from '@mui/icons-material/Logout'
import type { SvgIconComponent } from '@mui/icons-material'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useAuth } from '@/features/auth'

interface ModuleDef {
  key: string
  title: string
  icon: SvgIconComponent
  color: string
  route?: string
}

const MODULES: ModuleDef[] = [
  { key: 'electricity', title: 'Electricity', icon: BoltIcon, color: '#f59e0b', route: ROUTES.electricity },
  { key: 'car', title: 'Car', icon: DirectionsCarIcon, color: '#3b82f6' },
  { key: 'bike', title: 'Bike Tuning', icon: TwoWheelerIcon, color: '#10b981' },
  { key: 'water', title: 'Water', icon: WaterDropIcon, color: '#06b6d4' },
]

function HomePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const actions = (
    <Tooltip title={`Sign out${user?.email ? ` (${user.email})` : ''}`}>
      <IconButton aria-label="sign out" onClick={() => signOut()}>
        <LogoutIcon />
      </IconButton>
    </Tooltip>
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
            <Card key={mod.key} variant="outlined" sx={{ borderRadius: 3, opacity: enabled ? 1 : 0.6 }}>
              <CardActionArea
                disabled={!enabled}
                onClick={() => mod.route && navigate(mod.route)}
                sx={{ p: 2, height: '100%' }}
              >
                <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: `${mod.color}22`,
                    }}
                  >
                    <Icon sx={{ color: mod.color }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {mod.title}
                  </Typography>
                  {!enabled && <Chip size="small" label="Coming soon" variant="outlined" />}
                </Stack>
              </CardActionArea>
            </Card>
          )
        })}
      </Box>
    </Screen>
  )
}

export default HomePage
