import { AppBar, Container, Toolbar, Typography } from '@mui/material'
import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <>
      <AppBar color="default" position="static">
        <Toolbar>
          <Typography component="span" sx={{ fontWeight: 700 }} variant="h6">
            Comutitres Backoffice
          </Typography>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="xl" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  )
}
