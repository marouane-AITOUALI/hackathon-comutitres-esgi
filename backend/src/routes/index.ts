import { Router } from 'express'
import { healthRouter } from './health.routes.js'
import { authRouter } from './auth.routes.js'
import { onboardingRouter } from './onboarding.routes.js'
import { recommendationRouter } from './recommendation.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/onboarding', onboardingRouter)
apiRouter.use('/recommendations', recommendationRouter)
