import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { ownerOnlyMiddleware } from "../auth"
import { dashboardService } from "./service"
import { dashboardFilterSchema } from "./schema"
import { success } from "../../lib/response"

const app = new Hono()

// Apply owner-only middleware to all routes
app.use("*", ownerOnlyMiddleware)

/**
 * GET /dashboard/summary
 * Get monthly income/expense/balance summary
 */
app.get("/summary", zValidator("query", dashboardFilterSchema), async (c) => {
  const filter = c.req.valid("query")
  const summary = await dashboardService.getSummary(filter)

  return success(c, summary)
})

/**
 * GET /dashboard/by-category
 * Get transactions aggregated by category
 */
app.get(
  "/by-category",
  zValidator("query", dashboardFilterSchema),
  async (c) => {
    const filter = c.req.valid("query")
    const data = await dashboardService.getByCategory(filter)

    return success(c, data)
  },
)

export default app
