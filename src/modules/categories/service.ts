import { getDb } from "../../db"

import { categories, transactions } from "../../db/schema"

import type { Env } from "../../env"

import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  Category,
} from "./schema"

import { eq, sql } from "drizzle-orm"

export class CategoryService {
  /**
   * Get all categories
   */

  async list(env: Env): Promise<Category[]> {
    const db = getDb(env)

    return db

      .select({
        id: categories.id,

        name: categories.name,

        type: categories.type,

        createdAt: categories.createdAt,
      })

      .from(categories)

      .orderBy(categories.name)
  }

  /**
   * Get a single category by ID
   */

  async getById(env: Env, id: string): Promise<Category | null> {
    const db = getDb(env)

    const result = await db

      .select({
        id: categories.id,

        name: categories.name,

        type: categories.type,

        createdAt: categories.createdAt,
      })

      .from(categories)

      .where(eq(categories.id, id))

      .limit(1)

    return result[0] ?? null
  }

  /**
   * Create a new category
   */

  async create(env: Env, input: CreateCategoryInput): Promise<Category> {
    const db = getDb(env)

    const result = await db.insert(categories).values(input).returning()

    return result[0]
  }

  /**
   * Update a category
   */

  async update(
    env: Env,

    id: string,

    input: UpdateCategoryInput,
  ): Promise<Category | null> {
    const db = getDb(env)

    const result = await db

      .update(categories)

      .set(input)

      .where(eq(categories.id, id))

      .returning()

    if (result.length === 0) {
      return null
    }

    return result[0]
  }

  /**
   * Delete a category
   * Returns false if category has existing transactions
   */

  async delete(env: Env, id: string): Promise<boolean> {
    const db = getDb(env)

    // Check if category has transactions

    const transactionCount = await db

      .select({ count: sql<number>`count(*)` })

      .from(transactions)

      .where(eq(transactions.categoryId, id))

    if (transactionCount[0]?.count && transactionCount[0].count > 0) {
      return false
    }

    const result = await db

      .delete(categories)

      .where(eq(categories.id, id))

      .returning()

    return result.length > 0
  }
}

export const categoryService = new CategoryService()
