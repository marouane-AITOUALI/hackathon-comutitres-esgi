import type { RequestHandler } from 'express'
import { listUserNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notifications.service.js'
import { AppError } from '../utils/app-error.js'
import { notificationIdParamsSchema, notificationListQuerySchema } from '../validation/notification.schemas.js'

function userId(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  return req.auth.sub
}

export const list: RequestHandler = async (req, res) => {
  const query = notificationListQuerySchema.parse(req.query)
  res.json(await listUserNotifications(userId(req), query.limit))
}

export const markRead: RequestHandler = async (req, res) => {
  const { id } = notificationIdParamsSchema.parse(req.params)
  res.json(await markNotificationRead(userId(req), id))
}

export const markAllRead: RequestHandler = async (req, res) => {
  res.json(await markAllNotificationsRead(userId(req)))
}
