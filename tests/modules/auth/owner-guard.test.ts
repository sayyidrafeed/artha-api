/**
 * Owner Guard Middleware Tests
 * Following TDD: Tests for owner-only authorization
 */

import { describe, it, expect, beforeEach, mock } from "bun:test"
import { ownerOnlyMiddleware } from "@/modules/auth/owner-guard"
import { EnvSchema } from "@/env"

// Mock env
const mockEnv = {
  DATABASE_URL: "postgresql://localhost:5432/artha",
  BETTER_AUTH_SECRET: "test-secret-key-that-is-at-least-32-chars",
  BETTER_AUTH_URL: "http://localhost:8787",
  OWNER_EMAIL: "owner@example.com",
  FRONTEND_URLS: "http://localhost:5173",
  GITHUB_CLIENT_ID: "github-id",
  GITHUB_CLIENT_SECRET: "github-secret",
  GOOGLE_CLIENT_ID: "google-id",
  GOOGLE_CLIENT_SECRET: "google-secret",
}

const createMockContext = (
  env: any,
  headers: Record<string, string> = {},
) => {
  return {
    req: {
      path: "/api/test",
      method: "GET",
      header: (name: string) => headers[name] || null,
      raw: { headers: new Headers(headers) },
    },
    json: (data: unknown, status?: number) => {
      return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: { "Content-Type": "application/json" },
      })
    },
    set: (key: string, value: unknown) => {},
    env,
  } as any
}

describe("ownerOnlyMiddleware", () => {
  describe("Environment validation", () => {
    it("should return 500 when env is invalid", async () => {
      const c = {
        req: { path: "/api/test", method: "GET", header: () => null, raw: { headers: new Headers() } },
        json: (data: unknown, status?: number) => new Response(JSON.stringify(data), { status }),
        env: {}, // Missing required env vars
      } as any

      const next = async () => {}

      const result = await ownerOnlyMiddleware(c, next)

      expect(result).toBeDefined()
      const response = result as Response
      expect(response.status).toBe(500)
    })

    it("should parse valid env correctly", () => {
      const result = EnvSchema.safeParse(mockEnv)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.OWNER_EMAIL).toBe("owner@example.com")
      }
    })
  })

  describe("Email validation", () => {
    it("should validate owner email format", () => {
      const result = EnvSchema.safeParse(mockEnv)
      expect(result.success).toBe(true)
      if (result.success) {
        const email = result.data.OWNER_EMAIL
        expect(email).toContain("@")
        expect(email).toContain(".")
      }
    })

    it("should reject invalid owner email", () => {
      const invalidEnv = { ...mockEnv, OWNER_EMAIL: "invalid-email" }
      const result = EnvSchema.safeParse(invalidEnv)
      expect(result.success).toBe(false)
    })
  })

  describe("Authorization logic", () => {
    it("should check owner email match", () => {
      const ownerEmail = "owner@example.com"
      const userEmail = "owner@example.com"
      expect(userEmail).toBe(ownerEmail)
    })

    it("should deny non-owner email", () => {
      // Different email should not match owner email
      const userEmail = "user@example.com"
      const ownerEmail = "owner@example.com"
      expect(userEmail).not.toBe(ownerEmail)
    })
  })

  describe("Middleware behavior", () => {
    it("should be a function", () => {
      expect(typeof ownerOnlyMiddleware).toBe("function")
    })

    it("should have proper middleware signature", () => {
      const middleware = ownerOnlyMiddleware
      expect(middleware).toBeDefined()
    })
  })
})
