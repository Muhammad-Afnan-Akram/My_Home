import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

interface MainLayoutProps {
  children: ReactNode
}

/**
 * App shell. Individual screens render their own sticky <TopBar /> (via the
 * shared <Screen /> wrapper), so the layout only provides the full-height
 * background canvas.
 */
function MainLayout({ children }: MainLayoutProps) {
  return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>{children}</Box>
}

export default MainLayout
