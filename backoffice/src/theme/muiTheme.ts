import { createTheme } from '@mui/material'
import { colors } from './colors'

export const muiTheme = createTheme({
  palette: {
    primary: { main: colors.blueInteraction, dark: colors.blueFocus },
    success: { main: colors.greenDark },
    error: { main: colors.redDark },
    warning: { main: colors.orangeDark },
    text: { primary: colors.anthracite, secondary: colors.greyDark },
    background: { default: colors.appBackground, paper: colors.white },
    divider: colors.greyMedium,
  },
  shape: { borderRadius: 14 },
  typography: { fontFamily: 'Inter, system-ui, sans-serif', h1: { fontWeight: 800 }, h2: { fontWeight: 750 } },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 44, fontWeight: 700, textTransform: 'none' } } },
    MuiCard: { styleOverrides: { root: { border: `1px solid ${colors.greyMedium}`, boxShadow: 'none' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
})
