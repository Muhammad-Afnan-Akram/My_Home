import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import { ElectricityProvider, ElectricityPage, MeterDetailPage } from '@/features/electricity'
import { BikeProvider, BikePage, BikeDetailPage } from '@/features/bike'
import { CarProvider, CarPage, CarDetailPage } from '@/features/car'
import { useAuth, AuthPage } from '@/features/auth'

function App() {
  const { loading, session, recovery } = useAuth()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  // During password recovery, force the "set new password" screen even though
  // the recovery link creates a temporary session.
  if (!session || recovery) {
    return <AuthPage />
  }

  return (
    <ElectricityProvider>
      <BikeProvider>
        <CarProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/electricity" element={<ElectricityPage />} />
              <Route path="/electricity/:meterId" element={<MeterDetailPage />} />
              <Route path="/bikes" element={<BikePage />} />
              <Route path="/bikes/:bikeId" element={<BikeDetailPage />} />
              <Route path="/cars" element={<CarPage />} />
              <Route path="/cars/:carId" element={<CarDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </CarProvider>
      </BikeProvider>
    </ElectricityProvider>
  )
}

export default App
