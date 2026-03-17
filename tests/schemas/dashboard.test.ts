/**
 * Dashboard Schema Tests
 * Following TDD: Tests for dashboard-related Zod schemas
 */

import { describe, it, expect } from "bun:test"
import {
  dashboardFilterSchema,
  monthlySummarySchema,
  categoryAggregationSchema,
  dashboardByCategorySchema,
} from "@/modules/dashboard/schema"

describe("dashboardFilterSchema", () => {
  it("should validate correct input with year only", () => {
    const result = dashboardFilterSchema.safeParse({ year: 2024 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.year).toBe(2024)
      expect(result.data.month).toBeUndefined()
    }
  })

  it("should validate correct input with year and month", () => {
    const result = dashboardFilterSchema.safeParse({ year: 2024, month: 6 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.year).toBe(2024)
      expect(result.data.month).toBe(6)
    }
  })

  it("should coerce string to number", () => {
    const result = dashboardFilterSchema.safeParse({ year: "2024", month: "1" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.year).toBe(2024)
      expect(result.data.month).toBe(1)
    }
  })

  it("should reject year below minimum", () => {
    const result = dashboardFilterSchema.safeParse({ year: 1999 })
    expect(result.success).toBe(false)
  })

  it("should reject year above maximum", () => {
    const result = dashboardFilterSchema.safeParse({ year: 2101 })
    expect(result.success).toBe(false)
  })

  it("should reject month < 1", () => {
    const result = dashboardFilterSchema.safeParse({ year: 2024, month: 0 })
    expect(result.success).toBe(false)
  })

  it("should reject month > 12", () => {
    const result = dashboardFilterSchema.safeParse({ year: 2024, month: 13 })
    expect(result.success).toBe(false)
  })

  it("should reject missing year", () => {
    const result = dashboardFilterSchema.safeParse({ month: 6 })
    expect(result.success).toBe(false)
  })

  it("should accept minimum valid year", () => {
    const result = dashboardFilterSchema.safeParse({ year: 2000 })
    expect(result.success).toBe(true)
  })

  it("should accept maximum valid year", () => {
    const result = dashboardFilterSchema.safeParse({ year: 2100 })
    expect(result.success).toBe(true)
  })

  it("should accept month 1", () => {
    const result = dashboardFilterSchema.safeParse({ year: 2024, month: 1 })
    expect(result.success).toBe(true)
  })

  it("should accept month 12", () => {
    const result = dashboardFilterSchema.safeParse({ year: 2024, month: 12 })
    expect(result.success).toBe(true)
  })
})

describe("monthlySummarySchema", () => {
  const validSummary = {
    year: 2024,
    month: 6,
    incomeRupiah: 5000000,
    expenseRupiah: 2000000,
    balanceRupiah: 3000000,
  }

  it("should validate correct summary", () => {
    const result = monthlySummarySchema.safeParse(validSummary)
    expect(result.success).toBe(true)
  })

  it("should validate without month (yearly summary)", () => {
    const input = {
      year: 2024,
      incomeRupiah: 60000000,
      expenseRupiah: 24000000,
      balanceRupiah: 36000000,
    }
    const result = monthlySummarySchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should reject negative incomeRupiah", () => {
    const input = { ...validSummary, incomeRupiah: -100 }
    const result = monthlySummarySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject negative expenseRupiah", () => {
    const input = { ...validSummary, expenseRupiah: -100 }
    const result = monthlySummarySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject non-integer values", () => {
    const input = { ...validSummary, incomeRupiah: 100.5 }
    const result = monthlySummarySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing year", () => {
    const input = {
      month: 6,
      incomeRupiah: 5000000,
      expenseRupiah: 2000000,
      balanceRupiah: 3000000,
    }
    const result = monthlySummarySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should accept zero values", () => {
    const input = {
      year: 2024,
      month: 6,
      incomeRupiah: 0,
      expenseRupiah: 0,
      balanceRupiah: 0,
    }
    const result = monthlySummarySchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})

describe("categoryAggregationSchema", () => {
  const validAggregation = {
    categoryId: "123e4567-e89b-12d3-a456-426614174000",
    categoryName: "Salary",
    type: "income" as const,
    totalRupiah: 5000000,
    transactionCount: 10,
  }

  it("should validate correct aggregation", () => {
    const result = categoryAggregationSchema.safeParse(validAggregation)
    expect(result.success).toBe(true)
  })

  it("should accept nullable categoryId", () => {
    const input = { ...validAggregation, categoryId: null }
    const result = categoryAggregationSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept nullable categoryName", () => {
    const input = { ...validAggregation, categoryName: null }
    const result = categoryAggregationSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept nullable type", () => {
    const input = { ...validAggregation, type: null }
    const result = categoryAggregationSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should reject invalid type", () => {
    const input = { ...validAggregation, type: "invalid" }
    const result = categoryAggregationSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject negative totalRupiah", () => {
    const input = { ...validAggregation, totalRupiah: -100 }
    const result = categoryAggregationSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject negative transactionCount", () => {
    const input = { ...validAggregation, transactionCount: -1 }
    const result = categoryAggregationSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject non-integer transactionCount", () => {
    const input = { ...validAggregation, transactionCount: 1.5 }
    const result = categoryAggregationSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe("dashboardByCategorySchema", () => {
  const validDashboard = {
    year: 2024,
    month: 6,
    income: [
      {
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        categoryName: "Salary",
        type: "income" as const,
        totalRupiah: 5000000,
        transactionCount: 10,
      },
    ],
    expense: [
      {
        categoryId: "123e4567-e89b-12d3-a456-426614174001",
        categoryName: "Food",
        type: "expense" as const,
        totalRupiah: 2000000,
        transactionCount: 15,
      },
    ],
  }

  it("should validate correct dashboard data", () => {
    const result = dashboardByCategorySchema.safeParse(validDashboard)
    expect(result.success).toBe(true)
  })

  it("should validate without month (yearly)", () => {
    const input = {
      year: 2024,
      income: validDashboard.income,
      expense: validDashboard.expense,
    }
    const result = dashboardByCategorySchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept empty income array", () => {
    const input = { ...validDashboard, income: [] }
    const result = dashboardByCategorySchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept empty expense array", () => {
    const input = { ...validDashboard, expense: [] }
    const result = dashboardByCategorySchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should reject invalid income item", () => {
    const input = {
      ...validDashboard,
      income: [{ invalid: "data" }],
    }
    const result = dashboardByCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing income array", () => {
    const input = { year: 2024, expense: validDashboard.expense }
    const result = dashboardByCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing expense array", () => {
    const input = { year: 2024, income: validDashboard.income }
    const result = dashboardByCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
