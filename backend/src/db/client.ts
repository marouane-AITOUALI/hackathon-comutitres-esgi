import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../config/env.js'
import * as schema from './schema.js'

const queryClient = env.databaseUrl
  ? postgres(env.databaseUrl, { prepare: false })
  : null

export const db = queryClient ? drizzle(queryClient, { schema }) : null
export const isDatabaseConfigured = db !== null
