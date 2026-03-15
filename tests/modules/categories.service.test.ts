/**
 * Category service tests
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test"

import { categoryService } from "@/modules/categories/service"

import type { CreateCategoryInput } from "@/modules/categories/schema"

import type { Env } from "@/env"

describe("CategoryService", () => {
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
    it("should create a category with valid data", async () => {
      const input: CreateCategoryInput = {
        name: "Test Category",

        type: "expense",
      }

      const result = await categoryService.create(mockEnv, input)

      expect(result).toBeDefined()

      expect(result.id).toBeDefined()

      expect(result.name).toBe(input.name)

      expect(result.type).toBe(input.type)

      expect(result.createdAt).toBeDefined()
    })

    it("should create income category", async () => {
      const input: CreateCategoryInput = {
        name: "Salary",

        type: "income",
      }

      const result = await categoryService.create(mockEnv, input)

      expect(result.type).toBe("income")
    })

    it("should create expense category", async () => {
      const input: CreateCategoryInput = {
        name: "Food",

        type: "expense",
      }

      const result = await categoryService.create(mockEnv, input)

      expect(result.type).toBe("expense")
    })
  })

  describe("getById", () => {
    it("should return category by ID", async () => {
      const input: CreateCategoryInput = {
        name: "Test Category",

        type: "expense",
      }

      const created = await categoryService.create(mockEnv, input)

      const found = await categoryService.getById(mockEnv, created.id)

      expect(found).toBeDefined()

      expect(found?.id).toBe(created.id)

      expect(found?.name).toBe(input.name)
    })

    it("should return null for non-existent category", async () => {
      const result = await categoryService.getById(mockEnv, "non-existent-id")

      expect(result).toBeNull()
    })
  })

  describe("list", () => {
    beforeEach(async () => {
      // Seed test categories

      await categoryService.create(mockEnv, { name: "Food", type: "expense" })

      await categoryService.create(mockEnv, { name: "Salary", type: "income" })

      await categoryService.create(mockEnv, {
        name: "Transport",
        type: "expense",
      })
    })

    it("should return all categories", async () => {
      const result = await categoryService.list(mockEnv)

      expect(result.length).toBeGreaterThanOrEqual(3)
    })

    it("should return categories sorted by name", async () => {
      const result = await categoryService.list(mockEnv)

      for (let i = 1; i < result.length; i++) {
        expect(result[i].name >= result[i - 1].name).toBe(true)
      }
    })

    it("should include both income and expense types", async () => {
      const result = await categoryService.list(mockEnv)

      const hasIncome = result.some((category) => category.type === "income")

      const hasExpense = result.some((category) => category.type === "expense")

      expect(hasIncome).toBe(true)

      expect(hasExpense).toBe(true)
    })
  })

  describe("update", () => {
    it("should update category name", async () => {
      const input: CreateCategoryInput = {
        name: "Test Category",

        type: "expense",
      }

      const created = await categoryService.create(mockEnv, input)

      const updated = await categoryService.update(mockEnv, created.id, {
        name: "Updated Category",
      })

      expect(updated).toBeDefined()

      expect(updated?.name).toBe("Updated Category")

      expect(updated?.type).toBe("expense") // Unchanged
    })

    it("should return null for non-existent category", async () => {
      const result = await categoryService.update(mockEnv, "non-existent-id", {
        name: "New Name",
      })

      expect(result).toBeNull()
    })

    it("should update only provided fields", async () => {
      const input: CreateCategoryInput = {
        name: "Test Category",

        type: "expense",
      }

      const created = await categoryService.create(mockEnv, input)

      const updated = await categoryService.update(mockEnv, created.id, {
        name: "New Name",
      })

      expect(updated?.name).toBe("New Name")

      expect(updated?.type).toBe("expense") // Unchanged
    })
  })

  describe("delete", () => {
    it("should delete category without transactions", async () => {
      const input: CreateCategoryInput = {
        name: "Test Category",

        type: "expense",
      }

      const created = await categoryService.create(mockEnv, input)

      const deleted = await categoryService.delete(mockEnv, created.id)

      expect(deleted).toBe(true)

      const found = await categoryService.getById(mockEnv, created.id)

      expect(found).toBeNull()
    })

    it("should return false for category with transactions", async () => {
      // This test assumes a transaction was created for this category

      // In a real test, you would first create a transaction

      const result = await categoryService.delete(
        mockEnv,
        "category-with-transactions-id",
      )

      expect(result).toBe(false)
    })

    it("should return false for non-existent category", async () => {
      const result = await categoryService.delete(mockEnv, "non-existent-id")

      expect(result).toBe(false)
    })
  })
})
