import type { RequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'

export const adminMiddleware: RequestHandler = (request, _response, next) => {
  if (!request.auth) throw new AppError(401, 'Authentification requise.')
  if (request.auth.role !== 'admin') throw new AppError(403, 'Acces reserve au backoffice.')
  next()
}
