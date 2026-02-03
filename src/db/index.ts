import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import * as schema from "./schema"

// Vercel serverless-optimized connection configuration
// Neon PostgreSQL requires special handling in serverless environments
const isVercel = process.env.VERCEL === "1"

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Vercel serverless: Use single connection to avoid connection exhaustion
  // Local/Bun dev: Allow multiple connections for better performance
  max: isVercel ? 1 : 10,
  // Disable idle timeout in serverless (connections managed per-request)
  idleTimeoutMillis: isVercel ? 0 : 30000,
  connectionTimeoutMillis: 5000,
  // Enable SSL for Neon connections (required)
  // Neon requires specific SSL configuration for serverless environments
  ssl: {
    rejectUnauthorized: false, // Required for Neon's SSL certificates
  },
}

const pool = new Pool(poolConfig)

export const db = drizzle(pool, { schema })

// Graceful shutdown for non-serverless environments
// Vercel handles this automatically via function lifecycle
if (!isVercel) {
  process.on("beforeExit", async (): Promise<void> => {
    await pool.end()
  })
}

// Export schema for use in migrations
export { schema }
