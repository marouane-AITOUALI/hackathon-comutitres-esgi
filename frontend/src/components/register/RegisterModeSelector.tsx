import { Box, Button, Stack, Typography } from '@mui/material'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import { Link } from 'react-router-dom'

interface Props {
  onSelect: (mode: 'chat' | 'form') => void
}

export function RegisterModeSelector({ onSelect }: Props) {
  return (
    <Box sx={{ width: '100%', maxWidth: 560 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Créer mon compte 🎉
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choisissez comment vous souhaitez procéder.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {/* Option chat */}
        <Box
          onClick={() => onSelect('chat')}
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'primary.main',
            bgcolor: 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: '#EEF4FF', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(25,114,210,0.12)' },
          }}
        >
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#DDEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <ChatBubbleOutlineIcon color="primary" />
          </Box>
          <Typography sx={{ fontWeight: 700, mb: 0.75 }}>
            Avec l'assistant ✨
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Répondez à quelques questions guidées. Simple, rapide et agréable — parfait si c'est votre première fois.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2.5, borderRadius: 50, textTransform: 'none', fontWeight: 700 }}
            onClick={(e) => { e.stopPropagation(); onSelect('chat') }}
          >
            Démarrer le guide
          </Button>
        </Box>

        {/* Option formulaire */}
        <Box
          onClick={() => onSelect('form')}
          sx={{
            flex: 1,
            p: 3,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.07)' },
          }}
        >
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <AssignmentOutlinedIcon sx={{ color: 'text.secondary' }} />
          </Box>
          <Typography sx={{ fontWeight: 700, mb: 0.75 }}>
            Formulaire classique
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Remplissez tous les champs en une seule fois. Idéal si vous connaissez déjà la procédure.
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2.5, borderRadius: 50, textTransform: 'none', fontWeight: 700 }}
            onClick={(e) => { e.stopPropagation(); onSelect('form') }}
          >
            Formulaire classique
          </Button>
        </Box>
      </Stack>

      <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 13, color: 'text.secondary' }}>
        Déjà inscrit ?{' '}
        <Typography component={Link} to="/auth/login" color="primary" sx={{ fontWeight: 600, textDecoration: 'none' }}>
          Se connecter
        </Typography>
      </Typography>
    </Box>
  )
}
