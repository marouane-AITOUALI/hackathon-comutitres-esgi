import type { RequestHandler } from 'express'
import { recommendOffer } from '../services/recommendation.service.js'
export const createRecommendation: RequestHandler = async (req, res) => {
	try {
		const result = await recommendOffer(req.body)
		res.json({ success: true, recommendation: result })
	} catch (err) {
		console.error('recommendation error', err)
		res.status(500).json({ success: false, error: 'Erreur serveur lors de la recommandation' })
	}
}
