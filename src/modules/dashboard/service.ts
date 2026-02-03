import { db } from "../../db"
import { transactions, categories } from "../../db/schema"
import { eq, and, gte, lte, sql } from "drizzle-orm"
import type { DashboardFilter } from "./schema"

interface MonthlySummary {
  year: number
  month: number | undefined
  incomeCents: number
  expenseCents: number
  balanceCents: number
}

interface CategoryAggregation {
  categoryId: string | null
  categoryName: string | null
  type: "income" | "expense" | null
  totalCents: number
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
  async getSummary(filter: DashboardFilter): Promise<MonthlySummary> {
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
        incomeCents: sql<number>`SUM(CASE WHEN ${categories.type} = 'income' THEN ${transactions.amountCents} ELSE 0 END)`,
        expenseCents: sql<number>`SUM(CASE WHEN ${categories.type} = 'expense' THEN ${transactions.amountCents} ELSE 0 END)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(dateCondition)

    const incomeCents = result[0]?.incomeCents ?? 0
    const expenseCents = result[0]?.expenseCents ?? 0
    const balanceCents = incomeCents - expenseCents

    return {
      year,
      month,
      incomeCents,
      expenseCents,
      balanceCents,
    }
  }

  /**
   * Get transactions aggregated by category
   */
  async getByCategory(filter: DashboardFilter): Promise<DashboardByCategory> {
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
        totalCents: sql<number>`SUM(${transactions.amountCents})`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(dateCondition)
      .groupBy(categories.id, categories.name, categories.type)
      .orderBy(sql`SUM(${transactions.amountCents}) DESC`)

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
