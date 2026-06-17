import type { RequestHandler } from 'express'
import { compareOffers, explainRecommendation, recommendOffer, simulateRecommendations } from '../services/recommendation.service.js'

export const createRecommendation: RequestHandler = async (req, res) => {
  const result = await recommendOffer(req.body)
  res.json({ success: true, recommendation: result })
}

export const explainRecommendationController: RequestHandler = async (req, res) => {
  res.json({ success: true, explanation: await explainRecommendation(req.body) })
}

export const simulateRecommendationController: RequestHandler = async (req, res) => {
  res.json({ success: true, simulation: await simulateRecommendations(req.body) })
}

export const compareRecommendationController: RequestHandler = async (req, res) => {
  res.json({ success: true, comparison: await compareOffers(req.body) })
}
