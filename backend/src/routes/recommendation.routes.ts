import { Router } from 'express'
import { createRecommendation } from '../controllers/recommendation.controller.js'
import { validateBody } from '../middleware/validate.js'
import { recommendationSchema } from '../validation/recommendation.schemas.js'
export const recommendationRouter = Router()
recommendationRouter.post('/', validateBody(recommendationSchema), createRecommendation)
