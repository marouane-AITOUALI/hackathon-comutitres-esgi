import { z } from 'zod'

export const notificationIdParamsSchema = z.object({
  id: z.uuid(),
})

export const notificationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).default({ limit: 50 })
