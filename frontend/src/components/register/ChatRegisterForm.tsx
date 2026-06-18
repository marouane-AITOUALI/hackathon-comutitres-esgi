import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import RefreshIcon from '@mui/icons-material/Refresh'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
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
  { field: 'firstName', type: 'text', question: () => WELCOME, placeholder: 'Votre prénom...' },
  { field: 'lastName', type: 'text', question: (d) => `Enchanté·e ${d.firstName} ! 😊 Et votre nom de famille ?`, placeholder: 'Votre nom...' },
  { field: 'email', type: 'email', question: (d) => `Merci ${d.firstName} ! Quelle adresse e-mail souhaitez-vous utiliser ?\n\nElle servira à vous connecter et à recevoir vos confirmations — nous ne l'utilisons à aucune autre fin.`, placeholder: 'exemple@mail.com' },
  { field: 'password', type: 'password', question: () => 'Parfait ! Créez maintenant un mot de passe sécurisé.\n\nIl doit contenir au moins 10 caractères, avec une majuscule, une minuscule et un chiffre.', placeholder: 'Mot de passe...' },
  { field: 'confirmation', type: 'password', question: () => 'Presque fini ! Pour éviter toute erreur de frappe, saisissez votre mot de passe une deuxième fois.', placeholder: 'Confirmer le mot de passe...' },
  { field: 'rgpdConsent', type: 'consent', question: () => 'Vous y êtes presque ! \n\nConformément au RGPD, nous avons besoin de votre accord pour traiter vos données personnelles. Vos données servent uniquement à gérer votre compte et vos abonnements — elles ne sont jamais revendues ni partagées.\n\nAcceptez-vous notre politique de confidentialité ?' },
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
  function addBot(text: string) { setMessages(prev => [...prev, { id: nextId(), from: 'bot', text }]) }

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

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
  }, [restartKey])

  function reset() {
    setMessages([]); setStep(0); setInputValue(''); setShowInput(false)
    setShowConsent(false); setIsTyping(false); setFormData(EMPTY)
    setError(''); setLoading(false); setRestartKey(k => k + 1)
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
        if (steps[next].type === 'consent') { setShowConsent(true) }
        else { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50) }
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
      addBot('Parfait ! Je crée votre compte, un instant...')
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
        maxWidth: 540,
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: { xs: '82vh', md: 640 },
        boxShadow: '0 24px 80px rgba(99,102,241,0.18)',
      }}
    >
      {/* Header gradient */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backdropFilter: 'blur(8px)',
          }}
        >
          <SmartToyOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>
            Assistant Comutitres
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.4 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ade80', flexShrink: 0, animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>En ligne</Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <IconButton
            onClick={reset}
            size="small"
            title="Recommencer"
            sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.15)' } }}
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
      <Box sx={{ height: 4, bgcolor: 'rgba(99,102,241,0.12)', flexShrink: 0 }}>
        <Box
          sx={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
            width: `${progress}%`,
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2.5,
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          background: 'linear-gradient(180deg, #f5f7ff 0%, #eef2ff 100%)',
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: 1,
              animation: 'fadeIn 0.25s ease',
              '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
            }}
          >
            {msg.from === 'bot' && (
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SmartToyOutlinedIcon sx={{ color: '#fff', fontSize: 14 }} />
              </Box>
            )}
            <Box
              sx={{
                maxWidth: '78%',
                px: 2,
                py: 1.25,
                borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.from === 'user'
                  ? 'linear-gradient(135deg, #6366f1, #3b82f6)'
                  : '#fff',
                boxShadow: msg.from === 'user'
                  ? '0 4px 16px rgba(99,102,241,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <Typography
                sx={{
                  fontSize: 13.5,
                  color: msg.from === 'user' ? '#fff' : 'text.primary',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-line',
                }}
              >
                {msg.text}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Typing */}
        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SmartToyOutlinedIcon sx={{ color: '#fff', fontSize: 14 }} />
            </Box>
            <Box sx={{ px: 2, py: 1.25, borderRadius: '18px 18px 18px 4px', bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0, 0.18, 0.36].map((delay, i) => (
                <Box key={i} sx={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', animation: 'bounce 1s infinite', animationDelay: `${delay}s`, '@keyframes bounce': { '0%,60%,100%': { transform: 'translateY(0)' }, '30%': { transform: 'translateY(-5px)' } } }} />
              ))}
            </Box>
          </Box>
        )}

        {/* Consent */}
        {showConsent && !isTyping && (
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 0.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleConsent(false)}
              sx={{ borderRadius: 50, textTransform: 'none', fontSize: 12, borderColor: '#6366f1', color: '#6366f1', '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' } }}
            >
              Non, je refuse
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => handleConsent(true)}
              disabled={loading}
              sx={{ borderRadius: 50, textTransform: 'none', fontSize: 12, background: 'linear-gradient(135deg, #6366f1, #3b82f6)', '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #2563eb)' } }}
            >
              Oui, j'accepte ✅
            </Button>
          </Stack>
        )}

        <div ref={messagesEnd} />
      </Box>

      {/* Error */}
      {error && (
        <Box sx={{ px: 2.5, py: 0.75, bgcolor: '#fee2e2', flexShrink: 0 }}>
          <Typography sx={{ fontSize: 12, color: 'error.main' }}>{error}</Typography>
        </Box>
      )}

      {/* Input */}
      {showInput && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: '1px solid rgba(99,102,241,0.1)',
            bgcolor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 50,
                bgcolor: '#f5f7ff',
                '& fieldset': { borderColor: 'rgba(99,102,241,0.2)' },
                '&:hover fieldset': { borderColor: '#6366f1' },
                '&.Mui-focused fieldset': { borderColor: '#6366f1' },
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              color: '#fff',
              width: 40,
              height: 40,
              flexShrink: 0,
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #2563eb)' },
              '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  )
}
