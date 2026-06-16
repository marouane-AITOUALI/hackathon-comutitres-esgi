import { Router } from 'express'
import { healthRouter } from './health.routes.js'
import { authRouter } from './auth.routes.js'
import { documentsRouter } from './documents.routes.js'
import { onboardingRouter } from './onboarding.routes.js'
import { offersRouter } from './offers.routes.js'
import { recommendationRouter } from './recommendation.routes.js'
import { subscriptionsRouter } from './subscriptions.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/', documentsRouter)
apiRouter.use('/onboarding', onboardingRouter)
apiRouter.use('/offers', offersRouter)
apiRouter.use('/recommendations', recommendationRouter)
apiRouter.use('/subscriptions', subscriptionsRouter)
