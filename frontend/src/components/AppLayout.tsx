import { AppBar, Container, Toolbar, Typography } from '@mui/material'
import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography component="span" sx={{ fontWeight: 700 }} variant="h6">
            Comutitres
          </Typography>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  )
}
