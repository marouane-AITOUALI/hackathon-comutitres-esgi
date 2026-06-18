import type { RequestHandler } from 'express'
import { createAdminOffer, getAdminStats, getAdminSubscription, getAuditLogs, getSupportAlerts, listAdminOffers, listAdminSubscriptions, listAdminUsers, listPendingDocuments, reviewAdminDocument, updateAdminOffer, updateAdminSubscriptionStatus, updateAdminUserRole } from '../services/admin.service.js'
import { createCommunication, listCommunications } from '../services/notifications.service.js'
import { AppError } from '../utils/app-error.js'
import { adminCreateOfferSchema, adminIdParamsSchema, adminListSubscriptionsQuerySchema, adminReviewDocumentSchema, adminUpdateOfferSchema, adminUpdateSubscriptionStatusSchema, adminUpdateUserRoleSchema } from '../validation/admin.schemas.js'
import { createCommunicationSchema } from '../validation/notification.schemas.js'

export const stats: RequestHandler = async (_req, res) => {
  res.json(await getAdminStats())
}

export const subscriptions: RequestHandler = async (req, res) => {
  const query = adminListSubscriptionsQuerySchema.parse(req.query)
  res.json({ subscriptions: await listAdminSubscriptions(query) })
}

export const subscriptionById: RequestHandler = async (req, res) => {
  const { id } = adminIdParamsSchema.parse(req.params)
  res.json(await getAdminSubscription(id))
}

export const patchSubscriptionStatus: RequestHandler = async (req, res) => {
  const { id } = adminIdParamsSchema.parse(req.params)
  const body = adminUpdateSubscriptionStatusSchema.parse(req.body)
  res.json(await updateAdminSubscriptionStatus(id, body))
}

export const pendingDocuments: RequestHandler = async (_req, res) => {
  res.json({ documents: await listPendingDocuments() })
}

export const patchDocumentReview: RequestHandler = async (req, res) => {
  const { id } = adminIdParamsSchema.parse(req.params)
  const body = adminReviewDocumentSchema.parse(req.body)
  res.json(await reviewAdminDocument(id, body))
}

export const users: RequestHandler = async (_req, res) => {
  res.json({ users: await listAdminUsers() })
}

export const patchUserRole: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  const { id } = adminIdParamsSchema.parse(req.params)
  const body = adminUpdateUserRoleSchema.parse(req.body)
  res.json({ user: await updateAdminUserRole(id, body, req.auth.sub) })
}

export const offers: RequestHandler = async (_req, res) => {
  res.json({ offers: await listAdminOffers() })
}

export const createOffer: RequestHandler = async (req, res) => {
  const body = adminCreateOfferSchema.parse(req.body)
  res.status(201).json({ offer: await createAdminOffer(body) })
}

export const patchOffer: RequestHandler = async (req, res) => {
  const { id } = adminIdParamsSchema.parse(req.params)
  const body = adminUpdateOfferSchema.parse(req.body)
  res.json({ offer: await updateAdminOffer(id, body) })
}

export const supportAlerts: RequestHandler = async (_req, res) => {
  res.json({ alerts: await getSupportAlerts() })
}

export const auditLogs: RequestHandler = async (_req, res) => {
  res.json({ logs: await getAuditLogs() })
}

export const communications: RequestHandler = async (_req, res) => {
  res.json(await listCommunications())
}

export const publishCommunication: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  const body = createCommunicationSchema.parse(req.body)
  res.status(201).json(await createCommunication(req.auth.sub, body))
}
