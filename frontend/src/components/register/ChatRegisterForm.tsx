import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type FormData = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmation: string
  rgpdConsent: boolean
}

type Message = { id: number; from: 'bot' | 'user'; text: string }

type Step = {
  field: keyof FormData
  type: 'text' | 'email' | 'password' | 'consent'
  question: (data: FormData) => string
  placeholder?: string
}

const EMPTY: FormData = { firstName: '', lastName: '', email: '', password: '', confirmation: '', rgpdConsent: false }

const WELCOME =
  "Bonjour ! 👋 Je suis l'assistant Comutitres. Je vais vous guider pour créer votre compte en moins de 2 minutes.\n\nComutitres centralise tous vos titres de transport Île-de-France (Navigo, Vélib'...) dans une seule application.\n\nCommençons ! Quel est votre prénom ?"

const steps: Step[] = [
  {
    field: 'firstName',
    type: 'text',
    question: () => WELCOME,
    placeholder: 'Votre prénom...',
  },
  {
    field: 'lastName',
    type: 'text',
    question: (d) =>
      `Enchanté·e ${d.firstName} ! 😊 Et votre nom de famille ?`,
    placeholder: 'Votre nom...',
  },
  {
    field: 'email',
    type: 'email',
    question: (d) =>
      `Merci ${d.firstName} ! Quelle adresse e-mail souhaitez-vous utiliser ?\n\nElle servira à vous connecter et à recevoir vos confirmations — nous ne l'utilisons à aucune autre fin.`,
    placeholder: 'exemple@mail.com',
  },
  {
    field: 'password',
    type: 'password',
    question: () =>
      'Parfait !  Créez maintenant un mot de passe sécurisé.\n\nIl doit contenir au moins 10 caractères, avec une majuscule, une minuscule et un chiffre.',
    placeholder: 'Mot de passe...',
  },
  {
    field: 'confirmation',
    type: 'password',
    question: () =>
      'Presque fini ! Pour éviter toute erreur de frappe, saisissez votre mot de passe une deuxième fois.',
    placeholder: 'Confirmer le mot de passe...',
  },
  {
    field: 'rgpdConsent',
    type: 'consent',
    question: () =>
      'Vous y êtes presque ! \n\nConformément au RGPD, nous avons besoin de votre accord pour traiter vos données personnelles. Vos données servent uniquement à gérer votre compte et vos abonnements — elles ne sont jamais revendues ni partagées.\n\nAcceptez-vous notre politique de confidentialité ?',
  },
]

interface Props {
  onRegister: (data: Omit<FormData, 'confirmation'>) => Promise<void>
}

