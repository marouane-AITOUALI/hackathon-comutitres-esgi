import { z } from 'zod'
const bearer = z.object({ firstName: z.string().trim().min(1), lastName: z.string().trim().min(1), birthDate: z.iso.date(), status: z.enum(['junior', 'school', 'student', 'active', 'senior', 'solidarity', 'other']) })
const payer = z.object({ firstName: z.string().trim().min(1), lastName: z.string().trim().min(1), email: z.email(), relationshipToBearer: z.enum(['parent', 'guardian', 'association', 'employer', 'other']) })
export const onboardingSchema = z.object({
  subscriptionFor: z.enum(['self', 'child', 'other', 'organization_beneficiary']),
  isBearerPayer: z.boolean(),
  currentStep: z.string().default('result'),
  bearer,
  payer: payer.optional(),
  answers: z.record(z.string(), z.unknown()).default({}),
}).superRefine((value, context) => {
  if (!value.isBearerPayer && !value.payer) context.addIssue({ code: 'custom', path: ['payer'], message: 'Le payeur est requis.' })
})
export type OnboardingInput = z.infer<typeof onboardingSchema>
