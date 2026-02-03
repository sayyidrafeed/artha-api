import { Hono } from "hono"
import { corsMiddleware } from "./middleware/cors"
import { loggingMiddleware } from "./middleware/logging"
import { authRateLimit, apiRateLimit } from "./middleware/rate-limit"
import { errorHandler } from "./middleware/error-handler"
import { auth } from "./modules/auth"
import transactionsRoutes from "./modules/transactions/routes"
import categoriesRoutes from "./modules/categories/routes"
import dashboardRoutes from "./modules/dashboard/routes"

const app = new Hono()

// Global middleware
app.use("*", corsMiddleware)
app.use("*", loggingMiddleware)
app.onError(errorHandler)

// Rate limiting
app.use("/api/auth/*", authRateLimit)
app.use("/api/*", apiRateLimit)

// Better Auth routes
app.all("/api/auth/*", (c) => auth.handler(c.req.raw))

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
