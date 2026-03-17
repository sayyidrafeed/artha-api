/**
 * Factory Tests
 * Following TDD: Tests for app factory
 */

import { describe, it, expect } from "bun:test"
import { createApp, type AppEnv, type AppVariables } from "@/factory"

describe("createApp", () => {
  it("should create a Hono app", () => {
    const app = createApp()
    expect(app).toBeDefined()
  })

  it("should return an instance with correct type", () => {
    const app = createApp()
    // Should have Hono methods
    expect(typeof app.use).toBe("function")
    expect(typeof app.get).toBe("function")
    expect(typeof app.post).toBe("function")
    expect(typeof app.put).toBe("function")
    expect(typeof app.delete).toBe("function")
    expect(typeof app.route).toBe("function")
  })

  it("should accept custom env type", () => {
    const app = createApp<AppEnv>()
    expect(app).toBeDefined()
  })
})

describe("AppVariables type", () => {
  it("should have session variable", () => {
    const variables: AppVariables = {
      session: {
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
        },
        session: {
          id: "session-1",
          token: "token",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "user-1",
        },
      },
    }

    expect(variables.session).toBeDefined()
    expect(variables.session.user.id).toBe("user-1")
    expect(variables.session.user.email).toBe("test@example.com")
  })

  it("should have optional requestId", () => {
    const variables: AppVariables = {
      session: {
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
        },
        session: {
          id: "session-1",
          token: "token",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "user-1",
        },
      },
      requestId: "req-123",
    }

    expect(variables.requestId).toBe("req-123")
  })

  it("should allow optional session fields", () => {
    const variables: AppVariables = {
      session: {
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          image: "http://example.com/image.png",
        },
        session: {
          id: "session-1",
          token: "token",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "user-1",
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
        },
      },
    }

    expect(variables.session.user.image).toBe("http://example.com/image.png")
    expect(variables.session.session.ipAddress).toBe("127.0.0.1")
  })
})

describe("AppEnv type", () => {
  it("should have Bindings type", () => {
    const env: AppEnv["Bindings"] = {
      DATABASE_URL: "postgresql://localhost:5432/artha",
      BETTER_AUTH_SECRET: "test-secret-key-that-is-at-least-32-chars",
      BETTER_AUTH_URL: "http://localhost:8787",
      OWNER_EMAIL: "owner@example.com",
      FRONTEND_URLS: ["http://localhost:5173"],
      GITHUB_CLIENT_ID: "github-id",
      GITHUB_CLIENT_SECRET: "github-secret",
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
    }

    expect(env.DATABASE_URL).toBeDefined()
    expect(env.BETTER_AUTH_SECRET).toBeDefined()
  })

  it("should have Variables type", () => {
    const variables: AppEnv["Variables"] = {
      session: {
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
        },
        session: {
          id: "session-1",
          token: "token",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "user-1",
        },
      },
    }

    expect(variables.session).toBeDefined()
  })
})
