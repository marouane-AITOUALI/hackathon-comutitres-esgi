import type { RequestHandler } from 'express'
import { cancelSubscriptionTermination, getSubscriptionTermination, requestSubscriptionTermination } from '../services/termination.service.js'
import { AppError } from '../utils/app-error.js'
import { renewalSubscriptionParamsSchema } from '../validation/renewal.schemas.js'
import { terminationDecisionSchema } from '../validation/termination.schemas.js'

function userId(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  return req.auth.sub
}

export const showTermination: RequestHandler = async (req, res) => {
  const { id } = renewalSubscriptionParamsSchema.parse(req.params)
  res.json(await getSubscriptionTermination(userId(req), id))
}

export const requestTermination: RequestHandler = async (req, res) => {
  const { id } = renewalSubscriptionParamsSchema.parse(req.params)
  res.status(201).json(await requestSubscriptionTermination(userId(req), id, terminationDecisionSchema.parse(req.body)))
}

export const cancelTermination: RequestHandler = async (req, res) => {
  const { id } = renewalSubscriptionParamsSchema.parse(req.params)
  res.json(await cancelSubscriptionTermination(userId(req), id, terminationDecisionSchema.parse(req.body)))
}
