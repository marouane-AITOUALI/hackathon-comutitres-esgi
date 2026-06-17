import { z } from 'zod'

const offerCode = z.string().trim().min(1).max(80).transform((value) => value.toUpperCase())

export const listOffersQuerySchema = z.object({
  includeInactive: z.coerce.boolean().default(false),
  target: z.string().trim().min(1).max(120).optional(),
})

export const offerCodeParamsSchema = z.object({
  code: offerCode,
})

export const compareOffersQuerySchema = z.object({
  codes: z.string().transform((value) => value.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean)).pipe(z.array(offerCode).min(2).max(4)),
})

export type ListOffersQuery = z.infer<typeof listOffersQuerySchema>
export type CompareOffersQuery = z.infer<typeof compareOffersQuerySchema>
