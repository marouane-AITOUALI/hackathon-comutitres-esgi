import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validate.js'
import { createProfileSchema, updateProfileSchema } from '../validation/profiles.schemas.js'
import { destroyProfile, indexProfiles, profileLifecycle, showProfile, storeProfile, updateProfileController } from '../controllers/profiles.controller.js'

export const profilesRouter = Router()

profilesRouter.use(authMiddleware)
profilesRouter.get('/', indexProfiles)
profilesRouter.post('/', validateBody(createProfileSchema), storeProfile)
profilesRouter.get('/:id', showProfile)
profilesRouter.patch('/:id', validateBody(updateProfileSchema), updateProfileController)
profilesRouter.delete('/:id', destroyProfile)
profilesRouter.get('/:id/lifecycle', profileLifecycle)