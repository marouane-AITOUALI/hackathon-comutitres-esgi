import { Router } from 'express'
import { analyze, analyzeDemo, createForSubscription, fraudCheck, getAnalysis, getById, listForSubscription, manualReview, remove, replaceFile, resubmit, signedUrl, updateStatus } from '../controllers/documents.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { singleFileUpload } from '../middleware/upload.middleware.js'

export const documentsRouter = Router()

documentsRouter.post('/documents/analyze/demo', analyzeDemo)
documentsRouter.post('/subscriptions/:subscriptionId/documents', authMiddleware, singleFileUpload, createForSubscription)
documentsRouter.get('/subscriptions/:subscriptionId/documents', authMiddleware, listForSubscription)
documentsRouter.get('/documents/:id', authMiddleware, getById)
documentsRouter.get('/documents/:id/signed-url', authMiddleware, signedUrl)
documentsRouter.delete('/documents/:id', authMiddleware, remove)
documentsRouter.patch('/documents/:id/status', authMiddleware, updateStatus)
documentsRouter.put('/documents/:id', authMiddleware, singleFileUpload, replaceFile)
documentsRouter.post('/documents/:id/resubmit', authMiddleware, singleFileUpload, resubmit)
documentsRouter.post('/documents/:id/analyze', authMiddleware, analyze)
documentsRouter.get('/documents/:id/analysis', authMiddleware, getAnalysis)
documentsRouter.post('/documents/:id/fraud-check', authMiddleware, fraudCheck)
documentsRouter.post('/documents/:id/manual-review', authMiddleware, manualReview)
