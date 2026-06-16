import type { RequestHandler } from 'express'
import { cancelSubscription, createSubscription, getSubscription, listSubscriptions, submitSubscription, suspendSubscription, updateSubscription } from '../services/subscriptions.service.js'
import { AppError } from '../utils/app-error.js'
import { createSubscriptionSchema, subscriptionIdParamsSchema, updateSubscriptionSchema } from '../validation/subscription.schemas.js'

function authUserId(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  return req.auth.sub
}

export const create: RequestHandler = async (req, res) => {
  const body = createSubscriptionSchema.parse(req.body)
  res.status(201).json(await createSubscription(authUserId(req), body))
}

export const list: RequestHandler = async (req, res) => {
  res.json({ subscriptions: await listSubscriptions(authUserId(req)) })
}

export const getById: RequestHandler = async (req, res) => {
  const { id } = subscriptionIdParamsSchema.parse(req.params)
  res.json(await getSubscription(authUserId(req), id))
}

export const update: RequestHandler = async (req, res) => {
  const { id } = subscriptionIdParamsSchema.parse(req.params)
  const body = updateSubscriptionSchema.parse(req.body)
  res.json(await updateSubscription(authUserId(req), id, body))
}

export const submit: RequestHandler = async (req, res) => {
  const { id } = subscriptionIdParamsSchema.parse(req.params)
  res.json(await submitSubscription(authUserId(req), id))
}

export const cancel: RequestHandler = async (req, res) => {
  const { id } = subscriptionIdParamsSchema.parse(req.params)
  res.json(await cancelSubscription(authUserId(req), id))
}

export const suspend: RequestHandler = async (req, res) => {
  const { id } = subscriptionIdParamsSchema.parse(req.params)
  res.json(await suspendSubscription(authUserId(req), id))
}
