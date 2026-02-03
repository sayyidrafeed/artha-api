import { cors } from "hono/cors"
import type { MiddlewareHandler } from "hono"

// Read allowed origins from environment variable, with fallbacks for development
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS
  if (envOrigins) {
    return envOrigins.split(",").map((origin) => origin.trim())
  }

  // Fallback origins for development (should not be used in production)
  return ["http://localhost:5173"]
}

const allowedOrigins = getAllowedOrigins()

export const corsMiddleware: MiddlewareHandler = cors({
  origin: (origin): string | null => {
    if (!origin) return null
    // Case-insensitive origin validation for security
    if (allowedOrigins.includes(origin.toLowerCase())) {
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
