import { Router } from 'express'
import { analyze, createForSubscription, fraudCheck, getAnalysis, getById, listForSubscription, manualReview, remove, resubmit, updateStatus } from '../controllers/documents.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const documentsRouter = Router()

documentsRouter.use(authMiddleware)
documentsRouter.post('/subscriptions/:subscriptionId/documents', createForSubscription)
documentsRouter.get('/subscriptions/:subscriptionId/documents', listForSubscription)
documentsRouter.get('/documents/:id', getById)
documentsRouter.delete('/documents/:id', remove)
documentsRouter.patch('/documents/:id/status', updateStatus)
documentsRouter.post('/documents/:id/resubmit', resubmit)
documentsRouter.post('/documents/:id/analyze', analyze)
documentsRouter.get('/documents/:id/analysis', getAnalysis)
documentsRouter.post('/documents/:id/fraud-check', fraudCheck)
documentsRouter.post('/documents/:id/manual-review', manualReview)
