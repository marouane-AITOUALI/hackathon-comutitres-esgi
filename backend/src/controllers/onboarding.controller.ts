import type { RequestHandler } from 'express'
import { z } from 'zod'
import { createOnboardingSession, getOnboardingSession } from '../services/onboarding.service.js'
import { AppError } from '../utils/app-error.js'
export const createOnboarding: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.status(201).json(await createOnboardingSession(req.auth.sub, req.body))
}
export const getOnboarding: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await getOnboardingSession(req.auth.sub, z.uuid().parse(req.params.id)))
}