export function ChatRegisterForm({ onRegister }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [step, setStep] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [formData, setFormData] = useState<FormData>(EMPTY)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [restartKey, setRestartKey] = useState(0)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const idRef = useRef(0)

  function nextId() { return ++idRef.current }

  function addBot(text: string) {
    setMessages(prev => [...prev, { id: nextId(), from: 'bot', text }])
  }

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    idRef.current = 0
    setIsTyping(true)
    const t = setTimeout(() => {
      setIsTyping(false)
      setMessages([{ id: nextId(), from: 'bot', text: steps[0].question(EMPTY) }])
      setShowInput(true)
      setTimeout(() => inputRef.current?.focus(), 50)
    }, 1000)
    return () => clearTimeout(t)
  }, [restartKey]) // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setMessages([])
    setStep(0)
    setInputValue('')
    setShowInput(false)
    setShowConsent(false)
    setIsTyping(false)
    setFormData(EMPTY)
    setError('')
    setLoading(false)
    setRestartKey(k => k + 1)
  }

  function validate(value: string, currentStep: number, data: FormData): string | null {
    if (!value.trim()) return 'Ce champ est requis.'
    if (steps[currentStep].type === 'email' && !value.includes('@')) return 'Adresse e-mail invalide.'
    if (currentStep === 4 && value !== data.password) return 'Les mots de passe ne correspondent pas.'
    return null
  }

  function handleSend() {
    const value = inputValue.trim()
    const err = validate(value, step, formData)
    if (err) { setError(err); return }
    setError('')

    const newData = { ...formData, [steps[step].field]: value }
    setFormData(newData)
    setMessages(prev => [...prev, { id: nextId(), from: 'user', text: steps[step].type === 'password' ? '••••••••' : value }])
    setInputValue('')
    setShowInput(false)

    const next = step + 1
    setStep(next)
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      if (next < steps.length) {
        addBot(steps[next].question(newData))
        if (steps[next].type === 'consent') {
          setShowConsent(true)
        } else {
          setShowInput(true)
          setTimeout(() => inputRef.current?.focus(), 50)
        }
      }
    }, 900)
  }

  async function handleConsent(accepted: boolean) {
    setShowConsent(false)
    setMessages(prev => [...prev, { id: nextId(), from: 'user', text: accepted ? "Oui, j'accepte ✅" : 'Non, je refuse' }])

    if (!accepted) {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        addBot('Pas de problème — vous pouvez choisir de ne pas accepter, mais nous ne pouvons pas créer votre compte sans ce consentement. Souhaitez-vous reconsidérer ?')
        setShowConsent(true)
      }, 900)
      return
    }

    setIsTyping(true)
    setTimeout(async () => {
      setIsTyping(false)
      addBot('Parfait !  Je crée votre compte, un instant...')
      setLoading(true)
      try {
        await onRegister({ ...formData, rgpdConsent: true })
      } catch (err) {
        addBot(err instanceof Error ? `Oups ! ${err.message} Voulez-vous réessayer ?` : 'Une erreur inattendue est survenue. Veuillez réessayer.')
        setLoading(false)
      }
    }, 900)
  }

  const progress = Math.round((step / steps.length) * 100)

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 460,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        height: { xs: '82vh', md: 600 },
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, py: 1.75, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0 }}>
          C
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1 }}>
            Assistant Comutitres
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.4 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ade80', flexShrink: 0 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>En ligne</Typography>
          </Stack>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <IconButton
            onClick={reset}
            size="small"
            title="Recommencer"
            sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <RefreshIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography
            component={Link}
            to="/auth/login"
            sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, textDecoration: 'none', '&:hover': { color: '#fff' }, ml: 0.5 }}
          >
            Se connecter
          </Typography>
        </Stack>
      </Box>

      {/* Progress bar */}
      <Box sx={{ height: 3, bgcolor: '#dbeafe', flexShrink: 0 }}>
        <Box sx={{ height: '100%', bgcolor: 'primary.main', width: `${progress}%`, transition: 'width 0.5s ease' }} />
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#f8fafc' }}>
        {messages.map((msg) => (
          <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 0.75 }}>
            {msg.from === 'bot' && (
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, color: '#fff', flexShrink: 0 }}>
                C
              </Box>
            )}
            <Box
              sx={{
                maxWidth: '78%',
                px: 1.75,
                py: 1,
                borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                bgcolor: msg.from === 'user' ? 'primary.main' : '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              }}
            >
              <Typography sx={{ fontSize: 13, color: msg.from === 'user' ? '#fff' : 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {msg.text}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Typing animation */}
        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, color: '#fff', flexShrink: 0 }}>
              C
            </Box>
            <Box sx={{ px: 1.75, py: 1.25, borderRadius: '16px 16px 16px 4px', bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0, 0.18, 0.36].map((delay, i) => (
                <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled', animation: 'bounce 1s infinite', animationDelay: `${delay}s`, '@keyframes bounce': { '0%,60%,100%': { transform: 'translateY(0)' }, '30%': { transform: 'translateY(-5px)' } } }} />
              ))}
            </Box>
          </Box>
        )}

        {/* Consent buttons */}
        {showConsent && !isTyping && (
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 0.5 }}>
            <Button variant="outlined" size="small" onClick={() => handleConsent(false)} sx={{ borderRadius: 50, textTransform: 'none', fontSize: 12 }}>
              Non, je refuse
            </Button>
            <Button variant="contained" size="small" onClick={() => handleConsent(true)} disabled={loading} sx={{ borderRadius: 50, textTransform: 'none', fontSize: 12 }}>
              Oui, j'accepte ✅
            </Button>
          </Stack>
        )}

        <div ref={messagesEnd} />
      </Box>

      {/* Error */}
      {error && (
        <Box sx={{ px: 2, py: 0.75, bgcolor: '#fee2e2', flexShrink: 0 }}>
          <Typography sx={{ fontSize: 12, color: 'error.main' }}>{error}</Typography>
        </Box>
      )}

      {/* Input */}
      {showInput && (
        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
          <TextField
            inputRef={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
            placeholder={steps[step]?.placeholder ?? ''}
            type={steps[step]?.type === 'password' ? 'password' : steps[step]?.type === 'email' ? 'email' : 'text'}
            size="small"
            fullWidth
            autoComplete="off"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 50 } }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
            sx={{ bgcolor: 'primary.main', color: '#fff', width: 38, height: 38, flexShrink: 0, '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}
