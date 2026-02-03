/**
 * Dashboard service tests
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { DashboardService } from "@/modules/dashboard/service"
import type { DashboardFilter } from "@/modules/dashboard/schema"

describe("DashboardService", () => {
  let dashboardService: DashboardService

  beforeEach(() => {
    dashboardService = new DashboardService()
  })

  afterEach(() => {
    // Cleanup test database
  })

  describe("getSummary", () => {
    it("should return monthly summary", async () => {
      const filter: DashboardFilter = {
        year: 2024,
        month: 1,
      }

      const result = await dashboardService.getSummary(filter)

      expect(result).toBeDefined()
      expect(result.year).toBe(2024)
      expect(result.month).toBe(1)
      expect(typeof result.incomeCents).toBe("number")
      expect(typeof result.expenseCents).toBe("number")
      expect(typeof result.balanceCents).toBe("number")
    })

    it("should return yearly summary when month is omitted", async () => {
      const filter: DashboardFilter = {
        year: 2024,
      }

      const result = await dashboardService.getSummary(filter)

      expect(result).toBeDefined()
      expect(result.year).toBe(2024)
      expect(result.month).toBeUndefined()
    })

    it("should calculate balance correctly", async () => {
      const filter: DashboardFilter = {
        year: 2024,
        month: 1,
      }

      const result = await dashboardService.getSummary(filter)

      expect(result.balanceCents).toBe(result.incomeCents - result.expenseCents)
    })

    it("should handle zero transactions", async () => {
      const filter: DashboardFilter = {
        year: 2025,
        month: 1,
      }

      const result = await dashboardService.getSummary(filter)

      expect(result.incomeCents).toBe(0)
      expect(result.expenseCents).toBe(0)
      expect(result.balanceCents).toBe(0)
    })
  })

  describe("getByCategory", () => {
    it("should return category breakdown", async () => {
      const filter: DashboardFilter = {
        year: 2024,
        month: 1,
      }

      const result = await dashboardService.getByCategory(filter)

      expect(result).toBeDefined()
      expect(result.year).toBe(2024)
      expect(result.month).toBe(1)
      expect(Array.isArray(result.income)).toBe(true)
      expect(Array.isArray(result.expense)).toBe(true)
    })

    it("should return yearly breakdown when month is omitted", async () => {
      const filter: DashboardFilter = {
        year: 2024,
      }

      const result = await dashboardService.getByCategory(filter)

      expect(result).toBeDefined()
      expect(result.year).toBe(2024)
      expect(result.month).toBeUndefined()
    })

    it("should return category aggregation with correct structure", async () => {
      const filter: DashboardFilter = {
        year: 2024,
        month: 1,
      }

      const result = await dashboardService.getByCategory(filter)

      if (result.income.length > 0) {
        const incomeItem = result.income[0]
        expect(incomeItem).toHaveProperty("categoryId")
        expect(incomeItem).toHaveProperty("categoryName")
        expect(incomeItem).toHaveProperty("type")
        expect(incomeItem).toHaveProperty("totalCents")
        expect(incomeItem).toHaveProperty("transactionCount")
        expect(incomeItem.type).toBe("income")
      }

      if (result.expense.length > 0) {
        const expenseItem = result.expense[0]
        expect(expenseItem).toHaveProperty("categoryId")
        expect(expenseItem).toHaveProperty("categoryName")
        expect(expenseItem).toHaveProperty("type")
        expect(expenseItem).toHaveProperty("totalCents")
        expect(expenseItem).toHaveProperty("transactionCount")
        expect(expenseItem.type).toBe("expense")
      }
    })

    it("should sort categories by totalCents descending", async () => {
      const filter: DashboardFilter = {
        year: 2024,
        month: 1,
      }

      const result = await dashboardService.getByCategory(filter)

      const checkSorted = (items: typeof result.income) => {
        for (let i = 1; i < items.length; i++) {
          expect(items[i].totalCents <= items[i - 1].totalCents).toBe(true)
        }
      }

      checkSorted(result.income)
      checkSorted(result.expense)
    })

    it("should handle zero transactions", async () => {
      const filter: DashboardFilter = {
        year: 2025,
        month: 1,
      }

      const result = await dashboardService.getByCategory(filter)

      expect(result.income).toHaveLength(0)
      expect(result.expense).toHaveLength(0)
    })
  })
})
