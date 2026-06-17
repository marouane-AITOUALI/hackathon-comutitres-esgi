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
  cardToken: z.string().trim().min(4).max(120).optional(),
  simulateFailure: z.boolean().default(false),
})

export const mandatePaymentSchema = z.object({
  subscriptionId: z.uuid(),
  amountCents: z.number().int().positive().max(500000).optional(),
  holderName: z.string().trim().min(2).max(160),
  ibanLast4: z.string().trim().regex(/^\d{4}$/, 'Conserver uniquement les 4 derniers chiffres IBAN.'),
  mandateAccepted: z.boolean(),
})

export const regularizePaymentSchema = z.object({
  amountCents: z.number().int().positive().max(500000).optional(),
  note: z.string().trim().min(2).max(500).optional(),
})

export type PaymentSimulationInput = z.infer<typeof paymentSimulationSchema>
export type DirectPaymentInput = z.infer<typeof directPaymentSchema>
export type MandatePaymentInput = z.infer<typeof mandatePaymentSchema>
export type RegularizePaymentInput = z.infer<typeof regularizePaymentSchema>
