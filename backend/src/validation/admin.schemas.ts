import { z } from 'zod'

const subscriptionStatuses = ['draft', 'pending_documents', 'pending_payment', 'pending_validation', 'accepted', 'rejected', 'cancelled', 'suspended'] as const
const offerCode = z.string().trim().min(2).max(80).transform((value) => value.toUpperCase())
const optionalText = z.string().trim().min(1).max(500).optional()

export const adminIdParamsSchema = z.object({
  id: z.uuid(),
})

export const adminListSubscriptionsQuerySchema = z.object({
  status: z.enum(subscriptionStatuses).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).default({})

export const adminUpdateSubscriptionStatusSchema = z.object({
  status: z.enum(subscriptionStatuses),
})

export const adminReviewDocumentSchema = z.object({
  accepted: z.boolean(),
  rejectionReason: z.string().trim().min(3).max(500).optional(),
  note: optionalText,
}).superRefine((value, context) => {
  if (!value.accepted && !value.rejectionReason) {
    context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'Un motif est requis en cas de refus.' })
  }
})

export const adminCreateOfferSchema = z.object({
  code: offerCode,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).optional(),
  target: z.string().trim().min(2).max(160),
  requiredDocuments: z.array(z.string().trim().min(2).max(120)).default([]),
  isActive: z.boolean().default(true),
})

export const adminUpdateOfferSchema = adminCreateOfferSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'Au moins un champ doit etre fourni.' },
)

export type AdminListSubscriptionsQuery = z.infer<typeof adminListSubscriptionsQuerySchema>
export type AdminUpdateSubscriptionStatusInput = z.infer<typeof adminUpdateSubscriptionStatusSchema>
export type AdminReviewDocumentInput = z.infer<typeof adminReviewDocumentSchema>
export type AdminCreateOfferInput = z.infer<typeof adminCreateOfferSchema>
export type AdminUpdateOfferInput = z.infer<typeof adminUpdateOfferSchema>
