import { z } from 'zod'

const profileStatus = z.enum(['junior', 'school', 'student', 'active', 'senior', 'solidarity', 'other'])
const subscriptionFor = z.enum(['self', 'child', 'other', 'organization_beneficiary'])

const bearer = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  birthDate: z.iso.date(),
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
