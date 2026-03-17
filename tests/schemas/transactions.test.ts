/**
 * Transactions Schema Tests
 * Following TDD: Tests for transaction-related Zod schemas
 */

import { describe, it, expect } from "bun:test"
import {
  transactionTypeSchema,
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
  transactionSchema,
} from "@/modules/transactions/schema"

describe("transactionTypeSchema", () => {
  it("should accept 'income'", () => {
    const result = transactionTypeSchema.safeParse("income")
    expect(result.success).toBe(true)
  })

  it("should accept 'expense'", () => {
    const result = transactionTypeSchema.safeParse("expense")
    expect(result.success).toBe(true)
  })

  it("should reject invalid types", () => {
    const result = transactionTypeSchema.safeParse("invalid")
    expect(result.success).toBe(false)
  })

  it("should reject empty string", () => {
    const result = transactionTypeSchema.safeParse("")
    expect(result.success).toBe(false)
  })
})

describe("createTransactionSchema", () => {
  const validInput = {
    categoryId: "123e4567-e89b-12d3-a456-426614174000",
    amount: 150000,
    description: "Test transaction",
    transactionDate: "2024-01-15",
  }

  it("should validate correct input", () => {
    const result = createTransactionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("should reject invalid UUID for categoryId", () => {
    const input = { ...validInput, categoryId: "not-a-uuid" }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject negative amount", () => {
    const input = { ...validInput, amount: -100 }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject zero amount", () => {
    const input = { ...validInput, amount: 0 }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject amount exceeding max", () => {
    const input = { ...validInput, amount: 1000000000 }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject empty description", () => {
    const input = { ...validInput, description: "" }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject description exceeding max length", () => {
    const input = { ...validInput, description: "a".repeat(501) }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject invalid date format", () => {
    const input = { ...validInput, transactionDate: "15-01-2024" }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject non-date string", () => {
    const input = { ...validInput, transactionDate: "not-a-date" }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing required fields", () => {
    const result = createTransactionSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("should accept decimal amounts", () => {
    const input = { ...validInput, amount: 150000.5 }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept maximum valid amount", () => {
    const input = { ...validInput, amount: 999999999.99 }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept valid description length", () => {
    const input = { ...validInput, description: "a".repeat(500) }
    const result = createTransactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})

describe("updateTransactionSchema", () => {
  it("should accept empty object (all fields optional)", () => {
    const result = updateTransactionSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("should accept partial update with only amount", () => {
    const input = { amount: 100000 }
    const result = updateTransactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept partial update with only description", () => {
    const input = { description: "Updated description" }
    const result = updateTransactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept partial update with only transactionDate", () => {
    const input = { transactionDate: "2024-02-01" }
    const result = updateTransactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept partial update with only categoryId", () => {
    const input = { categoryId: "123e4567-e89b-12d3-a456-426614174000" }
    const result = updateTransactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should validate field constraints in partial update", () => {
    const input = { amount: -100 }
    const result = updateTransactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe("transactionFilterSchema", () => {
  it("should accept default values", () => {
    const result = transactionFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it("should parse string numbers", () => {
    const input = { page: "2", limit: "50" }
    const result = transactionFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.limit).toBe(50)
    }
  })

  it("should validate page > 0", () => {
    const input = { page: 0 }
    const result = transactionFilterSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should validate limit <= 100", () => {
    const input = { limit: 101 }
    const result = transactionFilterSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should accept optional date filters", () => {
    const input = { startDate: "2024-01-01", endDate: "2024-12-31" }
    const result = transactionFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should reject invalid startDate format", () => {
    const input = { startDate: "01-01-2024" }
    const result = transactionFilterSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should accept optional categoryId", () => {
    const input = { categoryId: "123e4567-e89b-12d3-a456-426614174000" }
    const result = transactionFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept optional type filter", () => {
    const input = { type: "income" }
    const result = transactionFilterSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should reject invalid type", () => {
    const input = { type: "invalid" }
    const result = transactionFilterSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject invalid categoryId format", () => {
    const input = { categoryId: "not-uuid" }
    const result = transactionFilterSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe("transactionSchema", () => {
  const validTransaction = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    categoryId: "123e4567-e89b-12d3-a456-426614174001",
    categoryName: "Salary",
    categoryType: "income",
    amountRupiah: 5000000,
    description: "Monthly salary",
    transactionDate: "2024-01-15",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it("should validate correct transaction", () => {
    const result = transactionSchema.safeParse(validTransaction)
    expect(result.success).toBe(true)
  })

  it("should accept nullable categoryName", () => {
    const input = { ...validTransaction, categoryName: null }
    const result = transactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept nullable categoryType", () => {
    const input = { ...validTransaction, categoryType: null }
    const result = transactionSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should reject negative amountRupiah", () => {
    const input = { ...validTransaction, amountRupiah: -100 }
    const result = transactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject non-integer amountRupiah", () => {
    const input = { ...validTransaction, amountRupiah: 100.5 }
    const result = transactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject non-date createdAt", () => {
    const input = { ...validTransaction, createdAt: "2024-01-15" }
    const result = transactionSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
