import { createApp } from "../../factory"

import { zValidator } from "@hono/zod-validator"

import { ownerOnlyMiddleware } from "../auth"

import { categoryService } from "./service"

import { createCategorySchema, updateCategorySchema } from "./schema"

import { success, error } from "../../lib/response"

import type { AppEnv } from "../../factory"

const app = createApp<AppEnv>()

// Apply owner-only middleware to all routes

app.use("*", ownerOnlyMiddleware)

/**
 * GET /categories
 * List all categories
 */

app.get("/", async (c) => {
  const categories = await categoryService.list(c.env)

  return success(c, categories)
})

/**
 * GET /categories/:id
 * Get a single category
 */

app.get("/:id", async (c) => {
  const id = c.req.param("id")

  const category = await categoryService.getById(c.env, id)

  if (!category) {
    return error(c, "NOT_FOUND", "Category not found", 404)
  }

  return success(c, category)
})

/**
 * POST /categories
 * Create a new category
 */

app.post("/", zValidator("json", createCategorySchema), async (c) => {
  const input = c.req.valid("json")

  const category = await categoryService.create(c.env, input)

  return success(c, category)
})

/**
 * PUT /categories/:id
 * Update a category
 */

app.put("/:id", zValidator("json", updateCategorySchema), async (c) => {
  const id = c.req.param("id")

  const input = c.req.valid("json")

  const category = await categoryService.update(c.env, id, input)

  if (!category) {
    return error(c, "NOT_FOUND", "Category not found", 404)
  }

  return success(c, category)
})

/**
 * DELETE /categories/:id
 * Delete a category
 */

app.delete("/:id", async (c) => {
  const id = c.req.param("id")

  const deleted = await categoryService.delete(c.env, id)

  if (!deleted) {
    return error(
      c,

      "VALIDATION_ERROR",

      "Cannot delete category with existing transactions",

      400,
    )
  }

  return success(c, null)
})

export default app
