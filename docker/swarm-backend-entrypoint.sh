#!/bin/sh
set -eu

read_secret() {
  tr -d '\r\n' < "/run/secrets/$1"
}

postgres_password="$(read_secret postgres_password)"
export DATABASE_URL="postgresql://comutitres:${postgres_password}@database:5432/comutitres"
export JWT_SECRET="$(read_secret jwt_secret)"
export SUPABASE_URL="$(read_secret supabase_url)"
export SUPABASE_ANON_KEY="$(read_secret supabase_anon_key)"
export SUPABASE_SERVICE_ROLE_KEY="$(read_secret supabase_service_role_key)"

node dist/db/migrate.js
exec node dist/server.js
