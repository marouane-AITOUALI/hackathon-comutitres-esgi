import { z } from 'zod'
import { onboardingWithBearerSchema } from './onboarding.schemas.js'

const password = z.string().min(10).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/)
const humanName = z.string().trim().min(1).max(80).regex(/^[\p{L}][\p{L}\p{M}\s'.-]*$/u, 'Utilisez uniquement des lettres, espaces, apostrophes ou tirets.')
const phoneNumber = z.string().trim().min(6).max(20).regex(/^(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}$/, 'Entrez un numero francais valide.')
const addressLine = z.string().trim().min(3).max(160).regex(/^[\p{L}\p{N}\p{M}\s'",.-]+$/u, 'Adresse invalide.')
const addressLineOptional = z.string().trim().max(160).regex(/^[\p{L}\p{N}\p{M}\s'",.-]*$/u, 'Complement d’adresse invalide.')
const city = z.string().trim().min(2).max(100).regex(/^[\p{L}\p{M}\s'.-]+$/u, 'Ville invalide.')

const recommendedOfferSchema = z.object({
  offerId: z.uuid(),
})

export const registerSchema = z.object({
  firstName: humanName,
  lastName: humanName,
  email: z.email().transform((value) => value.toLowerCase()),
  password,
  rgpdConsent: z.boolean().refine(Boolean, { message: 'Le consentement RGPD est requis.' }),
})

export const registerWithOnboardingSchema = registerSchema.extend({
  onboarding: onboardingWithBearerSchema,
  recommendedOffer: recommendedOfferSchema,
})

export const loginSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(1) })
export const updateCurrentUserSchema = z.object({
  firstName: humanName.optional(),
  lastName: humanName.optional(),
  email: z.email().transform((value) => value.toLowerCase()).optional(),
  phone: phoneNumber.nullable().optional(),
  addressLine1: addressLine.nullable().optional(),
  addressLine2: addressLineOptional.nullable().optional(),
  postalCode: z.string().trim().min(2).max(20).regex(/^[a-zA-Z0-9\s-]+$/, 'Code postal invalide.').nullable().optional(),
  city: city.nullable().optional(),
  country: z.literal('FR').optional(),
  preferredContact: z.enum(['email', 'phone', 'sms']).optional(),
  accessibilityPreference: z.enum(['none', 'screen_reader', 'large_text', 'reduced_motion', 'plain_language', 'human_support']).optional(),
  marketingOptIn: z.boolean().optional(),
}).superRefine((value, context) => {
  if ((value.preferredContact === 'phone' || value.preferredContact === 'sms') && !value.phone) {
    context.addIssue({ code: 'custom', path: ['phone'], message: 'Un numero de telephone est requis pour ce canal de contact.' })
  }
  const hasAddress = Boolean(value.addressLine1 || value.postalCode || value.city)
  if (hasAddress) {
    if (!value.addressLine1) context.addIssue({ code: 'custom', path: ['addressLine1'], message: 'Adresse requise si vous renseignez une adresse.' })
    if (!value.postalCode) context.addIssue({ code: 'custom', path: ['postalCode'], message: 'Code postal requis si vous renseignez une adresse.' })
    if (!value.city) context.addIssue({ code: 'custom', path: ['city'], message: 'Ville requise si vous renseignez une adresse.' })
  }
  if ((value.country ?? 'FR') === 'FR' && value.postalCode && !/^\d{5}$/.test(value.postalCode)) {
    context.addIssue({ code: 'custom', path: ['postalCode'], message: 'Le code postal francais doit contenir 5 chiffres.' })
  }
})
export type RegisterInput = z.infer<typeof registerSchema>
export type RegisterWithOnboardingInput = z.infer<typeof registerWithOnboardingSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateCurrentUserInput = z.infer<typeof updateCurrentUserSchema>
