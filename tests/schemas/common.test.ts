/**
 * Common Schema Tests
 * Following TDD: Tests for common Zod schemas
 */

import { describe, it, expect } from "bun:test"
import { z } from "zod"
import {
  errorCodeSchema,
  paginationMetaSchema,
  createSuccessResponseSchema,
  errorResponseSchema,
} from "@/schemas/common"

describe("errorCodeSchema", () => {
  it("should accept VALIDATION_ERROR", () => {
    const result = errorCodeSchema.safeParse("VALIDATION_ERROR")
    expect(result.success).toBe(true)
  })

  it("should accept UNAUTHORIZED", () => {
    const result = errorCodeSchema.safeParse("UNAUTHORIZED")
    expect(result.success).toBe(true)
  })

  it("should accept FORBIDDEN", () => {
    const result = errorCodeSchema.safeParse("FORBIDDEN")
    expect(result.success).toBe(true)
  })

  it("should accept NOT_FOUND", () => {
    const result = errorCodeSchema.safeParse("NOT_FOUND")
    expect(result.success).toBe(true)
  })

  it("should accept CONFLICT", () => {
    const result = errorCodeSchema.safeParse("CONFLICT")
    expect(result.success).toBe(true)
  })

  it("should accept RATE_LIMITED", () => {
    const result = errorCodeSchema.safeParse("RATE_LIMITED")
    expect(result.success).toBe(true)
  })

  it("should accept INTERNAL_ERROR", () => {
    const result = errorCodeSchema.safeParse("INTERNAL_ERROR")
    expect(result.success).toBe(true)
  })

  it("should reject invalid error codes", () => {
    const result = errorCodeSchema.safeParse("INVALID_CODE")
    expect(result.success).toBe(false)
  })

  it("should reject random strings", () => {
    const result = errorCodeSchema.safeParse("random")
    expect(result.success).toBe(false)
  })

  it("should reject empty string", () => {
    const result = errorCodeSchema.safeParse("")
    expect(result.success).toBe(false)
  })
})

describe("paginationMetaSchema", () => {
  it("should validate correct pagination meta", () => {
    const input = {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
    }
    const result = paginationMetaSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(input)
    }
  })

  it("should reject page <= 0", () => {
    const input = { page: 0, limit: 20, total: 100, totalPages: 5 }
    const result = paginationMetaSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject negative page", () => {
    const input = { page: -1, limit: 20, total: 100, totalPages: 5 }
    const result = paginationMetaSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject page as decimal", () => {
    const input = { page: 1.5, limit: 20, total: 100, totalPages: 5 }
    const result = paginationMetaSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject limit <= 0", () => {
    const input = { page: 1, limit: 0, total: 100, totalPages: 5 }
    const result = paginationMetaSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject negative total", () => {
    const input = { page: 1, limit: 20, total: -1, totalPages: 5 }
    const result = paginationMetaSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject non-integer values", () => {
    const input = { page: 1, limit: 20.5, total: 100, totalPages: 5 }
    const result = paginationMetaSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing fields", () => {
    const input = { page: 1, limit: 20 }
    const result = paginationMetaSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject empty object", () => {
    const result = paginationMetaSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("should accept all maximum values", () => {
    const input = {
      page: 999999999,
      limit: 999999999,
      total: 999999999,
      totalPages: 999999999,
    }
    const result = paginationMetaSchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})

describe("createSuccessResponseSchema", () => {
  it("should create schema with data and success: true", () => {
    const dataSchema = z.object({ id: z.string() })
    const responseSchema = createSuccessResponseSchema(dataSchema)

    const result = responseSchema.safeParse({
      success: true,
      data: { id: "123" },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.success).toBe(true)
      expect(result.data.data).toEqual({ id: "123" })
    }
  })

  it("should accept optional meta field", () => {
    const dataSchema = z.object({ id: z.string() })
    const responseSchema = createSuccessResponseSchema(dataSchema)

    const result = responseSchema.safeParse({
      success: true,
      data: { id: "123" },
      meta: { page: 1, limit: 20, total: 100, totalPages: 5 },
    })

    expect(result.success).toBe(true)
  })

  it("should reject success: false", () => {
    const dataSchema = z.object({ id: z.string() })
    const responseSchema = createSuccessResponseSchema(dataSchema)

    const result = responseSchema.safeParse({
      success: false,
      data: { id: "123" },
    })

    expect(result.success).toBe(false)
  })

  it("should validate data against schema", () => {
    const dataSchema = z.object({ id: z.string() })
    const responseSchema = createSuccessResponseSchema(dataSchema)

    const result = responseSchema.safeParse({
      success: true,
      data: { id: 123 }, // Should be string
    })

    expect(result.success).toBe(false)
  })
})

describe("errorResponseSchema", () => {
  it("should validate correct error response", () => {
    const input = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
      },
    }

    const result = errorResponseSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should accept error with details", () => {
    const input = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: [{ field: "email", message: "Invalid" }],
      },
    }

    const result = errorResponseSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should reject success: true", () => {
    const input = {
      success: true,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
      },
    }

    const result = errorResponseSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject invalid error code", () => {
    const input = {
      success: false,
      error: {
        code: "INVALID_CODE",
        message: "Error",
      },
    }

    const result = errorResponseSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing error code", () => {
    const input = {
      success: false,
      error: {
        message: "Error",
      },
    }

    const result = errorResponseSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject missing message", () => {
    const input = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
      },
    }

    const result = errorResponseSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it("should reject empty message", () => {
    const input = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "",
      },
    }

    const result = errorResponseSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
