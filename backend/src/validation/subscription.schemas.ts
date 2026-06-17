import { z } from 'zod'

const offerCode = z.string().trim().min(1).max(80).transform((value) => value.toUpperCase())

export const subscriptionIdParamsSchema = z.object({
  id: z.uuid(),
})

export const createSubscriptionSchema = z.object({
  onboardingSessionId: z.uuid().optional(),
  offerId: z.uuid().optional(),
  offerCode: offerCode.optional(),
  bearerProfileId: z.uuid().optional(),
  payerProfileId: z.uuid().optional(),
}).refine((value) => value.onboardingSessionId || value.bearerProfileId, {
  message: 'Une session onboarding ou un profil porteur est requis.',
  path: ['onboardingSessionId'],
})

export const updateSubscriptionSchema = z.object({
  onboardingSessionId: z.uuid().optional(),
  offerId: z.uuid().optional(),
  offerCode: offerCode.optional(),
  bearerProfileId: z.uuid().optional(),
  payerProfileId: z.uuid().optional(),
}).refine((value) => Object.values(value).some(Boolean), {
  message: 'Au moins un champ doit etre renseigne.',
})

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>
