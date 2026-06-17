import { Box, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { RegisterModeSelector } from '../components/register/RegisterModeSelector'
import { ChatRegisterForm } from '../components/register/ChatRegisterForm'
import { SimpleRegisterForm } from '../components/register/SimpleRegisterForm'
import { useAuth } from '../hooks/useAuth'
import { register } from '../services/auth.service'

type Mode = 'select' | 'chat' | 'form'

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  rgpdConsent: boolean
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const [mode, setMode] = useState<Mode>('select')

  async function handleRegister(data: RegisterData) {
    const response = await register(data)
    setSession(response.token, response.user)
    navigate('/onboarding', { state: { fromSimpleForm: mode === 'form' } })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: mode === 'select' ? 580 : 480, display: 'flex', flexDirection: 'column' }}>
          {mode !== 'select' && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setMode('select')}
              variant="text"
              size="small"
              sx={{ alignSelf: 'flex-start', mb: 2, textTransform: 'none', color: 'text.secondary', fontSize: 13, '&:hover': { bgcolor: 'transparent', color: 'text.primary' } }}
            >
              Choisir une autre méthode
            </Button>
          )}

          {mode === 'select' && <RegisterModeSelector onSelect={setMode} />}
          {mode === 'chat' && <ChatRegisterForm onRegister={handleRegister} />}
          {mode === 'form' && <SimpleRegisterForm onRegister={handleRegister} />}
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}
