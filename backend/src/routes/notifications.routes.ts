import { Router } from 'express'
import { list, markAllRead, markRead, markUnread, remove } from '../controllers/notifications.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const notificationsRouter = Router()

notificationsRouter.use(authMiddleware)
notificationsRouter.get('/', list)
notificationsRouter.patch('/read-all', markAllRead)
notificationsRouter.patch('/:id/read', markRead)
notificationsRouter.patch('/:id/unread', markUnread)
notificationsRouter.delete('/:id', remove)
