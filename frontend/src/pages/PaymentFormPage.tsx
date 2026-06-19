import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createDirectPayment, createMandatePayment, simulatePayment } from '../services/payments.service'
import { listSubscriptions } from '../services/subscriptions.service'
import { PaymentMethodSection } from '../components/payment/PaymentMethodSection'
import { buildCardToken, validateCardFields } from '../components/payment/cardPaymentUtils'
import { validateSepaFields } from '../components/payment/sepaPaymentUtils'
import { colors } from '../theme/colors'
import type { PaymentSimulation, SubscriptionSummary } from '../types'
import { subscriptionStatusLabels } from '../utils/statusLabels'

type PaymentMode = 'one_time' | 'monthly'
type PaymentMethod = 'card' | 'mandate'

function formatEuros(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100)
}

function profileLabel(item: SubscriptionSummary) {
  const name = item.bearerProfile ? `${item.bearerProfile.firstName} ${item.bearerProfile.lastName}` : 'Porteur'
  const offer = item.offer?.name ?? 'Offre'
  return `${offer} — ${name}`
}

export function PaymentFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('subscriptionId') ?? ''

  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([])
  const [subscriptionId, setSubscriptionId] = useState(preselectedId)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('one_time')
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [holderName, setHolderName] = useState('')
  const [iban, setIban] = useState('')
  const [bic, setBic] = useState('')
  const [mandateAccepted, setMandateAccepted] = useState(false)

  const [simulation, setSimulation] = useState<PaymentSimulation | null>(null)

  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const payableSubscriptions = useMemo(
    () => subscriptions.filter((item) => item.workflow.canPay),
    [subscriptions],
  )

  const selected = useMemo(
    () => subscriptions.find((item) => item.subscription.id === subscriptionId),
    [subscriptionId, subscriptions],
  )

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const data = await listSubscriptions()
        if (!mounted) return
        setSubscriptions(data)
        if (!subscriptionId && data[0]) {
          setSubscriptionId(data[0].subscription.id)
        }
        if (preselectedId) {
          setSubscriptionId(preselectedId)
        }
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : 'Impossible de charger les dossiers.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => { mounted = false }
  }, [preselectedId, subscriptionId])

  useEffect(() => {
    if (selected?.bearerProfile) {
      const name = `${selected.bearerProfile.firstName} ${selected.bearerProfile.lastName}`
      setHolderName(name)
      setCardholderName(name)
    }
  }, [selected])

  const runSimulation = useCallback(async () => {
    if (!subscriptionId) {
      setError('Sélectionnez un dossier.')
      return
    }

    setSimulating(true)
    setError('')
    setSuccess('')
    setSimulation(null)

    try {
      const response = await simulatePayment({ subscriptionId, paymentMode })
      setSimulation(response.simulation)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Simulation impossible.')
    } finally {
      setSimulating(false)
    }
  }, [paymentMode, subscriptionId])

  async function submitPayment() {
    if (!subscriptionId) {
      setError('Sélectionnez un dossier.')
      return
    }
    if (!simulation) {
      setError('Lancez d’abord une simulation pour connaître le montant.')
      return
    }

    setPaying(true)
    setError('')
    setSuccess('')

    try {
      if (method === 'card') {
        const cardError = simulation.totalCents === 0 ? null : validateCardFields(cardNumber, cardExpiry, cardCvv, cardholderName)
        if (cardError) {
          setError(cardError)
          return
        }
        await createDirectPayment({ subscriptionId, paymentMode, cardToken: simulation.totalCents === 0 ? undefined : buildCardToken(cardNumber), simulateFailure })
        setSuccess(simulateFailure ? 'Paiement refusé (simulation).' : 'Paiement enregistré. Vous pouvez finaliser l’envoi du dossier.')
      } else {
        if (paymentMode !== 'monthly') {
          setMethod('card')
          setError('Le prélèvement SEPA est disponible uniquement avec la mensualisation.')
          return
        }
        const sepaError = validateSepaFields(holderName, iban, bic)
        if (sepaError) {
          setError(sepaError)
          return
        }
        if (!mandateAccepted) {
          setError('Vous devez accepter le mandat SEPA.')
          return
        }
        await createMandatePayment({
          subscriptionId,
          paymentMode: 'monthly',
          holderName,
          ibanLast4: iban.replace(/\s/g, '').slice(-4),
          bic,
          mandateAccepted: true,
        })
        setSuccess('Mandat SEPA enregistré. Les prélèvements suivront l’échéancier affiché.')
      }
      setTimeout(() => navigate('/paiements'), 1800)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Paiement impossible.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={Link} to="/paiements" startIcon={<ArrowLeft size={16} />} sx={{ mb: 1.5, fontWeight: 600 }}>
          Retour à l’historique
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Effectuer un paiement</Typography>
        <Typography color="text.secondary">
          En paiement unique, réglez par carte. En mensualisation, choisissez la carte ou le prélèvement SEPA.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      {loading && <Alert severity="info">Chargement des dossiers...</Alert>}

      <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>1. Choisir le dossier</Typography>
            <TextField
              select
              fullWidth
              label="Dossier / abonnement"
              value={subscriptionId}
              onChange={(event) => {
                setSubscriptionId(event.target.value)
                setSimulation(null)
              }}
              disabled={loading || payableSubscriptions.length === 0}
            >
              {payableSubscriptions.map((item) => (
                <MenuItem key={item.subscription.id} value={item.subscription.id}>
                  {profileLabel(item)} ({subscriptionStatusLabels[item.subscription.status]})
                </MenuItem>
              ))}
            </TextField>
            {!loading && payableSubscriptions.length === 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Aucun dossier éligible. Créez une souscription depuis l’onboarding ou les abonnements.
              </Alert>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>2. Mode de paiement</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-end' } }}>
              <TextField
                select
                label="Fréquence"
                value={paymentMode}
                onChange={(event) => {
                  const nextMode = event.target.value as PaymentMode
                  setPaymentMode(nextMode)
                  if (nextMode === 'one_time') {
                    setMethod('card')
                    setMandateAccepted(false)
                  }
                  setSimulation(null)
                }}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="one_time">Paiement unique</MenuItem>
                <MenuItem value="monthly">Mensualisation</MenuItem>
              </TextField>
              <Button
                disabled={!subscriptionId || simulating}
                onClick={() => void runSimulation()}
                variant="outlined"
                sx={{ borderRadius: 2, fontWeight: 700, minHeight: 44 }}
              >
                {simulating ? 'Simulation...' : 'Simuler le montant'}
              </Button>
            </Stack>

            {simulation && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2.5, borderRadius: 2, bgcolor: colors.blueLight }}>
                <Stack spacing={0.75}>
                  <Typography sx={{ fontWeight: 800 }}>Montant estimé</Typography>
                  <Typography>Forfait : {formatEuros(simulation.amountCents, simulation.currency)}</Typography>
                  {simulation.feesCents > 0 && (
                    <Typography>Frais : {formatEuros(simulation.feesCents, simulation.currency)}</Typography>
                  )}
                  {paymentMode === 'monthly' ? (
                    <>
                      <Typography sx={{ fontWeight: 800, fontSize: 18, color: colors.blueInteraction }}>
                        {formatEuros(simulation.installmentAmountCents, simulation.currency)} par mois pendant {simulation.installmentCount} mois
                      </Typography>
                      <Stack spacing={0.25} sx={{ mt: 1 }}>
                        {simulation.schedule.map((installment) => (
                          <Typography key={installment.installmentNumber} variant="body2">
                            Échéance {installment.installmentNumber} · {new Intl.DateTimeFormat('fr-FR').format(new Date(installment.dueDate))} · {formatEuros(installment.amountCents, simulation.currency)}
                          </Typography>
                        ))}
                      </Stack>
                    </>
                  ) : (
                    <Typography sx={{ fontWeight: 800, fontSize: 18, color: colors.blueInteraction }}>
                      Total à régler : {formatEuros(simulation.totalCents, simulation.currency)}
                    </Typography>
                  )}
                  {simulation.warnings.map((warning) => (
                    <Typography key={warning} color="text.secondary" variant="body2">• {warning}</Typography>
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>3. Moyen de paiement</Typography>
            <PaymentMethodSection
              method={method}
              onMethodChange={setMethod}
              allowMandate={paymentMode === 'monthly'}
              cardNumber={cardNumber}
              onCardNumberChange={setCardNumber}
              expiry={cardExpiry}
              onExpiryChange={setCardExpiry}
              cvv={cardCvv}
              onCvvChange={setCardCvv}
              cardholderName={cardholderName}
              onCardholderNameChange={setCardholderName}
              simulateFailure={simulateFailure}
              onSimulateFailureChange={setSimulateFailure}
              holderName={holderName}
              onHolderNameChange={setHolderName}
              iban={iban}
              onIbanChange={setIban}
              bic={bic}
              onBicChange={setBic}
              mandateAccepted={mandateAccepted}
              onMandateAcceptedChange={setMandateAccepted}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
            <Button component={Link} to="/paiements" variant="outlined" sx={{ borderRadius: 2 }}>
              Annuler
            </Button>
            <Button
              disabled={paying || !subscriptionId || !simulation}
              onClick={() => void submitPayment()}
              variant="contained"
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                bgcolor: colors.blueInteraction,
                minWidth: 180,
                '&:hover': { bgcolor: colors.blueFocus },
              }}
            >
              {paying ? 'Traitement...' : method === 'card' ? 'Payer maintenant' : 'Valider le mandat'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  )
}
