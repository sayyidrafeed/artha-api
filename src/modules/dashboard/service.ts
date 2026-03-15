import { getDb } from "../../db"

import { transactions, categories } from "../../db/schema"

import { eq, and, gte, lte, sql } from "drizzle-orm"

import type { Env } from "../../env"

import type { DashboardFilter } from "./schema"

interface MonthlySummary {
  year: number

  month: number | undefined

  incomeRupiah: number

  expenseRupiah: number

  balanceRupiah: number
}

interface CategoryAggregation {
  categoryId: string | null

  categoryName: string | null

  type: "income" | "expense" | null

  totalRupiah: number

  transactionCount: number
}

interface DashboardByCategory {
  year: number

  month: number | undefined

  income: CategoryAggregation[]

  expense: CategoryAggregation[]
}

export class DashboardService {
  /**
   * Get monthly income/expense/balance summary
   */

  async getSummary(env: Env, filter: DashboardFilter): Promise<MonthlySummary> {
    const db = getDb(env)

    const { year, month } = filter

    let dateCondition

    if (month) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`

      const endDate = `${year}-${String(month).padStart(2, "0")}-31`

      dateCondition = and(
        gte(transactions.transactionDate, startDate),

        lte(transactions.transactionDate, endDate),
      )
    } else {
      const startDate = `${year}-01-01`

      const endDate = `${year}-12-31`

      dateCondition = and(
        gte(transactions.transactionDate, startDate),

        lte(transactions.transactionDate, endDate),
      )
    }

    const result = await db

      .select({
        incomeRupiah: sql<number>`SUM(CASE WHEN ${categories.type} = 'income' THEN ${transactions.amountRupiah} ELSE 0 END)`,

        expenseRupiah: sql<number>`SUM(CASE WHEN ${categories.type} = 'expense' THEN ${transactions.amountRupiah} ELSE 0 END)`,
      })

      .from(transactions)

      .leftJoin(categories, eq(transactions.categoryId, categories.id))

      .where(dateCondition)

    const incomeRupiah = result[0]?.incomeRupiah ?? 0

    const expenseRupiah = result[0]?.expenseRupiah ?? 0

    const balanceRupiah = incomeRupiah - expenseRupiah

    return {
      year,

      month,

      incomeRupiah,

      expenseRupiah,

      balanceRupiah,
    }
  }

  /**
   * Get transactions aggregated by category
   */

  async getByCategory(
    env: Env,

    filter: DashboardFilter,
  ): Promise<DashboardByCategory> {
    const db = getDb(env)

    const { year, month } = filter

    let dateCondition

    if (month) {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`

      const endDate = `${year}-${String(month).padStart(2, "0")}-31`

      dateCondition = and(
        gte(transactions.transactionDate, startDate),

        lte(transactions.transactionDate, endDate),
      )
    } else {
      const startDate = `${year}-01-01`

      const endDate = `${year}-12-31`

      dateCondition = and(
        gte(transactions.transactionDate, startDate),

        lte(transactions.transactionDate, endDate),
      )
    }

    const result = await db

      .select({
        categoryId: categories.id,

        categoryName: categories.name,

        type: categories.type,

        totalRupiah: sql<number>`SUM(${transactions.amountRupiah})`,

        transactionCount: sql<number>`COUNT(*)`,
      })

      .from(transactions)

      .leftJoin(categories, eq(transactions.categoryId, categories.id))

      .where(dateCondition)

      .groupBy(categories.id, categories.name, categories.type)

      .orderBy(sql`SUM(${transactions.amountRupiah}) DESC`)

    const income = result.filter((r) => r.type === "income")

    const expense = result.filter((r) => r.type === "expense")

    return {
      year,

      month,

      income,

      expense,
    }
  }
}

export const dashboardService = new DashboardService()
