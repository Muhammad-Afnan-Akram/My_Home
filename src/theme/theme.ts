import { createTheme } from '@mui/material/styles'

/**
 * Central MUI theme. Tweak palette, typography, and component
 * defaults here so the whole app stays visually consistent.
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
  },
  shape: {
    borderRadius: 8,
  },
})

export default theme
