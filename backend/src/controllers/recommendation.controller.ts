import type { RequestHandler } from 'express'
import { recommendOffer } from '../services/recommendation.service.js'
export const createRecommendation: RequestHandler = (req, res) => { res.json(recommendOffer(req.body)) }
