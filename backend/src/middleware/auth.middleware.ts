import type { RequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'
import { verifyAuthToken } from '../utils/jwt.js'

export const authMiddleware: RequestHandler = (request, _response, next) => {
  const authorization = request.header('authorization')
  if (!authorization?.startsWith('Bearer ')) throw new AppError(401, 'Authentification requise.')
  try {
    request.auth = verifyAuthToken(authorization.slice(7))
    next()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(401, 'Session invalide ou expiree.')
  }
}
