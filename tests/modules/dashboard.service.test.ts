/**
 * Dashboard service tests
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test"

import { dashboardService } from "@/modules/dashboard/service"

import type { DashboardFilter } from "@/modules/dashboard/schema"

import type { Env } from "@/env"

describe("DashboardService", () => {
  // Mock environment for testing
  const mockEnv: Env = {
    DATABASE_URL:
      process.env.DATABASE_URL ||
      "postgresql://test:test@localhost:5432/artha_test",
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET || "test-secret-key-min-32-characters",
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000/api",
    OWNER_EMAIL: process.env.OWNER_EMAIL || "test-owner@example.com",
    FRONTEND_URLS: ["http://localhost:3000"],
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "test-github-client-id",
    GITHUB_CLIENT_SECRET:
      process.env.GITHUB_CLIENT_SECRET || "test-github-client-secret",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "test-google-client-id",
    GOOGLE_CLIENT_SECRET:
      process.env.GOOGLE_CLIENT_SECRET || "test-google-client-secret",
  }

  beforeEach(() => {
    // Setup if needed
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

      const result = await dashboardService.getSummary(mockEnv, filter)

      expect(result).toBeDefined()

      expect(result.year).toBe(2024)

      expect(result.month).toBe(1)

      expect(typeof result.incomeRupiah).toBe("number")

      expect(typeof result.expenseRupiah).toBe("number")

      expect(typeof result.balanceRupiah).toBe("number")
    })

    it("should return yearly summary when month is omitted", async () => {
      const filter: DashboardFilter = {
        year: 2024,
      }

      const result = await dashboardService.getSummary(mockEnv, filter)

      expect(result).toBeDefined()

      expect(result.year).toBe(2024)

      expect(result.month).toBeUndefined()
    })

    it("should calculate balance correctly", async () => {
      const filter: DashboardFilter = {
        year: 2024,

        month: 1,
      }

      const result = await dashboardService.getSummary(mockEnv, filter)

      expect(result.balanceRupiah).toBe(
        result.incomeRupiah - result.expenseRupiah,
      )
    })

    it("should handle zero transactions", async () => {
      const filter: DashboardFilter = {
        year: 2025,

        month: 1,
      }

      const result = await dashboardService.getSummary(mockEnv, filter)

      expect(result.incomeRupiah).toBe(0)

      expect(result.expenseRupiah).toBe(0)

      expect(result.balanceRupiah).toBe(0)
    })
  })

  describe("getByCategory", () => {
    it("should return category breakdown", async () => {
      const filter: DashboardFilter = {
        year: 2024,

        month: 1,
      }

      const result = await dashboardService.getByCategory(mockEnv, filter)

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

      const result = await dashboardService.getByCategory(mockEnv, filter)

      expect(result).toBeDefined()

      expect(result.year).toBe(2024)

      expect(result.month).toBeUndefined()
    })

    it("should return category aggregation with correct structure", async () => {
      const filter: DashboardFilter = {
        year: 2024,

        month: 1,
      }

      const result = await dashboardService.getByCategory(mockEnv, filter)

      if (result.income.length > 0) {
        const incomeItem = result.income[0]

        expect(incomeItem).toHaveProperty("categoryId")

        expect(incomeItem).toHaveProperty("categoryName")

        expect(incomeItem).toHaveProperty("type")

        expect(incomeItem).toHaveProperty("totalRupiah")

        expect(incomeItem).toHaveProperty("transactionCount")

        expect(incomeItem.type).toBe("income")
      }

      if (result.expense.length > 0) {
        const expenseItem = result.expense[0]

        expect(expenseItem).toHaveProperty("categoryId")

        expect(expenseItem).toHaveProperty("categoryName")

        expect(expenseItem).toHaveProperty("type")

        expect(expenseItem).toHaveProperty("totalRupiah")

        expect(expenseItem).toHaveProperty("transactionCount")

        expect(expenseItem.type).toBe("expense")
      }
    })

    it("should sort categories by totalRupiah descending", async () => {
      const filter: DashboardFilter = {
        year: 2024,

        month: 1,
      }

      const result = await dashboardService.getByCategory(mockEnv, filter)

      const checkSorted = (items: typeof result.income) => {
        for (let i = 1; i < items.length; i++) {
          expect(items[i].totalRupiah <= items[i - 1].totalRupiah).toBe(true)
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

      const result = await dashboardService.getByCategory(mockEnv, filter)

      expect(result.income).toHaveLength(0)

      expect(result.expense).toHaveLength(0)
    })
  })
})
