import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import type { PropsWithChildren } from 'react'

const theme = createTheme({
  palette: {
    primary: {
      main: '#0057b8',
    },
    secondary: {
      main: '#e30613',
    },
  },
  shape: {
    borderRadius: 12,
  },
})

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
