import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import GlobalStyles from '@mui/material/GlobalStyles'
import CircularProgress from '@mui/material/CircularProgress'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import OilBarrelOutlinedIcon from '@mui/icons-material/OilBarrelOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import { ROUTES } from '@/constants'
import { Screen } from '@/components'
import { useCar } from '../hooks/carContext'
import { SERVICE_TYPES, serviceTypeMeta } from '../types'
import {
  effectiveInterval,
  formatDate,
  formatKm,
  formatRs,
  lastOilChangeReading,
  serviceStatus,
  sortServicesByDate,
} from '../utils/format'

/** Blue accent that signs the car module across the app. */
const ACCENT = '#3b82f6'

/** A compact KPI tile used in the report header grid. */
function Kpi({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tint: string
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, p: 1.75 }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            bgcolor: `${tint}1f`,
            color: tint,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }} noWrap>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Card>
  )
}

function CarReportPage() {
  const { carId = '' } = useParams()
  const navigate = useNavigate()
  const { loading, cars, services, oilChangeIntervalKm } = useCar()

  const car = cars.find((c) => c.id === carId)
  const carServices = useMemo(
    () => sortServicesByDate(services.filter((s) => s.carId === carId)),
    [services, carId],
  )

  const stats = useMemo(() => {
    const total = carServices.reduce((sum, s) => sum + s.cost, 0)
    const count = carServices.length
    const byType = SERVICE_TYPES.map((t) => ({
      ...t,
      count: carServices.filter((s) => s.type === t.value).length,
      spend: carServices.filter((s) => s.type === t.value).reduce((sum, s) => sum + s.cost, 0),
    }))
    const tally = {
      oil: carServices.filter((s) => s.oilChanged).length,
      oilFilter: carServices.filter((s) => s.oilFilterChanged).length,
      airFilter: carServices.filter((s) => s.airFilterChanged).length,
      fuelFilter: carServices.filter((s) => s.fuelFilterChanged).length,
      acFilter: carServices.filter((s) => s.acFilterChanged).length,
      coolant: carServices.filter((s) => s.coolantChanged).length,
    }
    // carServices is newest-first; first/last by date.
    const newest = carServices[0]
    const oldest = carServices[carServices.length - 1]
    return { total, count, byType, tally, newest, oldest }
  }, [carServices])

  if (loading) {
    return (
      <Screen title="Service report" back={ROUTES.car(carId)}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Screen>
    )
  }

  if (!car) {
    return (
      <Screen title="Service report" back={ROUTES.cars}>
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', py: 8 }}>
          <Typography variant="h6">Car not found</Typography>
          <Button variant="contained" onClick={() => navigate(ROUTES.cars)}>
            Back to cars
          </Button>
        </Stack>
      </Screen>
    )
  }

  const lastOil = lastOilChangeReading(carServices)
  const interval = effectiveInterval(car, oilChangeIntervalKm)
  const status = serviceStatus(interval, car.currentMeter, lastOil)
  const sinceOil = lastOil != null ? Math.max(0, car.currentMeter - lastOil) : null
  const period =
    stats.oldest && stats.newest
      ? stats.oldest.id === stats.newest.id
        ? formatDate(stats.newest.date)
        : `${formatDate(stats.oldest.date)} – ${formatDate(stats.newest.date)}`
      : '—'
  const maxTypeSpend = Math.max(1, ...stats.byType.map((t) => t.spend))

  const tallyItems = [
    { label: 'Oil changes', n: stats.tally.oil },
    { label: 'Oil filters', n: stats.tally.oilFilter },
    { label: 'Air filters', n: stats.tally.airFilter },
    { label: 'Fuel filters', n: stats.tally.fuelFilter },
    { label: 'AC filters', n: stats.tally.acFilter },
    { label: 'Coolant', n: stats.tally.coolant },
  ].filter((t) => t.n > 0)

  return (
    <Screen
      title="Service report"
      back={ROUTES.car(car.id)}
      actions={
        <Tooltip title="Print / Save as PDF">
          <IconButton aria-label="print report" onClick={() => window.print()}>
            <PrintOutlinedIcon />
          </IconButton>
        </Tooltip>
      }
    >
      {/* Hide app chrome when printing so only the report prints. */}
      <GlobalStyles
        styles={{
          '@media print': {
            '.MuiAppBar-root, .MuiFab-root, .no-print': { display: 'none !important' },
            body: { background: '#fff' },
          },
        }}
      />

      <Stack spacing={2} sx={{ pb: 6 }}>
        {/* Hero */}
        <Card
          variant="outlined"
          sx={{ borderRadius: 3, overflow: 'hidden', borderColor: 'transparent' }}
        >
          <Box
            sx={{
              position: 'relative',
              px: 2.5,
              py: 3,
              color: '#fff',
              background: car.imageUrl
                ? undefined
                : `linear-gradient(135deg, ${ACCENT}, #1e40af)`,
            }}
          >
            {car.imageUrl && (
              <>
                <Box
                  component="img"
                  src={car.imageUrl}
                  alt=""
                  sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(15,23,42,.82), rgba(30,64,175,.72))',
                  }}
                />
              </>
            )}
            <Stack direction="row" spacing={1.5} sx={{ position: 'relative', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(255,255,255,.18)',
                }}
              >
                <DirectionsCarIcon />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }} noWrap>
                  {car.make} {car.model}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }} noWrap>
                  {[car.year, car.variant, car.color].filter(Boolean).join(' · ') || '—'}
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              sx={{ position: 'relative', mt: 2, flexWrap: 'wrap', rowGap: 1 }}
            >
              <Chip
                label={car.registrationNumber}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 600 }}
              />
              <Chip
                label={formatKm(car.currentMeter)}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,.2)', color: '#fff' }}
              />
              {status && (
                <Chip
                  label={
                    status.overdue
                      ? 'Oil change due'
                      : `Next oil change in ${formatKm(status.remaining)}`
                  }
                  size="small"
                  sx={{
                    bgcolor: status.overdue ? 'rgba(239,68,68,.9)' : 'rgba(255,255,255,.2)',
                    color: '#fff',
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>
          </Box>
        </Card>

        {/* KPIs */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Kpi
            icon={<PaymentsOutlinedIcon />}
            label="Total spent"
            value={formatRs(stats.total)}
            tint="#16a34a"
          />
          <Kpi
            icon={<BuildOutlinedIcon />}
            label={`Service${stats.count === 1 ? '' : 's'}`}
            value={String(stats.count)}
            tint={ACCENT}
          />
          <Kpi
            icon={<OilBarrelOutlinedIcon />}
            label="Oil changes"
            value={String(stats.tally.oil)}
            tint="#9333ea"
          />
          <Kpi
            icon={<SpeedOutlinedIcon />}
            label="Since oil change"
            value={sinceOil != null ? formatKm(sinceOil) : '—'}
            tint="#f59e0b"
          />
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Service period: {period}
          {stats.count > 0 && ` · Avg ${formatRs(stats.total / stats.count)} / service`}
        </Typography>

        {/* Spend by type */}
        {stats.total > 0 && (
          <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Spend by category
            </Typography>
            <Stack spacing={1.5}>
              {stats.byType
                .filter((t) => t.spend > 0)
                .map((t) => (
                  <Box key={t.value}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {t.label}{' '}
                        <Typography component="span" variant="caption" color="text.secondary">
                          ({t.count})
                        </Typography>
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatRs(t.spend)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(t.spend / maxTypeSpend) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': { backgroundColor: t.color, borderRadius: 4 },
                      }}
                    />
                  </Box>
                ))}
            </Stack>
          </Card>
        )}

        {/* Parts tally */}
        {tallyItems.length > 0 && (
          <Card variant="outlined" sx={{ borderRadius: 3, p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Parts & fluids replaced
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {tallyItems.map((t) => (
                <Chip
                  key={t.label}
                  label={`${t.label} ×${t.n}`}
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              ))}
            </Stack>
          </Card>
        )}

        {/* Timeline */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Service timeline
          </Typography>
          {carServices.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No services recorded yet.
            </Typography>
          ) : (
            <Box>
              {carServices.map((s, i) => {
                const meta = serviceTypeMeta(s.type)
                const parts: string[] = []
                if (s.oilChanged) {
                  const detail = [s.oilBrand, s.oilGrade, s.oilLiters ? `${s.oilLiters}L` : null]
                    .filter(Boolean)
                    .join(' ')
                  parts.push(detail ? `Engine oil — ${detail}` : 'Engine oil')
                }
                if (s.oilFilterChanged) parts.push('Oil filter')
                if (s.airFilterChanged) parts.push('Air filter')
                if (s.fuelFilterChanged) parts.push('Fuel filter')
                if (s.acFilterChanged) parts.push('AC filter')
                if (s.coolantChanged) parts.push('Coolant')
                const isLast = i === carServices.length - 1
                return (
                  <Box key={s.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
                    {/* Rail: a dot, with a continuous connector line behind it. */}
                    <Box sx={{ position: 'relative', width: 14, flexShrink: 0 }}>
                      {!isLast && (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top: 18,
                            bottom: 0,
                            width: 2,
                            bgcolor: 'divider',
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          position: 'relative',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          mt: 0.5,
                          bgcolor: meta.color,
                          boxShadow: `0 0 0 3px ${meta.color}33`,
                        }}
                      />
                    </Box>
                    {/* Content — pb gives the gap below each card */}
                    <Box sx={{ flex: 1, pb: isLast ? 0 : 2.5 }}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          p: 1.5,
                          borderLeft: '3px solid',
                          borderLeftColor: meta.color,
                        }}
                      >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
                      >
                        <Chip
                          size="small"
                          label={meta.label}
                          sx={{ bgcolor: `${meta.color}1f`, color: meta.color, fontWeight: 600 }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {formatDate(s.date)}
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        {s.cost > 0 && (
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {formatRs(s.cost)}
                          </Typography>
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {formatKm(s.meterReading)}
                      </Typography>
                      {parts.length > 0 && (
                        <Box sx={{ mt: 0.75 }}>
                          {parts.map((p) => (
                            <Typography key={p} variant="body2" sx={{ display: 'flex', gap: 0.75 }}>
                              <Box component="span" sx={{ color: meta.color }}>
                                •
                              </Box>
                              {p}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      {s.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.75, whiteSpace: 'pre-wrap' }}
                        >
                          {s.description}
                        </Typography>
                      )}
                      </Card>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>

        <Divider />
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {car.make} {car.model} · {car.registrationNumber} · My Home
        </Typography>
      </Stack>
    </Screen>
  )
}

export default CarReportPage
