import { cors } from "hono/cors"

import type { MiddlewareHandler } from "hono"

import type { AppEnv } from "../factory"

import { EnvSchema } from "../env"

export const corsMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  // Validate environment variables

  const envResult = EnvSchema.safeParse(c.env)

  if (!envResult.success) {
    return c.json({ message: "Server misconfiguration" }, 500)
  }

  const env = envResult.data

  const corsHandler = cors({
    origin: (origin): string | null => {
      if (!origin) return null

      // Case-insensitive origin validation for security

      if (env.FRONTEND_URLS.includes(origin.toLowerCase())) {
        return origin // Return original case to preserve protocol/subdomain
      }

      return null // Explicitly deny unlisted origins
    },

    credentials: true,

    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],

    exposeHeaders: ["Set-Cookie"],

    maxAge: 86400,
  })

  // Run CORS middleware

  const response = await corsHandler(c, next)

  return response ?? next()
}
