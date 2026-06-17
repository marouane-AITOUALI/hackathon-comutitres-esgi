import type { CookieOptions, Request, Response } from 'express'
import { env } from '../config/env.js'

export const AUTH_COOKIE_NAME = 'comutitres_auth_token'

const unitMs = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
}

function cookieMaxAgeMs() {
  const match = /^(\d+)([smhd])$/.exec(env.jwtExpiresIn)
  if (match) {
    const value = Number(match[1] ?? 0)
    const unit = match[2] as keyof typeof unitMs
    return value * unitMs[unit]
  }

  const seconds = Number(env.jwtExpiresIn)
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 7 * unitMs.d
}

function cookieOptions(): CookieOptions {
  const production = env.nodeEnv === 'production'
  return {
    httpOnly: true,
    maxAge: cookieMaxAgeMs(),
    path: '/',
    sameSite: production ? 'none' : 'lax',
    secure: production,
  }
}

export function setAuthCookie(response: Response, token: string) {
  response.cookie(AUTH_COOKIE_NAME, token, cookieOptions())
}

export function clearAuthCookie(response: Response) {
  const options = cookieOptions()
  delete options.maxAge
  response.clearCookie(AUTH_COOKIE_NAME, options)
}

export function getAuthCookie(request: Request) {
  const cookieHeader = request.headers.cookie
  if (!cookieHeader) return undefined

  for (const cookie of cookieHeader.split(';')) {
    const index = cookie.indexOf('=')
    if (index < 0) continue
    const name = cookie.slice(0, index).trim()
    const value = cookie.slice(index + 1).trim()
    if (name === AUTH_COOKIE_NAME) return decodeURIComponent(value)
  }

  return undefined
}
