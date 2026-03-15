import { getDb } from "../../db"

import { transactions, categories } from "../../db/schema"

import type { Env } from "../../env"

import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  Transaction,
} from "./schema"

import type { TransactionFilter } from "./schema"

import { toRupiah } from "../../lib/currency"

import { eq, desc, and, gte, lte, sql } from "drizzle-orm"

export class TransactionService {
  /**
   * Get transactions with pagination and filters
   */

  async list(env: Env, filter: TransactionFilter): Promise<{
    data: Transaction[]

    total: number
  }> {
    const db = getDb(env)

    const { page, limit, startDate, endDate, categoryId, type } = filter

    const offset = (page - 1) * limit

    const conditions = []

    if (startDate) {
      conditions.push(gte(transactions.transactionDate, startDate))
    }

    if (endDate) {
      conditions.push(lte(transactions.transactionDate, endDate))
    }

    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId))
    }

    if (type) {
      conditions.push(eq(categories.type, type))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db

      .select({
        id: transactions.id,

        categoryId: transactions.categoryId,

        categoryName: categories.name,

        categoryType: categories.type,

        amountRupiah: transactions.amountRupiah,

        description: transactions.description,

        transactionDate: transactions.transactionDate,

        createdAt: transactions.createdAt,

        updatedAt: transactions.updatedAt,
      })

      .from(transactions)

      .leftJoin(categories, eq(transactions.categoryId, categories.id))

      .where(whereClause)

      .orderBy(desc(transactions.transactionDate))

      .limit(limit)

      .offset(offset)

    // Get total count

    const countResult = await db

      .select({ count: sql<number>`count(*)` })

      .from(transactions)

      .where(whereClause)

    const total = countResult[0]?.count ?? 0

    return { data, total }
  }

  /**
   * Get a single transaction by ID
   */

  async getById(env: Env, id: string): Promise<Transaction | null> {
    const db = getDb(env)

    const result = await db

      .select({
        id: transactions.id,

        categoryId: transactions.categoryId,

        categoryName: categories.name,

        categoryType: categories.type,

        amountRupiah: transactions.amountRupiah,

        description: transactions.description,

        transactionDate: transactions.transactionDate,

        createdAt: transactions.createdAt,

        updatedAt: transactions.updatedAt,
      })

      .from(transactions)

      .leftJoin(categories, eq(transactions.categoryId, categories.id))

      .where(eq(transactions.id, id))

      .limit(1)

    return result[0] ?? null
  }

  /**
   * Create a new transaction
   */

  async create(env: Env, input: CreateTransactionInput): Promise<Transaction> {
    const db = getDb(env)

    const amountRupiah = toRupiah(input.amount)

    const result = await db

      .insert(transactions)

      .values({
        categoryId: input.categoryId,

        amountRupiah,

        description: input.description,

        transactionDate: input.transactionDate,
      })

      .returning()

    const created = result[0]

    // Fetch with category details

    const withCategory = await this.getById(env, created.id)

    if (!withCategory) {
      throw new Error("Failed to create transaction")
    }

    return withCategory
  }

  /**
   * Update a transaction
   */

  async update(
    env: Env,

    id: string,

    input: UpdateTransactionInput,
  ): Promise<Transaction | null> {
    const db = getDb(env)

    const updateData: Record<string, unknown> = {}

    if (input.amount !== undefined) {
      updateData.amountRupiah = toRupiah(input.amount)
    }

    if (input.description !== undefined) {
      updateData.description = input.description
    }

    if (input.transactionDate !== undefined) {
      updateData.transactionDate = input.transactionDate
    }

    if (input.categoryId !== undefined) {
      updateData.categoryId = input.categoryId
    }

    const result = await db

      .update(transactions)

      .set(updateData)

      .where(eq(transactions.id, id))

      .returning()

    if (result.length === 0) {
      return null
    }

    return this.getById(env, id)
  }

  /**
   * Delete a transaction
   */

  async delete(env: Env, id: string): Promise<boolean> {
    const db = getDb(env)

    const result = await db

      .delete(transactions)

      .where(eq(transactions.id, id))

      .returning()

    return result.length > 0
  }
}

export const transactionService = new TransactionService()
