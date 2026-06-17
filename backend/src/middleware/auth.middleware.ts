import type { RequestHandler } from 'express'
import { AppError } from '../utils/app-error.js'
import { getAuthCookie } from '../utils/auth-cookie.js'
import { verifyAuthToken } from '../utils/jwt.js'

export const authMiddleware: RequestHandler = (request, _response, next) => {
  const authorization = request.header('authorization')
  const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined
  const token = bearerToken ?? getAuthCookie(request)
  if (!token) throw new AppError(401, 'Authentification requise.')

  try {
    request.auth = verifyAuthToken(token)
    next()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(401, 'Session invalide ou expiree.')
  }
}
