import { createApp } from "../../factory"

import { zValidator } from "@hono/zod-validator"

import { ownerOnlyMiddleware } from "../auth"

import { transactionService } from "./service"

import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
} from "./schema"

import { success, error } from "../../lib/response"

import type { AppEnv } from "../../factory"

const app = createApp<AppEnv>()

// Apply owner-only middleware to all routes

app.use("*", ownerOnlyMiddleware)

/**
 * GET /transactions
 * List transactions with pagination and filters
 */

app.get("/", zValidator("query", transactionFilterSchema), async (c) => {
  const filter = c.req.valid("query")

  const { data, total } = await transactionService.list(c.env, filter)

  const totalPages = Math.ceil(total / filter.limit)

  return success(c, data, {
    page: filter.page,

    limit: filter.limit,

    total,

    totalPages,
  })
})

/**
 * POST /transactions
 * Create a new transaction
 */

app.post("/", zValidator("json", createTransactionSchema), async (c) => {
  const input = c.req.valid("json")

  const transaction = await transactionService.create(c.env, input)

  return success(c, transaction)
})

/**
 * GET /transactions/:id
 * Get a single transaction
 */

app.get("/:id", async (c) => {
  const id = c.req.param("id")

  const transaction = await transactionService.getById(c.env, id)

  if (!transaction) {
    return error(c, "NOT_FOUND", "Transaction not found", 404)
  }

  return success(c, transaction)
})

/**
 * PUT /transactions/:id
 * Update a transaction
 */

app.put("/:id", zValidator("json", updateTransactionSchema), async (c) => {
  const id = c.req.param("id")

  const input = c.req.valid("json")

  const transaction = await transactionService.update(c.env, id, input)

  if (!transaction) {
    return error(c, "NOT_FOUND", "Transaction not found", 404)
  }

  return success(c, transaction)
})

/**
 * DELETE /transactions/:id
 * Delete a transaction
 */

app.delete("/:id", async (c) => {
  const id = c.req.param("id")

  const deleted = await transactionService.delete(c.env, id)

  if (!deleted) {
    return error(c, "NOT_FOUND", "Transaction not found", 404)
  }

  return success(c, null)
})

export default app
