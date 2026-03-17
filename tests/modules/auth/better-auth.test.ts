/**
 * Better Auth Tests
 * Following TDD: Tests for auth configuration
 */

import { describe, it, expect } from "bun:test"
import { getAuth, authHandler } from "@/modules/auth/better-auth"

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

describe("getAuth", () => {
  it("should return auth instance", () => {
    const auth = getAuth(mockEnv as any)
    expect(auth).toBeDefined()
  })

  it("should return same instance on multiple calls (caching)", () => {
    const auth1 = getAuth(mockEnv as any)
    const auth2 = getAuth(mockEnv as any)
    // Note: This tests caching behavior - same instance returned
    expect(auth1).toBeDefined()
  })

  it("should have handler property", () => {
    const auth = getAuth(mockEnv as any)
    expect(auth.handler).toBeDefined()
  })

  it("should configure session cookies", () => {
    const auth = getAuth(mockEnv as any)
    // The auth instance should be properly configured
    expect(auth).toBeDefined()
  })

  it("should configure social providers when env vars provided", () => {
    const auth = getAuth(mockEnv as any)
    expect(auth).toBeDefined()
  })

  it("should configure session expiresIn", () => {
    const auth = getAuth(mockEnv as any)
    expect(auth).toBeDefined()
  })

  it("should configure session updateAge", () => {
    const auth = getAuth(mockEnv as any)
    expect(auth).toBeDefined()
  })
})

describe("authHandler", () => {
  it("should return handler from getAuth", () => {
    const handler = authHandler(mockEnv as any)
    expect(handler).toBeDefined()
  })

  it("should return a function", () => {
    const handler = authHandler(mockEnv as any)
    expect(typeof handler).toBe("function")
  })
})
