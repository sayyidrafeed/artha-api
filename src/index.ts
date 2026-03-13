import { corsMiddleware } from "./middleware/cors"

import { loggingMiddleware } from "./middleware/logging"

import { authRateLimit, apiRateLimit } from "./middleware/rate-limit"

import { errorHandler } from "./middleware/error-handler"

import { getAuth } from "./modules/auth/better-auth"

import transactionsRoutes from "./modules/transactions/routes"

import categoriesRoutes from "./modules/categories/routes"

import dashboardRoutes from "./modules/dashboard/routes"

import { createApp } from "./factory"

import { EnvSchema } from "./env"

const app = createApp()

// Global middleware

app.use("*", corsMiddleware)

app.use("*", loggingMiddleware)

app.onError(errorHandler)

// Rate limiting

app.use("/api/auth/*", authRateLimit)

app.use("/api/*", apiRateLimit)

// Better Auth routes - pass env for Cloudflare Workers

app.all("/api/auth/*", async (c) => {
  const envResult = EnvSchema.safeParse(c.env)

  if (!envResult.success) {
    return c.json({ message: "Server misconfiguration" }, 500)
  }

  const auth = getAuth(envResult.data)

  return auth.handler(c.req.raw)
})

// Module routes

app.route("/api/transactions", transactionsRoutes)

app.route("/api/categories", categoriesRoutes)

app.route("/api/dashboard", dashboardRoutes)

// Health check endpoint

app.get("/health", async (c) => {
  try {
    return c.json({
      status: "ok",

      timestamp: new Date().toISOString(),

      version: "1.0.0",
    })
  } catch {
    return c.json({ status: "unhealthy" }, 503)
  }
})

export default app
