import { z } from 'zod'

export const profileTypeSchema = z.enum(['bearer', 'payer'])

export const profileStatusSchema = z.enum(['junior', 'school', 'student', 'active', 'senior', 'solidarity', 'other'])

export const relationshipToBearerSchema = z.enum(['parent', 'guardian', 'association', 'employer', 'other'])

export const createProfileSchema = z.object({
  type: profileTypeSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  birthDate: z.iso.date().optional(),
  email: z.email().transform((value) => value.toLowerCase()).optional(),
  status: profileStatusSchema.optional(),
  relationshipToBearer: relationshipToBearerSchema.optional(),
}).superRefine((value, context) => {
  if (value.type === 'payer' && !value.relationshipToBearer) {
    context.addIssue({ code: 'custom', path: ['relationshipToBearer'], message: 'Le lien avec le porteur est requis pour un payeur.' })
  }
})

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  birthDate: z.iso.date().optional(),
  email: z.email().transform((value) => value.toLowerCase()).optional(),
  status: profileStatusSchema.optional(),
  relationshipToBearer: relationshipToBearerSchema.optional(),
})

export const profileIdParamsSchema = z.object({ id: z.uuid() })

export type CreateProfileInput = z.infer<typeof createProfileSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>