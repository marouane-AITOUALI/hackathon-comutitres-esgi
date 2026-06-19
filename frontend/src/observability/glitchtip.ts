import * as Sentry from '@sentry/react'

export function initializeGlitchTip() {
  const dsn = import.meta.env.VITE_GLITCHTIP_DSN?.trim()
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  })
}
