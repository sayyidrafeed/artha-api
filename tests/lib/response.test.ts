/**
 * Response Utility Tests
 * Following TDD: Tests for success/error response helpers
 */

import { describe, it, expect } from "bun:test"
import { success, error } from "@/lib/response"

// Mock Hono context
const createMockContext = () => {
  let responseData: unknown = null
  let responseStatus = 200

  return {
    json: (data: unknown, status?: number) => {
      responseData = data
      responseStatus = status || 200
      return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: { "Content-Type": "application/json" },
      })
    },
    getResponseData: () => responseData,
    getResponseStatus: () => responseStatus,
  }
}

describe("success", () => {
  it("should return successful response with data", () => {
    const c: any = createMockContext()

    const result = success(c, { id: "123", name: "Test" })

    expect(result).toBeInstanceOf(Response)
    expect(c.getResponseStatus()).toBe(200)

    const body = c.getResponseData() as any
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ id: "123", name: "Test" })
  })

  it("should return successful response without meta when not provided", () => {
    const c: any = createMockContext()

    success(c, { id: "123" })

    const body = c.getResponseData() as any
    expect(body.success).toBe(true)
    expect(body.meta).toBeUndefined()
  })

  it("should include pagination meta when provided", () => {
    const c: any = createMockContext()

    const meta = { page: 1, limit: 20, total: 100, totalPages: 5 }
    success(c, [{ id: "1" }], meta)

    const body = c.getResponseData() as any
    expect(body.success).toBe(true)
    expect(body.meta).toEqual(meta)
  })

  it("should handle empty data object", () => {
    const c: any = createMockContext()

    success(c, {})

    const body = c.getResponseData() as any
    expect(body.success).toBe(true)
    expect(body.data).toEqual({})
  })

  it("should handle array data", () => {
    const c: any = createMockContext()

    const items = [{ id: "1" }, { id: "2" }, { id: "3" }]
    success(c, items)

    const body = c.getResponseData() as any
    expect(body.success).toBe(true)
    expect(body.data).toEqual(items)
    expect(body.data).toHaveLength(3)
  })
})

describe("error", () => {
  it("should return 500 error by default", () => {
    const c: any = createMockContext()

    error(c, "INTERNAL_ERROR", "Something went wrong")

    expect(c.getResponseStatus()).toBe(500)

    const body = c.getResponseData() as any
    expect(body.success).toBe(false)
    expect(body.error.code).toBe("INTERNAL_ERROR")
    expect(body.error.message).toBe("Something went wrong")
  })

  it("should return 400 error for VALIDATION_ERROR", () => {
    const c: any = createMockContext()

    error(c, "VALIDATION_ERROR", "Invalid input", 400)

    expect(c.getResponseStatus()).toBe(400)

    const body = c.getResponseData() as any
    expect(body.error.code).toBe("VALIDATION_ERROR")
  })

  it("should return 401 error for UNAUTHORIZED", () => {
    const c: any = createMockContext()

    error(c, "UNAUTHORIZED", "Please login", 401)

    expect(c.getResponseStatus()).toBe(401)

    const body = c.getResponseData() as any
    expect(body.error.code).toBe("UNAUTHORIZED")
  })

  it("should return 403 error for FORBIDDEN", () => {
    const c: any = createMockContext()

    error(c, "FORBIDDEN", "Access denied", 403)

    expect(c.getResponseStatus()).toBe(403)

    const body = c.getResponseData() as any
    expect(body.error.code).toBe("FORBIDDEN")
  })

  it("should return 404 error for NOT_FOUND", () => {
    const c: any = createMockContext()

    error(c, "NOT_FOUND", "Resource not found", 404)

    expect(c.getResponseStatus()).toBe(404)

    const body = c.getResponseData() as any
    expect(body.error.code).toBe("NOT_FOUND")
  })

  it("should return 409 error for CONFLICT", () => {
    const c: any = createMockContext()

    error(c, "CONFLICT", "Resource already exists", 409)

    expect(c.getResponseStatus()).toBe(409)

    const body = c.getResponseData() as any
    expect(body.error.code).toBe("CONFLICT")
  })

  it("should return 429 error for RATE_LIMITED", () => {
    const c: any = createMockContext()

    error(c, "RATE_LIMITED", "Too many requests", 429)

    expect(c.getResponseStatus()).toBe(429)

    const body = c.getResponseData() as any
    expect(body.error.code).toBe("RATE_LIMITED")
  })

  it("should include details when provided", () => {
    const c: any = createMockContext()

    const details = [{ field: "email", message: "Invalid format" }]
    error(c, "VALIDATION_ERROR", "Validation failed", 400, details)

    const body = c.getResponseData() as any
    expect(body.error.details).toEqual(details)
  })

  it("should not include details when not provided", () => {
    const c: any = createMockContext()

    error(c, "INTERNAL_ERROR", "Error")

    const body = c.getResponseData() as any
    expect("details" in body.error).toBe(false)
  })

  it("should handle undefined details", () => {
    const c: any = createMockContext()

    error(c, "INTERNAL_ERROR", "Error", 500, undefined)

    const body = c.getResponseData() as any
    expect("details" in body.error).toBe(false)
  })
})
