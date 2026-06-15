import { Router } from 'express'
import { createRecommendation } from '../controllers/recommendation.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validateBody } from '../middleware/validate.js'
import { recommendationSchema } from '../validation/recommendation.schemas.js'
export const recommendationRouter = Router()
recommendationRouter.post('/', authMiddleware, validateBody(recommendationSchema), createRecommendation)
