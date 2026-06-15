import { createTheme } from '@mui/material'
import { colors } from './colors'

export const muiTheme = createTheme({
  palette: {
    primary: { main: colors.blueInteraction, dark: colors.blueFocus },
    success: { main: colors.greenDark },
    error: { main: colors.redDark },
    text: { primary: colors.anthracite, secondary: colors.greyDark },
    background: { default: colors.blueLight, paper: colors.white },
    divider: colors.greyMedium,
  },
  shape: { borderRadius: 14 },
  typography: { fontFamily: 'Inter, system-ui, sans-serif', h1: { fontWeight: 800 }, h2: { fontWeight: 750 } },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 44, fontWeight: 700, textTransform: 'none' } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: colors.white } } },
  },
})
