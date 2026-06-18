import { z } from 'zod'

const notificationCategories = ['subscription', 'document', 'payment', 'renewal', 'communication', 'system'] as const
const communicationAudiences = ['clients', 'admins', 'everyone'] as const
const notificationPriorities = ['low', 'normal', 'high'] as const

export const notificationIdParamsSchema = z.object({
  id: z.uuid(),
})

export const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(['all', 'unread', 'read']).default('all'),
  category: z.enum(notificationCategories).optional(),
}).default({ limit: 50, status: 'all' })

export const createCommunicationSchema = z.object({
  audience: z.enum(communicationAudiences),
  title: z.string().trim().min(3).max(160),
  message: z.string().trim().min(3).max(2000),
  priority: z.enum(notificationPriorities).default('normal'),
  actionLabel: z.string().trim().min(2).max(80).optional(),
  actionPath: z.string().trim().regex(/^\/(?!\/)/, 'Le lien doit être un chemin interne commençant par /.').max(500).optional(),
}).superRefine((value, context) => {
  if (Boolean(value.actionLabel) !== Boolean(value.actionPath)) {
    context.addIssue({
      code: 'custom',
      path: value.actionLabel ? ['actionPath'] : ['actionLabel'],
      message: 'Le libellé et le lien d’action doivent être renseignés ensemble.',
    })
  }
})

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>
export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>
