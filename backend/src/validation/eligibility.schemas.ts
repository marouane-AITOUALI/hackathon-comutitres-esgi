import { z } from 'zod'

export const eligibilityProfileSchema = z.object({
  age: z.number().int().min(0).max(120).optional(),
  status: z.enum(['junior', 'school', 'student', 'active', 'senior', 'solidarity', 'other']).optional(),
  socialSituation: z.enum(['student', 'scholarship', 'job_seeker', 'social_beneficiary', 'senior', 'other']).optional(),
  scholarship: z.boolean().optional(),
  solidarity: z.boolean().optional(),
  department: z.string().trim().min(2).max(3).optional(),
  isResidentIleDeFrance: z.boolean().optional(),
  isBearerPayer: z.boolean().optional(),
})

export const tstEligibilitySchema = eligibilityProfileSchema.extend({
  cafBeneficiary: z.boolean().optional(),
  rsaBeneficiary: z.boolean().optional(),
  assBeneficiary: z.boolean().optional(),
})

export const scholarshipEligibilitySchema = eligibilityProfileSchema.extend({
  hasScholarshipNotice: z.boolean().optional(),
  educationLevel: z.enum(['school', 'student', 'apprentice', 'other']).optional(),
})

export const seniorEligibilitySchema = eligibilityProfileSchema.extend({
  birthDate: z.iso.date().optional(),
})

export const amethystEligibilitySchema = eligibilityProfileSchema.extend({
  disabilityCard: z.boolean().optional(),
  veteranCard: z.boolean().optional(),
})

export const explainEligibilitySchema = eligibilityProfileSchema.extend({
  cafBeneficiary: z.boolean().optional(),
  rsaBeneficiary: z.boolean().optional(),
  assBeneficiary: z.boolean().optional(),
  hasScholarshipNotice: z.boolean().optional(),
  educationLevel: z.enum(['school', 'student', 'apprentice', 'other']).optional(),
  birthDate: z.iso.date().optional(),
  disabilityCard: z.boolean().optional(),
  veteranCard: z.boolean().optional(),
})

export type EligibilityProfileInput = z.infer<typeof eligibilityProfileSchema>
export type TstEligibilityInput = z.infer<typeof tstEligibilitySchema>
export type ScholarshipEligibilityInput = z.infer<typeof scholarshipEligibilitySchema>
export type SeniorEligibilityInput = z.infer<typeof seniorEligibilitySchema>
export type AmethystEligibilityInput = z.infer<typeof amethystEligibilitySchema>
export type ExplainEligibilityInput = z.infer<typeof explainEligibilitySchema>
