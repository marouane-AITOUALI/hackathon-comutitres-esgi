import type { RequestHandler } from 'express'
import { acceptSubscriptionRenewal, cancelSubscriptionRenewal, getSubscriptionRenewal, refuseSubscriptionRenewal, suspendSubscriptionRenewal } from '../services/renewal.service.js'
import { AppError } from '../utils/app-error.js'
import { renewalDecisionSchema, renewalSubscriptionParamsSchema } from '../validation/renewal.schemas.js'

function authUserId(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  return req.auth.sub
}

export const showRenewal: RequestHandler = async (req, res) => {
  const { id } = renewalSubscriptionParamsSchema.parse(req.params)
  res.json(await getSubscriptionRenewal(authUserId(req), id))
}

export const acceptRenewal: RequestHandler = async (req, res) => {
  const { id } = renewalSubscriptionParamsSchema.parse(req.params)
  const body = renewalDecisionSchema.parse(req.body)
  res.json(await acceptSubscriptionRenewal(authUserId(req), id, body))
}

export const refuseRenewal: RequestHandler = async (req, res) => {
  const { id } = renewalSubscriptionParamsSchema.parse(req.params)
  const body = renewalDecisionSchema.parse(req.body)
  res.json(await refuseSubscriptionRenewal(authUserId(req), id, body))
}

export const suspendRenewal: RequestHandler = async (req, res) => {
  const { id } = renewalSubscriptionParamsSchema.parse(req.params)
  const body = renewalDecisionSchema.parse(req.body)
  res.json(await suspendSubscriptionRenewal(authUserId(req), id, body))
}

export const cancelRenewal: RequestHandler = async (req, res) => {
  const { id } = renewalSubscriptionParamsSchema.parse(req.params)
  const body = renewalDecisionSchema.parse(req.body)
  res.json(await cancelSubscriptionRenewal(authUserId(req), id, body))
}
