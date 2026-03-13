import { Pool } from "@neondatabase/serverless"

import { drizzle } from "drizzle-orm/neon-serverless"

import * as schema from "./schema"

import type { Env } from "../env"

/**
 * Creates a fresh database instance for each request.
 * IMPORTANT: Do NOT cache database instances globally in Cloudflare Workers.
 * Database connections created in one request context cannot be
 * accessed from another request's handler due to Cloudflare's isolation model.
 */

export function getDb(env: Env) {
  const connectionString = env.DATABASE_URL

  const poolConfig = {
    connectionString,

    // Cloudflare Workers: Use single connection per request

    max: 1,

    // Disable idle timeout (connections managed per-request)

    idleTimeoutMillis: 0,

    connectionTimeoutMillis: 5000,

    // Enable SSL for Neon connections (required)

    ssl: {
      rejectUnauthorized: false, // Required for Neon's SSL certificates
    },
  }

  const pool = new Pool(poolConfig)

  return drizzle(pool, { schema })
}

// Export schema for use in migrations

export { schema }
