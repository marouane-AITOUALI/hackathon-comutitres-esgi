import * as Sentry from '@sentry/node'
import { env } from '../config/env.js'

export function initializeGlitchTip() {
  if (!env.glitchtipDsn) return

  Sentry.init({
    dsn: env.glitchtipDsn,
    environment: env.nodeEnv,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  })
}

export function captureUnexpectedError(error: unknown) {
  if (!env.glitchtipDsn) return
  Sentry.captureException(error)
}
