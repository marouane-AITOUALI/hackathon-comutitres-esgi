import type { RequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'
import { createDocument, deleteDocument, analyzeDocument, fraudCheckDocument, getDocument, getDocumentAnalysis, getDocumentSignedUrl, listDocumentsForSubscription, manualReviewDocument, resubmitDocument, updateDocumentStatus } from '../services/documents.service.js'
import { analyzeDemoDocument } from '../services/document-analysis.service.js'
import { analyzeDocumentDemoSchema, createDocumentSchema, documentIdParamsSchema, manualReviewSchema, resubmitDocumentSchema, subscriptionDocumentsParamsSchema, updateDocumentStatusSchema } from '../validation/document.schemas.js'

function authSession(req: Parameters<RequestHandler>[0]) {
  if (!req.auth) throw new AppError(401, 'Authentification requise.')
  return req.auth
}

export const createForSubscription: RequestHandler = async (req, res) => {
  const { subscriptionId } = subscriptionDocumentsParamsSchema.parse(req.params)
  const body = createDocumentSchema.parse(req.body)
  const session = authSession(req)
  res.status(201).json(await createDocument(session.sub, session.role, subscriptionId, body, req.file))
}

export const analyzeDemo: RequestHandler = async (req, res) => {
  const body = analyzeDocumentDemoSchema.parse(req.body)
  res.json(analyzeDemoDocument(body))
}

export const listForSubscription: RequestHandler = async (req, res) => {
  const { subscriptionId } = subscriptionDocumentsParamsSchema.parse(req.params)
  const session = authSession(req)
  res.json(await listDocumentsForSubscription(session.sub, session.role, subscriptionId))
}

export const getById: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const session = authSession(req)
  res.json(await getDocument(session.sub, session.role, id))
}

export const signedUrl: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const session = authSession(req)
  res.json(await getDocumentSignedUrl(session.sub, session.role, id))
}

export const remove: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const session = authSession(req)
  res.json(await deleteDocument(session.sub, session.role, id))
}

export const updateStatus: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const body = updateDocumentStatusSchema.parse(req.body)
  const session = authSession(req)
  res.json(await updateDocumentStatus(session.sub, session.role, id, body))
}

export const resubmit: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const body = resubmitDocumentSchema.parse(req.body)
  const session = authSession(req)
  res.json(await resubmitDocument(session.sub, session.role, id, body, req.file))
}

export const replaceFile: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const body = resubmitDocumentSchema.parse(req.body)
  const session = authSession(req)
  res.json(await resubmitDocument(session.sub, session.role, id, body, req.file))
}

export const analyze: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const session = authSession(req)
  res.json(await analyzeDocument(session.sub, session.role, id))
}

export const getAnalysis: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const session = authSession(req)
  res.json(await getDocumentAnalysis(session.sub, session.role, id))
}

export const fraudCheck: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const session = authSession(req)
  res.json(await fraudCheckDocument(session.sub, session.role, id))
}

export const manualReview: RequestHandler = async (req, res) => {
  const { id } = documentIdParamsSchema.parse(req.params)
  const body = manualReviewSchema.parse(req.body)
  const session = authSession(req)
  res.json(await manualReviewDocument(session.sub, session.role, id, body))
}
