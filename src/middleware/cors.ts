import { cors } from "hono/cors"
import type { MiddlewareHandler } from "hono"

const allowedOrigins = [
  "https://artha.sayyidrafee.com",
  "http://localhost:5173", // Development
]

export const corsMiddleware: MiddlewareHandler = cors({
  origin: (origin): string | null => {
    if (!origin) return "*"
    if (allowedOrigins.includes(origin)) {
      return origin
    }
    return null
  },
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposeHeaders: ["Set-Cookie"],
  maxAge: 86400,
})
