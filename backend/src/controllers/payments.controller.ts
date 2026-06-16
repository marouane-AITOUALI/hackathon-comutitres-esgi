import type { RequestHandler } from 'express'
import { cancelPayment, createDirectPayment, createMandatePayment, getPayment, regularizePayment, simulatePayment } from '../services/payments.service.js'
import { AppError } from '../utils/app-error.js'
import { directPaymentSchema, mandatePaymentSchema, paymentIdParamsSchema, paymentSimulationSchema, regularizePaymentSchema } from '../validation/payment.schemas.js'

function auth(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  return req.auth
}

export const simulate: RequestHandler = async (req, res) => {
  const body = paymentSimulationSchema.parse(req.body)
  res.json(await simulatePayment(auth(req).sub, body))
}

export const direct: RequestHandler = async (req, res) => {
  const body = directPaymentSchema.parse(req.body)
  res.status(201).json(await createDirectPayment(auth(req).sub, body))
}

export const mandate: RequestHandler = async (req, res) => {
  const body = mandatePaymentSchema.parse(req.body)
  res.status(201).json(await createMandatePayment(auth(req).sub, body))
}

export const show: RequestHandler = async (req, res) => {
  const { id } = paymentIdParamsSchema.parse(req.params)
  const session = auth(req)
  res.json(await getPayment(session.sub, session.role, id))
}

export const cancel: RequestHandler = async (req, res) => {
  const { id } = paymentIdParamsSchema.parse(req.params)
  const session = auth(req)
  res.json(await cancelPayment(session.sub, session.role, id))
}

export const regularize: RequestHandler = async (req, res) => {
  const { id } = paymentIdParamsSchema.parse(req.params)
  const body = regularizePaymentSchema.parse(req.body)
  const session = auth(req)
  res.json(await regularizePayment(session.sub, session.role, id, body))
}
