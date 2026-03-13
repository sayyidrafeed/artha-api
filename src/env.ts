import { z } from "zod"

export const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),

  BETTER_AUTH_SECRET: z.string().min(32),

  BETTER_AUTH_URL: z.string().url(),

  OWNER_EMAIL: z.string().email(),

  FRONTEND_URLS: z
    .string()
    .min(1)
    .transform((val) =>
      val
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
    ),

  // OAuth Providers

  GITHUB_CLIENT_ID: z.string().min(1),

  GITHUB_CLIENT_SECRET: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1),

  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // Optional: Upstash Redis for rate limiting

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),

  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Optional: Hyperdrive for database connection pooling

  HYPERDRIVE_ID: z.string().min(1).optional(),

  // Environment

  NODE_ENV: z.enum(["development", "production"]).optional(),
})

export type Env = z.infer<typeof EnvSchema>
