import { z } from 'zod'

const paymentModes = ['one_time', 'monthly', 'weekly', 'usage'] as const

export const paymentIdParamsSchema = z.object({
  id: z.uuid(),
})

export const paymentSimulationSchema = z.object({
  subscriptionId: z.uuid().optional(),
  offerCode: z.string().trim().min(2).max(80).transform((value) => value.toUpperCase()).optional(),
  amountCents: z.number().int().positive().max(500000).optional(),
  paymentMode: z.enum(paymentModes).default('one_time'),
}).refine((value) => value.subscriptionId || value.offerCode || value.amountCents, {
  message: 'Une souscription, une offre ou un montant est requis pour simuler un paiement.',
  path: ['subscriptionId'],
})

export const directPaymentSchema = z.object({
  subscriptionId: z.uuid(),
  amountCents: z.number().int().positive().max(500000).optional(),
  paymentMode: z.enum(paymentModes).default('one_time'),
  cardToken: z.string().trim().min(4).max(120).optional(),
  simulateFailure: z.boolean().default(false),
})

export const mandatePaymentSchema = z.object({
  subscriptionId: z.uuid(),
  amountCents: z.number().int().positive().max(500000).optional(),
  paymentMode: z.literal('monthly').default('monthly'),
  holderName: z.string().trim().min(2).max(160),
  ibanLast4: z.string().trim().regex(/^\d{4}$/, 'Conserver uniquement les 4 derniers chiffres IBAN.'),
  bic: z.string().trim().toUpperCase().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'BIC invalide.'),
  mandateAccepted: z.boolean(),
}).refine((value) => value.mandateAccepted, {
  message: 'Le mandat SEPA doit être accepté.',
  path: ['mandateAccepted'],
})

export const regularizePaymentSchema = z.object({
  amountCents: z.number().int().positive().max(500000).optional(),
  note: z.string().trim().min(2).max(500).optional(),
})

export type PaymentSimulationInput = z.infer<typeof paymentSimulationSchema>
export type DirectPaymentInput = z.infer<typeof directPaymentSchema>
export type MandatePaymentInput = z.infer<typeof mandatePaymentSchema>
export type RegularizePaymentInput = z.infer<typeof regularizePaymentSchema>
