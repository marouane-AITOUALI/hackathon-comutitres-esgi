import { z } from 'zod'

export const terminationDecisionSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
  effectiveMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
})

export type TerminationDecisionInput = z.infer<typeof terminationDecisionSchema>
