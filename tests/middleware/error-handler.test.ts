/**
 * Error Handler Middleware Tests
 * Following TDD: Tests written first, then implementation
 */

import { describe, it, expect } from "bun:test"
import { errorHandler } from "@/middleware/error-handler"

describe("errorHandler middleware", () => {
  // Helper to create mock Hono context
  const createMockContext = (error: Error | unknown) => {
    return {
      json: (data: unknown, status?: number) => {
        return new Response(JSON.stringify(data), {
          status: status || 200,
          headers: { "Content-Type": "application/json" },
        })
      },
      error,
    } as any
  }

  // Helper to get response body
  async function getResponseBody(response: Response) {
    return JSON.parse(await response.text())
  }

  describe("Zod validation errors", () => {
    it("should return 400 with VALIDATION_ERROR when ZodError is thrown", async () => {
      // Arrange - Create a mock ZodError-like object
      const zodError = {
        name: "ZodError",
        issues: [
          { path: ["email"], message: "Invalid email format" },
          { path: ["amount"], message: "Must be positive" },
        ],
      }
      const c = createMockContext(zodError)

      // Act
      const response = await errorHandler(zodError as any, c)

      // Assert
      expect(response.status).toBe(400)
      const body = await getResponseBody(response)
      expect(body).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: [
            { path: "email", message: "Invalid email format" },
            { path: "amount", message: "Must be positive" },
          ],
        },
      })
    })

    it("should return 400 with single validation error detail", async () => {
      const zodError = {
        name: "ZodError",
        issues: [{ path: ["name"], message: "Required field" }],
      }
      const c = createMockContext(zodError)

      const response = await errorHandler(zodError as any, c)

      expect(response.status).toBe(400)
      const body = await getResponseBody(response)
      expect(body.error.details).toHaveLength(1)
      expect(body.error.details[0].path).toBe("name")
    })
  })

  describe("Database constraint errors", () => {
    it("should return 409 CONFLICT when unique constraint error", async () => {
      const err = new Error("unique constraint failed with index users_email")
      const c = createMockContext(err)

      const response = await errorHandler(err, c)

      expect(response.status).toBe(409)
      const body = await getResponseBody(response)
      expect(body).toEqual({
        success: false,
        error: {
          code: "CONFLICT",
          message: "Resource already exists",
        },
      })
    })

    it("should return 400 VALIDATION_ERROR when foreign key constraint error", async () => {
      const err = new Error("foreign key constraint - referenced id does not exist")
      const c = createMockContext(err)

      const response = await errorHandler(err, c)

      expect(response.status).toBe(400)
      const body = await getResponseBody(response)
      expect(body).toEqual({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Referenced resource does not exist",
        },
      })
    })

    it("should return 500 for other constraint errors", async () => {
      const err = new Error("some constraint error")
      const c = createMockContext(err)

      const response = await errorHandler(err, c)

      // Other constraint errors fall through to default 500
      expect(response.status).toBe(500)
    })
  })

  describe("Default error handling", () => {
    it("should return 500 INTERNAL_ERROR for unknown errors", async () => {
      const err = new Error("Something unexpected went wrong")
      const c = createMockContext(err)

      const response = await errorHandler(err, c)

      expect(response.status).toBe(500)
      const body = await getResponseBody(response)
      expect(body).toEqual({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      })
    })

    it("should handle non-Error objects gracefully", async () => {
      const err = "String error"
      const c = createMockContext(err)

      const response = await errorHandler(err as any, c)

      expect(response.status).toBe(500)
      const body = await getResponseBody(response)
      expect(body.success).toBe(false)
    })

    it("should handle null error", async () => {
      const err = null
      const c = createMockContext(err)

      const response = await errorHandler(err as any, c)

      expect(response.status).toBe(500)
    })

    it("should handle objects without message property", async () => {
      const err = { code: "SOME_CODE", status: 503 }
      const c = createMockContext(err)

      const response = await errorHandler(err as any, c)

      expect(response.status).toBe(500)
    })
  })
})
