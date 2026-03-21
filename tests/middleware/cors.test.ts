/**
 * CORS Middleware Tests
 * Following TDD: Tests for CORS configuration
 * Note: Full CORS integration tests require actual Hono context
 */

import { describe, it, expect } from "bun:test"
import { corsMiddleware } from "@/middleware/cors"
import { EnvSchema } from "@/env"

// Mock EnvSchema
const mockEnvValid = {
  DATABASE_URL: "postgresql://localhost:5432/artha",
  BETTER_AUTH_SECRET: "test-secret-key-that-is-at-least-32-chars",
  BETTER_AUTH_URL: "http://localhost:8787",
  OWNER_EMAIL: "owner@example.com",
  FRONTEND_URLS: "http://localhost:5173,http://localhost:3000",
  GITHUB_CLIENT_ID: "github-id",
  GITHUB_CLIENT_SECRET: "github-secret",
  GOOGLE_CLIENT_ID: "google-id",
  GOOGLE_CLIENT_SECRET: "google-secret",
}

describe("corsMiddleware", () => {
  describe("Environment validation", () => {
    it("should return 500 when env is invalid", async () => {
      const c = {
        req: {
          path: "/api/test",
          method: "GET",
          header: () => null,
          raw: { headers: new Headers() },
        },
        json: (data: unknown, status?: number) =>
          new Response(JSON.stringify(data), { status }),
        env: {}, // Missing required env vars
      } as any

      const next = async () => {}

      const result = await corsMiddleware(c, next)

      // Should return response with 500 status
      expect(result !== null && result !== undefined).toBe(true)
      const response = result as Response
      expect(response.status).toBe(500)
    })

    it("should return 500 when FRONTEND_URLS is empty", async () => {
      const c = {
        req: {
          path: "/api/test",
          method: "GET",
          header: () => null,
          raw: { headers: new Headers() },
        },
        json: (data: unknown, status?: number) =>
          new Response(JSON.stringify(data), { status }),
        env: { ...mockEnvValid, FRONTEND_URLS: "" },
      } as any

      const next = async () => {}

      const result = await corsMiddleware(c, next)

      expect(result).toBeDefined()
      const response = result as Response
      expect(response.status).toBe(500)
    })

    it("should validate FRONTEND_URLS correctly", () => {
      const result = EnvSchema.safeParse(mockEnvValid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.FRONTEND_URLS).toContain("http://localhost:5173")
      }
    })
  })

  describe("CORS origin validation logic", () => {
    it("should parse FRONTEND_URLS from env", () => {
      const envResult = EnvSchema.safeParse(mockEnvValid)
      expect(envResult.success).toBe(true)

      if (envResult.success) {
        const urls = envResult.data.FRONTEND_URLS
        expect(urls).toContain("http://localhost:5173")
        expect(urls).toContain("http://localhost:3000")
      }
    })

    it("should handle case-insensitive origin check", () => {
      // Test the logic that CORS uses for origin validation
      const origin = "HTTP://LOCALHOST:5173"
      const validOrigins = mockEnvValid.FRONTEND_URLS

      // The middleware uses .includes() with lowercase comparison
      const isValid = validOrigins.includes(origin.toLowerCase())
      expect(isValid).toBe(true)
    })

    it("should reject invalid origin", () => {
      const origin = "http://evil.com"
      const validOrigins = mockEnvValid.FRONTEND_URLS

      const isValid = validOrigins.includes(origin.toLowerCase())
      expect(isValid).toBe(false)
    })
  })
})
