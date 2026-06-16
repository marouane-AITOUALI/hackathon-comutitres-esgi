import { z } from 'zod'

export const renewalSubscriptionParamsSchema = z.object({
  id: z.uuid(),
})

export const renewalDecisionSchema = z.object({
  reason: z.string().trim().min(2).max(500).optional(),
})

export const timelineUserParamsSchema = z.object({
  id: z.uuid(),
})

export const lifecycleProfileParamsSchema = z.object({
  id: z.uuid(),
})

export type RenewalDecisionInput = z.infer<typeof renewalDecisionSchema>
