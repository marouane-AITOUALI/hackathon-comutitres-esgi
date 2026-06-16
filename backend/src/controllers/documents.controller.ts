import type { RequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'
import { createDocument, deleteDocument, analyzeDocument, fraudCheckDocument, getDocument, getDocumentAnalysis, listDocumentsForSubscription, manualReviewDocument, resubmitDocument, updateDocumentStatus } from '../services/documents.service.js'
import { createDocumentSchema, documentIdParamsSchema, manualReviewSchema, resubmitDocumentSchema, subscriptionDocumentsParamsSchema, updateDocumentStatusSchema } from '../validation/document.schemas.js'

function authUserId(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  return req.auth.sub
}

export const createForSubscription: RequestHandler = async (req, res) => {
  const { subscriptionId } = subscriptionDocumentsParamsSchema.parse(req.params)
  const body = createDocumentSchema.parse(req.body)
  res.status(201).json(await createDocument(authUserId(req), subscriptionId, body))
}

export const listForSubscription: RequestHandler = async (req, res) => {
  const { subscriptionId } = subscriptionDocumentsParamsSchema.parse(req.params)
  res.json(await listDocumentsForSubscription(authUserId(req), subscriptionId))
}

export const getById: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  res.json(await getDocument(authUserId(req), id))
}

export const remove: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  res.json(await deleteDocument(authUserId(req), id))
}

export const updateStatus: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const body = updateDocumentStatusSchema.parse(req.body)
  res.json(await updateDocumentStatus(authUserId(req), id, body))
}

export const resubmit: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const body = resubmitDocumentSchema.parse(req.body)
  res.json(await resubmitDocument(authUserId(req), id, body))
}

export const analyze: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  res.json(await analyzeDocument(authUserId(req), id))
}

export const getAnalysis: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  res.json(await getDocumentAnalysis(authUserId(req), id))
}

export const fraudCheck: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  res.json(await fraudCheckDocument(authUserId(req), id))
}

export const manualReview: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const body = manualReviewSchema.parse(req.body)
  res.json(await manualReviewDocument(authUserId(req), id, body))
}
