import "dotenv/config";

const port = Number(process.env.PORT ?? 3000);
const defaultCorsOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];
const corsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port,
  corsOrigins: corsOrigins.length > 0 ? corsOrigins : defaultCorsOrigins,
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
};
