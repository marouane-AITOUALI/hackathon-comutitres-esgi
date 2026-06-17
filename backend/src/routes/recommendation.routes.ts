import { Router } from 'express'
import {
  compareRecommendationController,
  createRecommendation,
  explainRecommendationController,
  simulateRecommendationController,
} from '../controllers/recommendation.controller.js'
import { validateBody } from '../middleware/validate.js'
import { recommendationCompareSchema, recommendationSchema, recommendationSimulationSchema } from '../validation/recommendation.schemas.js'

export const recommendationRouter = Router()

recommendationRouter.post('/explain', validateBody(recommendationSchema), explainRecommendationController)
recommendationRouter.post('/simulate', validateBody(recommendationSimulationSchema), simulateRecommendationController)
recommendationRouter.post('/compare', validateBody(recommendationCompareSchema), compareRecommendationController)
recommendationRouter.post('/', validateBody(recommendationSchema), createRecommendation)
