/**
 * Environment Schema Tests
 * Following TDD: Tests for environment variable validation
 */

import { describe, it, expect } from "bun:test"
import { EnvSchema } from "@/env"

const validEnv = {
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

describe("EnvSchema", () => {
  describe("Required fields", () => {
    it("should validate valid environment", () => {
      const result = EnvSchema.safeParse(validEnv)
      expect(result.success).toBe(true)
    })

    it("should reject missing DATABASE_URL", () => {
      const env = { ...validEnv, DATABASE_URL: undefined }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should reject missing BETTER_AUTH_SECRET", () => {
      const env = { ...validEnv, BETTER_AUTH_SECRET: undefined }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should reject short BETTER_AUTH_SECRET", () => {
      const env = { ...validEnv, BETTER_AUTH_SECRET: "short" }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should reject missing BETTER_AUTH_URL", () => {
      const env = { ...validEnv, BETTER_AUTH_URL: undefined }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should reject invalid URL for BETTER_AUTH_URL", () => {
      const env = { ...validEnv, BETTER_AUTH_URL: "not-a-url" }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should reject missing OWNER_EMAIL", () => {
      const env = { ...validEnv, OWNER_EMAIL: undefined }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should reject invalid email for OWNER_EMAIL", () => {
      const env = { ...validEnv, OWNER_EMAIL: "not-email" }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })
  })

  describe("FRONTEND_URLS transformation", () => {
    it("should parse comma-separated URLs", () => {
      const result = EnvSchema.safeParse(validEnv)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.FRONTEND_URLS).toEqual([
          "http://localhost:5173",
          "http://localhost:3000",
        ])
      }
    })

    it("should handle single URL", () => {
      const env = { ...validEnv, FRONTEND_URLS: "http://localhost:5173" }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.FRONTEND_URLS).toEqual(["http://localhost:5173"])
      }
    })

    it("should trim whitespace from URLs", () => {
      const env = {
        ...validEnv,
        FRONTEND_URLS: "http://localhost:5173 , http://localhost:3000",
      }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.FRONTEND_URLS).toEqual([
          "http://localhost:5173",
          "http://localhost:3000",
        ])
      }
    })

    it("should filter empty strings", () => {
      const env = {
        ...validEnv,
        FRONTEND_URLS: "http://localhost:5173,,http://localhost:3000",
      }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.FRONTEND_URLS).toEqual([
          "http://localhost:5173",
          "http://localhost:3000",
        ])
      }
    })
  })

  describe("OAuth providers", () => {
    it("should accept valid OAuth credentials", () => {
      const result = EnvSchema.safeParse(validEnv)
      expect(result.success).toBe(true)
    })

    it("should require GITHUB_CLIENT_ID", () => {
      const env = { ...validEnv, GITHUB_CLIENT_ID: undefined }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should require GITHUB_CLIENT_SECRET", () => {
      const env = { ...validEnv, GITHUB_CLIENT_SECRET: undefined }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should require GOOGLE_CLIENT_ID", () => {
      const env = { ...validEnv, GOOGLE_CLIENT_ID: undefined }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should require GOOGLE_CLIENT_SECRET", () => {
      const env = { ...validEnv, GOOGLE_CLIENT_SECRET: undefined }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })
  })

  describe("Optional fields", () => {
    it("should accept optional UPSTASH_REDIS_REST_URL", () => {
      const env = {
        ...validEnv,
        UPSTASH_REDIS_REST_URL: "https://redis.example.com",
      }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(true)
    })

    it("should validate UPSTASH_REDIS_REST_URL as URL", () => {
      const env = { ...validEnv, UPSTASH_REDIS_REST_URL: "not-url" }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should accept optional NODE_ENV", () => {
      const env = { ...validEnv, NODE_ENV: "production" }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(true)
    })

    it("should reject invalid NODE_ENV", () => {
      const env = { ...validEnv, NODE_ENV: "invalid" }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should default NODE_ENV to development", () => {
      const env = { ...validEnv, NODE_ENV: undefined }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(true)
    })

    it("should accept optional HYPERDRIVE_ID", () => {
      const env = { ...validEnv, HYPERDRIVE_ID: "hyperdrive-id" }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(true)
    })
  })

  describe("URL validation", () => {
    it("should validate DATABASE_URL as proper URL", () => {
      const env = { ...validEnv, DATABASE_URL: "not-a-url" }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(false)
    })

    it("should accept postgresql protocol", () => {
      const env = {
        ...validEnv,
        DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(true)
    })

    it("should accept postgres protocol", () => {
      const env = {
        ...validEnv,
        DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      }
      const result = EnvSchema.safeParse(env)
      expect(result.success).toBe(true)
    })
  })
})
