import { z } from 'zod'

const documentTypes = ['identity', 'proof_of_address', 'eligibility', 'school_certificate', 'tax_notice', 'other'] as const
const reviewStatuses = ['pending', 'validated', 'rejected', 'needs_manual_review'] as const

const fileUrl = z.string().trim().min(3).max(2048)
const documentTypeSchema = z.enum(documentTypes)

export const subscriptionDocumentsParamsSchema = z.object({
  subscriptionId: z.uuid(),
})

export const documentIdParamsSchema = z.object({
  id: z.union([z.uuid(), z.string().regex(/^storage_[A-Za-z0-9_-]+$/)]),
})

export const createDocumentSchema = z.object({
  type: documentTypeSchema,
})

export const analyzeDocumentDemoSchema = z.object({
  type: documentTypeSchema,
  fileUrl,
})

export const resubmitDocumentSchema = z.object({
  type: documentTypeSchema.optional(),
})

export const updateDocumentStatusSchema = z.object({
  status: z.enum(reviewStatuses),
  rejectionReason: z.string().trim().min(3).max(500).optional(),
}).superRefine((value, context) => {
  if (value.status === 'rejected' && !value.rejectionReason) {
    context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'Un motif de refus est requis.' })
  }
})

export const manualReviewSchema = z.object({
  decision: z.enum(['validate', 'reject', 'manual_review']),
  rejectionReason: z.string().trim().min(3).max(500).optional(),
  note: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  if (value.decision === 'reject' && !value.rejectionReason) {
    context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'Un motif est requis en cas de refus.' })
  }
})

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type AnalyzeDocumentDemoInput = z.infer<typeof analyzeDocumentDemoSchema>
export type ResubmitDocumentInput = z.infer<typeof resubmitDocumentSchema>
export type UpdateDocumentStatusInput = z.infer<typeof updateDocumentStatusSchema>
export type ManualReviewInput = z.infer<typeof manualReviewSchema>
