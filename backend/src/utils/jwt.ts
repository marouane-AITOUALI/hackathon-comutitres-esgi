import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { AuthTokenPayload } from '../types/auth.js'
import { AppError } from './app-error.js'

function secret() {
  if (!env.jwtSecret) throw new AppError(503, 'La configuration JWT du serveur est incomplete.')
  return env.jwtSecret
}
export const createAuthToken = (payload: AuthTokenPayload) => jwt.sign(payload, secret(), { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] })
export const verifyAuthToken = (token: string) => jwt.verify(token, secret()) as AuthTokenPayload
