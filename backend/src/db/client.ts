import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../config/env.js'
import { AppError } from '../utils/app-error.js'
import * as schema from './schema.js'

const queryClient = env.databaseUrl
  ? postgres(env.databaseUrl, { prepare: false })
  : null

export const db = queryClient ? drizzle(queryClient, { schema }) : null
export const isDatabaseConfigured = db !== null

export function requireDb() {
  if (!db) throw new AppError(503, "La connexion a la base de donnees n'est pas configuree.")
  return db
}

export async function closeDb() {
  await queryClient?.end({ timeout: 5 })
}
