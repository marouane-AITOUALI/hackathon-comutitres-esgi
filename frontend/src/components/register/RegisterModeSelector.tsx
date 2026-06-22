import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined'
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined'
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined'
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface Props {
  onSelect: (mode: 'chat' | 'form') => void
}

function FeatureRow({ icon, label, description }: { icon: ReactNode; label: string; description?: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.09)', flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{label}</Typography>
      </Box>
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{description}</Typography>
      )}
    </Stack>
  )
}

export function RegisterModeSelector({ onSelect }: Props) {
  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.5, letterSpacing: -0.5 }}>
          Créer mon compte 
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choisissez comment vous souhaitez procéder.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <Box
          onClick={() => onSelect('chat')}
          sx={{
            flex: 1,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: '2px solid',
            borderColor: 'primary.main',
            bgcolor: 'background.paper',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 32px rgba(99,102,241,0.18)' },
          }}
        >
          <Chip
            label="Recommandé ✨"
            size="small"
            sx={{ position: 'absolute', top: 16, right: 16, bgcolor: '#FFF9E6', color: '#9A6700', fontWeight: 700, fontSize: 11, border: '1px solid #FFE599' }}
          />

          <Box sx={{ width: 52, height: 52, borderRadius: 2.5, background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
            <ChatBubbleOutlineIcon sx={{ color: '#fff', fontSize: 26 }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Avec l'assistant ✨
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
            Répondez à quelques questions guidées. Simple, rapide et agréable — parfait si c'est votre première fois.
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <FeatureRow
              icon={<BoltOutlinedIcon sx={{ fontSize: 18, color: '#f59e0b' }} />}
              label="Rapide"
              description="Environ 2 min"
            />
            <FeatureRow
              icon={<CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#6366f1' }} />}
              label="Guidé pas à pas"
              description="On vous accompagne"
            />
            <FeatureRow
              icon={<EmojiEmotionsOutlinedIcon sx={{ fontSize: 18, color: '#9ca3af' }} />}
              label="Facile & personnalisé"
              description="Adapté à votre profil"
            />
          </Stack>

          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{
              borderRadius: 50,
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
              fontSize: 15,
              background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
              '&:hover': { background: 'linear-gradient(90deg, #4f46e5, #2563eb)' },
            }}
            onClick={(e) => { e.stopPropagation(); onSelect('chat') }}
          >
            Démarrer le guide &nbsp;→
          </Button>
        </Box>

        <Box
          onClick={() => onSelect('form')}
          sx={{
            flex: 1,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: '1.5px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'primary.light', transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.07)' },
          }}
        >
          <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: '#EEF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
            <AssignmentOutlinedIcon sx={{ color: '#6366f1', fontSize: 26 }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Formulaire classique
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
            Remplissez tous les champs en une seule fois. Idéal si vous connaissez déjà la procédure.
          </Typography>

          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <FeatureRow
              icon={<ListAltOutlinedIcon sx={{ fontSize: 18, color: '#6366f1' }} />}
              label="Tous les champs à remplir"
            />
            <FeatureRow
              icon={<ThumbUpOutlinedIcon sx={{ fontSize: 18, color: '#6366f1' }} />}
              label="Idéal si vous êtes déjà à l'aise"
            />
            <FeatureRow
              icon={<SearchOutlinedIcon sx={{ fontSize: 18, color: '#6366f1' }} />}
              label="Aucune question guidée"
            />
          </Stack>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            sx={{ borderRadius: 50, textTransform: 'none', fontWeight: 700, py: 1.5, fontSize: 15 }}
            onClick={(e) => { e.stopPropagation(); onSelect('form') }}
          >
            Accéder au formulaire &nbsp;→
          </Button>
        </Box>
      </Stack>

      <Typography sx={{ textAlign: 'center', mt: 3.5, fontSize: 14, color: 'text.secondary' }}>
        Déjà inscrit ?{' '}
        <Typography
          component={Link}
          to="/auth/login"
          color="primary"
          sx={{ fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          Se connecter &rsaquo;
        </Typography>
      </Typography>
    </Box>
  )
}
