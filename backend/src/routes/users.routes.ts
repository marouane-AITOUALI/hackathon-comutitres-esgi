import { Router } from 'express'
import { timeline } from '../controllers/users.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const usersRouter = Router()

usersRouter.use(authMiddleware)
usersRouter.get('/:id/timeline', timeline)
