import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

// Connection pooling for serverless environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout for new connections
});

export const db = drizzle(pool, { schema });

// Graceful shutdown for pool
process.on('beforeExit', async (): Promise<void> => {
  await pool.end();
});

// Export schema for use in migrations
export { schema };
