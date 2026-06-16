import { z } from 'zod'
import { onboardingWithBearerSchema } from './onboarding.schemas.js'

const password = z.string().min(10).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/)

const recommendedOfferSchema = z.object({
  offerId: z.uuid(),
})

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  password,
  rgpdConsent: z.boolean().refine(Boolean, { message: 'Le consentement RGPD est requis.' }),
})

export const registerWithOnboardingSchema = registerSchema.extend({
  onboarding: onboardingWithBearerSchema,
  recommendedOffer: recommendedOfferSchema,
})

export const loginSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(1) })
export type RegisterInput = z.infer<typeof registerSchema>
export type RegisterWithOnboardingInput = z.infer<typeof registerWithOnboardingSchema>
export type LoginInput = z.infer<typeof loginSchema>
