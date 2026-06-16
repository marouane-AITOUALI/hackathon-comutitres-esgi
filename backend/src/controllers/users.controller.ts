import type { RequestHandler } from 'express'
import { getUserTimeline } from '../services/lifecycle.service.js'
import { AppError } from '../utils/app-error.js'
import { timelineUserParamsSchema } from '../validation/renewal.schemas.js'

export const timeline: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  const { id } = timelineUserParamsSchema.parse(req.params)
  res.json(await getUserTimeline(req.auth.sub, req.auth.role, id))
}
