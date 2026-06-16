import { Router } from 'express'
import {
  completeStep,
  createOnboarding,
  getOnboarding,
  onboardingHelp,
  onboardingRecommendation,
  onboardingSummary,
  patchOnboarding,
} from '../controllers/onboarding.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validate.js'
import { completeOnboardingStepSchema, onboardingSchema, updateOnboardingSchema } from '../validation/onboarding.schemas.js'

export const onboardingRouter = Router()

onboardingRouter.use(authMiddleware)

onboardingRouter.post('/', validateBody(onboardingSchema), createOnboarding)
onboardingRouter.get('/:id', getOnboarding)
onboardingRouter.patch('/:id', validateBody(updateOnboardingSchema), patchOnboarding)
onboardingRouter.post('/:id/complete-step', validateBody(completeOnboardingStepSchema), completeStep)
onboardingRouter.get('/:id/summary', onboardingSummary)
onboardingRouter.post('/:id/recommendation', onboardingRecommendation)
onboardingRouter.get('/:id/help', onboardingHelp)
