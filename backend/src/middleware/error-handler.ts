import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { captureUnexpectedError } from '../observability/glitchtip.js'
import { AppError } from '../utils/app-error.js'

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message, ...(error.details ? { details: error.details } : {}) })
    return
  }
  if (error instanceof ZodError) {
    response.status(400).json({ message: 'Les donnees envoyees sont invalides.', details: error.flatten() })
    return
  }
  captureUnexpectedError(error)
  console.error(error)
  response.status(500).json({ message: 'Une erreur interne est survenue.' })
}
