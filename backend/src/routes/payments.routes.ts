import { Router } from 'express'
import { cancel, direct, mandate, regularize, show, simulate } from '../controllers/payments.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const paymentsRouter = Router()

paymentsRouter.use(authMiddleware)
paymentsRouter.post('/simulate', simulate)
paymentsRouter.post('/direct', direct)
paymentsRouter.post('/mandate', mandate)
paymentsRouter.get('/:id', show)
paymentsRouter.post('/:id/cancel', cancel)
paymentsRouter.post('/:id/regularize', regularize)
