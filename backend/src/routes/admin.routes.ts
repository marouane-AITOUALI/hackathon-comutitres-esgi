import { Router } from 'express'
import { auditLogs, communications, createOffer, offers, patchDocumentReview, patchOffer, patchSubscriptionStatus, pendingDocuments, publishCommunication, stats, subscriptionById, subscriptions, supportAlerts, users } from '../controllers/admin.controller.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const adminRouter = Router()

adminRouter.use(authMiddleware, adminMiddleware)
adminRouter.get('/stats', stats)
adminRouter.get('/subscriptions', subscriptions)
adminRouter.get('/subscriptions/:id', subscriptionById)
adminRouter.patch('/subscriptions/:id/status', patchSubscriptionStatus)
adminRouter.get('/documents/pending', pendingDocuments)
adminRouter.patch('/documents/:id/review', patchDocumentReview)
adminRouter.get('/users', users)
adminRouter.get('/offers', offers)
adminRouter.post('/offers', createOffer)
adminRouter.patch('/offers/:id', patchOffer)
adminRouter.get('/support-alerts', supportAlerts)
adminRouter.get('/audit-logs', auditLogs)
adminRouter.get('/communications', communications)
adminRouter.post('/communications', publishCommunication)
