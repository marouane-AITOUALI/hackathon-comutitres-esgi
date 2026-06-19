import type { RequestHandler } from 'express'
import { eq } from 'drizzle-orm'
import { requireDb } from '../db/client.js'
import { users } from '../db/schema.js'
import { AppError } from '../utils/app-error.js'
import { getAuthCookie } from '../utils/auth-cookie.js'
import { verifyAuthToken } from '../utils/jwt.js'

export const authMiddleware: RequestHandler = async (request, _response, next) => {
  const authorization = request.header('authorization')
  const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined
  const token = bearerToken ?? getAuthCookie(request)
  if (!token) throw new AppError(401, 'Authentification requise.')

  try {
    const auth = verifyAuthToken(token)
    const [user] = await requireDb()
      .select({ id: users.id, archivedAt: users.archivedAt })
      .from(users)
      .where(eq(users.id, auth.sub))
      .limit(1)
    if (!user) throw new AppError(401, 'Session invalide.')
    if (user.archivedAt) throw new AppError(403, 'Ce compte est archivé.')
    request.auth = auth
    next()
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(401, 'Session invalide ou expiree.')
  }
}
