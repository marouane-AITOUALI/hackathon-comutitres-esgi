import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFoundHandler } from './middleware/not-found.js'
import { metricsHandler, metricsMiddleware } from './observability/metrics.js'
import { apiRouter } from './routes/index.js'

export const app = express()

app.use(helmet())
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Origin non autorisee par CORS.'))
  },
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(metricsMiddleware)

app.get('/api/metrics', metricsHandler)
app.use('/api', apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)
