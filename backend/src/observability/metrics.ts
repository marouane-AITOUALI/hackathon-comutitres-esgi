import type { NextFunction, Request, Response } from 'express'
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client'
import { env } from '../config/env.js'

export const metricsRegistry = new Registry()

collectDefaultMetrics({
  prefix: 'comutitres_node_',
  register: metricsRegistry,
})

const requestCount = new Counter({
  name: 'comutitres_http_requests_total',
  help: 'Nombre total de requetes HTTP.',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
})

const requestDuration = new Histogram({
  name: 'comutitres_http_request_duration_seconds',
  help: 'Duree des requetes HTTP en secondes.',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
})

const requestsInFlight = new Gauge({
  name: 'comutitres_http_requests_in_flight',
  help: 'Nombre de requetes HTTP en cours.',
  registers: [metricsRegistry],
})

function normalizedRoute(req: Request) {
  const routePath = req.route?.path
  if (routePath) return `${req.baseUrl}${routePath}`
  return req.path.startsWith('/api/') ? req.path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id') : req.path
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/metrics') {
    next()
    return
  }

  requestsInFlight.inc()
  const stopTimer = requestDuration.startTimer()
  res.once('finish', () => {
    const labels = {
      method: req.method,
      route: normalizedRoute(req),
      status_code: String(res.statusCode),
    }
    requestCount.inc(labels)
    stopTimer(labels)
    requestsInFlight.dec()
  })
  next()
}

export async function metricsHandler(req: Request, res: Response) {
  if (env.nodeEnv === 'production') {
    const expected = env.metricsToken
    const provided = req.header('authorization')
    if (!expected || provided !== `Bearer ${expected}`) {
      res.status(404).end()
      return
    }
  }
  res.setHeader('Content-Type', metricsRegistry.contentType)
  res.send(await metricsRegistry.metrics())
}
