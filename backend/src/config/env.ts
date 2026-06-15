import 'dotenv/config'

const port = Number(process.env.PORT ?? 3000)

if (!Number.isInteger(port) || port <= 0) {
  throw new Error('PORT must be a positive integer')
}

export const env = {
  port,
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
}
