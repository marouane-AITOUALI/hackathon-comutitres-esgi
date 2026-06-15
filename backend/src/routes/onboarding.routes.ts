import { Router } from 'express'
import { createOnboarding, getOnboarding } from '../controllers/onboarding.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validate.js'
import { onboardingSchema } from '../validation/onboarding.schemas.js'
export const onboardingRouter = Router()
onboardingRouter.use(authMiddleware)
onboardingRouter.post('/', validateBody(onboardingSchema), createOnboarding)
onboardingRouter.get('/:id', getOnboarding)
