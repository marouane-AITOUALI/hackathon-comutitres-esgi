import { z } from 'zod'

const profileStatus = z.enum(['junior', 'school', 'student', 'active', 'senior', 'solidarity', 'other'])
const subscriptionFor = z.enum(['self', 'child', 'other', 'organization_beneficiary'])
const birthDate = z.iso.date().superRefine((value, context) => {
  if (value < '1900-01-01') context.addIssue({ code: 'custom', message: 'La date de naissance doit être postérieure au 1er janvier 1900.' })
  if (value > new Date().toISOString().slice(0, 10)) context.addIssue({ code: 'custom', message: 'La date de naissance ne peut pas être dans le futur.' })
})

const accountAddress = z.object({
  addressLine1: z.string().trim().min(3).max(160),
  addressLine2: z.string().trim().max(160).optional(),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'Le code postal français doit contenir 5 chiffres.'),
  city: z.string().trim().min(2).max(100),
  country: z.literal('FR').default('FR'),
})

const bearer = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  birthDate,
  status: profileStatus,
})

const payer = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  relationshipToBearer: z.enum(['parent', 'guardian', 'association', 'employer', 'other']),
})

const answers = z.record(z.string(), z.unknown())

export const onboardingSchema = z.object({
  subscriptionFor,
  isBearerPayer: z.boolean().default(true),
  currentStep: z.string().trim().min(1).default('profile'),
  address: accountAddress,
  bearer: bearer.optional(),
  payer: payer.optional(),
  answers: answers.default({}),
})

export const onboardingWithBearerSchema = onboardingSchema.extend({
  bearer,
})

export const updateOnboardingSchema = z.object({
  subscriptionFor: subscriptionFor.optional(),
  isBearerPayer: z.boolean().optional(),
  currentStep: z.string().trim().min(1).optional(),
  address: accountAddress.optional(),
  bearer: bearer.optional(),
  payer: payer.optional().nullable(),
  answers: answers.optional(),
})

export const completeOnboardingStepSchema = z.object({
  step: z.string().trim().min(1),
  answers: answers.default({}),
  nextStep: z.string().trim().min(1).optional(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>
export type CompleteOnboardingStepInput = z.infer<typeof completeOnboardingStepSchema>
