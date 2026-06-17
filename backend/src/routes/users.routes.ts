import { Router } from 'express'
import { avatar, removeAvatar, timeline, uploadAvatar } from '../controllers/users.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { singleFileUpload } from '../middleware/upload.middleware.js'

export const usersRouter = Router()

usersRouter.use(authMiddleware)
usersRouter.get('/me/avatar', avatar)
usersRouter.put('/me/avatar', singleFileUpload, uploadAvatar)
usersRouter.delete('/me/avatar', removeAvatar)
usersRouter.get('/:id/timeline', timeline)
