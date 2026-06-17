import type { Request, Response } from 'express'
import { isDatabaseConfigured } from '../db/client.js'

export function getHealth(_request: Request, response: Response) {
  response.json({
    status: 'ok',
    database: isDatabaseConfigured ? 'configured' : 'not_configured',
  })
}
