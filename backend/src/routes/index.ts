import { Router } from 'express'
import { adminRouter } from './admin.routes.js'
import { healthRouter } from './health.routes.js'
import { authRouter } from './auth.routes.js'
import { documentsRouter } from './documents.routes.js'
import { eligibilityRouter } from './eligibility.routes.js'
import { onboardingRouter } from './onboarding.routes.js'
import { profilesRouter } from './profiles.routes.js'
import { offersRouter } from './offers.routes.js'
import { paymentsRouter } from './payments.routes.js'
import { recommendationRouter } from './recommendation.routes.js'
import { subscriptionsRouter } from './subscriptions.routes.js'
import { usersRouter } from './users.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/', documentsRouter)
apiRouter.use('/eligibility', eligibilityRouter)
apiRouter.use('/profiles', profilesRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/onboarding', onboardingRouter)
apiRouter.use('/offers', offersRouter)
apiRouter.use('/payments', paymentsRouter)
apiRouter.use('/recommendations', recommendationRouter)
apiRouter.use('/subscriptions', subscriptionsRouter)
