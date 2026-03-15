/**
 * Transaction service tests
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test"

import { transactionService } from "@/modules/transactions/service"

import type {
  CreateTransactionInput,
  TransactionFilter,
} from "@/modules/transactions/schema"

import type { Env } from "@/env"

describe("TransactionService", () => {
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

  describe("create", () => {
    it("should create a transaction with valid data", async () => {
      const input: CreateTransactionInput = {
        categoryId: "test-category-id",

        amount: 25.99,

        description: "Test transaction",

        transactionDate: "2024-01-15",
      }

      const result = await transactionService.create(mockEnv, input)

      expect(result).toBeDefined()

      expect(result.id).toBeDefined()

      expect(result.categoryId).toBe(input.categoryId)

      expect(result.amountRupiah).toBe(26) // Rounded to nearest rupiah

      expect(result.description).toBe(input.description)

      expect(result.transactionDate).toBe(input.transactionDate)
    })

    it("should convert amount to rupiah correctly", async () => {
      const input: CreateTransactionInput = {
        categoryId: "test-category-id",

        amount: 100.5,

        description: "Test transaction",

        transactionDate: "2024-01-15",
      }

      const result = await transactionService.create(mockEnv, input)

      expect(result.amountRupiah).toBe(101) // Rounded
    })

    it("should handle edge case amounts", async () => {
      const input: CreateTransactionInput = {
        categoryId: "test-category-id",

        amount: 0.01,

        description: "Test transaction",

        transactionDate: "2024-01-15",
      }

      const result = await transactionService.create(mockEnv, input)

      expect(result.amountRupiah).toBe(0) // Rounded
    })
  })

  describe("getById", () => {
    it("should return transaction by ID", async () => {
      const input: CreateTransactionInput = {
        categoryId: "test-category-id",

        amount: 25.99,

        description: "Test transaction",

        transactionDate: "2024-01-15",
      }

      const created = await transactionService.create(mockEnv, input)

      const found = await transactionService.getById(mockEnv, created.id)

      expect(found).toBeDefined()

      expect(found?.id).toBe(created.id)
    })

    it("should return null for non-existent transaction", async () => {
      const result = await transactionService.getById(
        mockEnv,
        "non-existent-id",
      )

      expect(result).toBeNull()
    })
  })

  describe("list", () => {
    beforeEach(async () => {
      // Seed test transactions

      const baseInput: Omit<CreateTransactionInput, "transactionDate"> = {
        categoryId: "test-category-id",

        amount: 25.99,

        description: "Test transaction",
      }

      await transactionService.create(mockEnv, {
        ...baseInput,

        transactionDate: "2024-01-10",
      })

      await transactionService.create(mockEnv, {
        ...baseInput,

        transactionDate: "2024-01-15",
      })

      await transactionService.create(mockEnv, {
        ...baseInput,

        transactionDate: "2024-01-20",
      })
    })

    it("should return paginated transactions", async () => {
      const filter: TransactionFilter = {
        page: 1,

        limit: 2,
      }

      const result = await transactionService.list(mockEnv, filter)

      expect(result.data).toHaveLength(2)

      expect(result.total).toBeGreaterThanOrEqual(3)

      expect(result.data[0].transactionDate).toBe("2024-01-20")
    })

    it("should filter by date range", async () => {
      const filter: TransactionFilter = {
        page: 1,

        limit: 10,

        startDate: "2024-01-12",

        endDate: "2024-01-18",
      }

      const result = await transactionService.list(mockEnv, filter)

      expect(result.data).toHaveLength(1)

      expect(result.data[0].transactionDate).toBe("2024-01-15")
    })

    it("should filter by category ID", async () => {
      const filter: TransactionFilter = {
        page: 1,

        limit: 10,

        categoryId: "test-category-id",
      }

      const result = await transactionService.list(mockEnv, filter)

      expect(result.data.length).toBeGreaterThan(0)

      result.data.forEach((transaction) => {
        expect(transaction.categoryId).toBe("test-category-id")
      })
    })

    it("should calculate total pages correctly", async () => {
      const filter: TransactionFilter = {
        page: 1,

        limit: 2,
      }

      const result = await transactionService.list(mockEnv, filter)

      const expectedTotalPages = Math.ceil(result.total / filter.limit)

      expect(expectedTotalPages).toBeGreaterThanOrEqual(2)
    })
  })

  describe("update", () => {
    it("should update transaction fields", async () => {
      const input: CreateTransactionInput = {
        categoryId: "test-category-id",

        amount: 25.99,

        description: "Test transaction",

        transactionDate: "2024-01-15",
      }

      const created = await transactionService.create(mockEnv, input)

      const updated = await transactionService.update(mockEnv, created.id, {
        amount: 30.5,

        description: "Updated description",
      })

      expect(updated).toBeDefined()

      expect(updated?.amountRupiah).toBe(31) // Rounded

      expect(updated?.description).toBe("Updated description")

      expect(updated?.transactionDate).toBe("2024-01-15") // Unchanged
    })

    it("should return null for non-existent transaction", async () => {
      const result = await transactionService.update(
        mockEnv,
        "non-existent-id",
        {
          amount: 30.5,
        },
      )

      expect(result).toBeNull()
    })

    it("should update only provided fields", async () => {
      const input: CreateTransactionInput = {
        categoryId: "test-category-id",

        amount: 25.99,

        description: "Test transaction",

        transactionDate: "2024-01-15",
      }

      const created = await transactionService.create(mockEnv, input)

      const updated = await transactionService.update(mockEnv, created.id, {
        description: "New description",
      })

      expect(updated?.description).toBe("New description")

      expect(updated?.amountRupiah).toBe(26) // Unchanged (rounded from 25.99)
    })
  })

  describe("delete", () => {
    it("should delete transaction", async () => {
      const input: CreateTransactionInput = {
        categoryId: "test-category-id",

        amount: 25.99,

        description: "Test transaction",

        transactionDate: "2024-01-15",
      }

      const created = await transactionService.create(mockEnv, input)

      const deleted = await transactionService.delete(mockEnv, created.id)

      expect(deleted).toBe(true)

      const found = await transactionService.getById(mockEnv, created.id)

      expect(found).toBeNull()
    })

    it("should return false for non-existent transaction", async () => {
      const result = await transactionService.delete(mockEnv, "non-existent-id")

      expect(result).toBe(false)
    })
  })
})
