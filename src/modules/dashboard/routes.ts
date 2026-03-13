import { createApp } from "../../factory"

import { zValidator } from "@hono/zod-validator"

import { ownerOnlyMiddleware } from "../auth"

import { dashboardService } from "./service"

import { dashboardFilterSchema } from "./schema"

import { success } from "../../lib/response"

import type { AppEnv } from "../../factory"

const app = createApp<AppEnv>()

// Apply owner-only middleware to all routes

app.use("*", ownerOnlyMiddleware)

/**
 * GET /dashboard/summary
 * Get monthly income/expense/balance summary
 */

app.get("/summary", zValidator("query", dashboardFilterSchema), async (c) => {
  const filter = c.req.valid("query")

  const summary = await dashboardService.getSummary(c.env, filter)

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

    const data = await dashboardService.getByCategory(c.env, filter)

    return success(c, data)
  },
)

export default app
