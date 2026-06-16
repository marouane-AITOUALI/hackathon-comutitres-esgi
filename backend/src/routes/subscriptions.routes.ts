import { Router } from 'express'
import { cancel, create, getById, list, submit, suspend, update } from '../controllers/subscriptions.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const subscriptionsRouter = Router()

subscriptionsRouter.use(authMiddleware)
subscriptionsRouter.get('/', list)
subscriptionsRouter.post('/', create)
subscriptionsRouter.get('/:id', getById)
subscriptionsRouter.patch('/:id', update)
subscriptionsRouter.post('/:id/submit', submit)
subscriptionsRouter.post('/:id/cancel', cancel)
subscriptionsRouter.post('/:id/suspend', suspend)
