import { createTheme } from '@mui/material'
import { colors } from './colors'

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: colors.blueInteraction,
      dark: colors.blueFocus,
      light: colors.blueIleDeFrance,
    },
    success: {
      main: colors.greenDark,
      light: colors.greenLight,
    },
    error: {
      main: colors.redDark,
      light: colors.redLight,
    },
    warning: {
      main: colors.orangeDark,
      light: colors.orangeLight,
    },
    text: {
      primary: colors.anthracite,
      secondary: colors.greyDark,
    },
    background: {
      default: colors.appBackground,
      paper: colors.white,
    },
    divider: colors.greyMedium,
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 750 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          fontWeight: 700,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.white,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.blueInteraction,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
})
