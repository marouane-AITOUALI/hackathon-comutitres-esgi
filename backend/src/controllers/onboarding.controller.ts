import type { RequestHandler } from 'express'
import { z } from 'zod'
import {
  completeOnboardingStep,
  createOnboardingRecommendation,
  createOnboardingSession,
  getOnboardingHelp,
  getOnboardingSession,
  getOnboardingSummary,
  updateOnboardingSession,
} from '../services/onboarding.service.js'
import { AppError } from '../utils/app-error.js'

const onboardingId = (value: unknown) => z.uuid().parse(value)

export const createOnboarding: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.status(201).json(await createOnboardingSession(req.auth.sub, req.body))
}

export const getOnboarding: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await getOnboardingSession(req.auth.sub, onboardingId(req.params.id)))
}

export const patchOnboarding: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await updateOnboardingSession(req.auth.sub, onboardingId(req.params.id), req.body))
}

export const completeStep: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await completeOnboardingStep(req.auth.sub, onboardingId(req.params.id), req.body))
}

export const onboardingSummary: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await getOnboardingSummary(req.auth.sub, onboardingId(req.params.id)))
}

export const onboardingRecommendation: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await createOnboardingRecommendation(req.auth.sub, onboardingId(req.params.id)))
}

export const onboardingHelp: RequestHandler = async (req, res) => {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  res.json(await getOnboardingHelp(req.auth.sub, onboardingId(req.params.id)))
}
