import { z } from 'zod'

export const recommendationSchema = z.object({
  age: z.number().int().min(0).max(120),
  status: z.enum(['junior', 'school', 'student', 'active', 'senior', 'solidarity', 'other']),
  frequency: z.enum(['daily', 'regular', 'occasional']),
  planPreference: z.enum(['annual', 'monthly', 'weekly', 'pay_as_you_go', 'unsure']),
  socialSituation: z.enum(['student', 'scholarship', 'job_seeker', 'social_beneficiary', 'senior', 'other']),
  support: z.enum(['phone', 'navigo_pass', 'unsure']),
  isBearerPayer: z.boolean(),
  scholarship: z.boolean().default(false),
  solidarity: z.boolean().default(false),
  department: z.string().max(3).optional(),
})

export const recommendationSimulationSchema = z.object({
  base: recommendationSchema,
  scenarios: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    changes: recommendationSchema.partial(),
  })).min(1).max(10),
})

export const recommendationCompareSchema = recommendationSchema

export type RecommendationInput = z.infer<typeof recommendationSchema>
export type RecommendationSimulationInput = z.infer<typeof recommendationSimulationSchema>
export type RecommendationCompareInput = z.infer<typeof recommendationCompareSchema>
