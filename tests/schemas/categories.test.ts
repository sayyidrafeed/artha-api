/**
 * Categories Schema Tests
 * Following TDD: Tests for category-related Zod schemas
 */

import { describe, it, expect } from "bun:test"
import {
  createCategorySchema,
  updateCategorySchema,
  categorySchema,
} from "@/modules/categories/schema"

describe("createCategorySchema", () => {
  const validInput = {
    name: "Salary",
    type: "income" as const,
  }

  it("should validate correct input", () => {
    const result = createCategorySchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("should accept expense type", () => {
    const input = { name: "Food", type: "expense" }
    const result = createCategorySchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should reject empty name", () => {
    const input = { name: "", type: "income" }
    const result = createCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject name exceeding max length", () => {
    const input = { name: "a".repeat(101), type: "income" }
    const result = createCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject invalid type", () => {
    const input = { name: "Test", type: "invalid" }
    const result = createCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing name", () => {
    const input = { type: "income" }
    const result = createCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing type", () => {
    const input = { name: "Test" }
    const result = createCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should accept max length name (100 chars)", () => {
    const input = { name: "a".repeat(100), type: "income" }
    const result = createCategorySchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})

describe("updateCategorySchema", () => {
  it("should accept empty object (all fields optional)", () => {
    const result = updateCategorySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("should accept partial update with only name", () => {
    const input = { name: "Updated Name" }
    const result = updateCategorySchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept partial update with only type", () => {
    const input = { type: "expense" }
    const result = updateCategorySchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept full update", () => {
    const input = { name: "Updated", type: "income" }
    const result = updateCategorySchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should validate name constraint in partial update", () => {
    const input = { name: "" }
    const result = updateCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should validate type constraint in partial update", () => {
    const input = { type: "invalid" }
    const result = updateCategorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe("categorySchema", () => {
  const validCategory = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Salary",
    type: "income" as const,
    createdAt: new Date(),
  }

  it("should validate correct category", () => {
    const result = categorySchema.safeParse(validCategory)
    expect(result.success).toBe(true)
  })

  it("should accept expense type", () => {
    const input = { ...validCategory, type: "expense" as const }
    const result = categorySchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should reject invalid UUID for id", () => {
    const input = { ...validCategory, id: "not-uuid" }
    const result = categorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject invalid type", () => {
    const input = { ...validCategory, type: "invalid" }
    const result = categorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject non-date createdAt", () => {
    const input = { ...validCategory, createdAt: "2024-01-15" }
    const result = categorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing id", () => {
    const input = { name: "Test", type: "income", createdAt: new Date() }
    const result = categorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing name", () => {
    const input = { id: validCategory.id, type: "income", createdAt: new Date() }
    const result = categorySchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
