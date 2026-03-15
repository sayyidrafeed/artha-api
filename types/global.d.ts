/// <reference types="bun-types" />

/// <reference types="@cloudflare/workers-types" />

/**
 * Global type declarations for Artha API
 * These extend the global scope with project-specific types
 */

declare global {
  /**
   * Cloudflare Workers environment bindings
   * These are injected by Wrangler/Cloudflare Workers runtime
   */

  interface CloudflareEnv {
    DATABASE_URL: string

    BETTER_AUTH_SECRET: string

    BETTER_AUTH_URL: string

    OWNER_EMAIL: string

    GITHUB_CLIENT_ID: string

    GITHUB_CLIENT_SECRET: string

    GOOGLE_CLIENT_ID: string

    GOOGLE_CLIENT_SECRET: string

    UPSTASH_REDIS_REST_URL?: string

    UPSTASH_REDIS_REST_TOKEN?: string
  }

  /**
   * Execution context provided by Cloudflare Workers
   */

  interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void

    passThroughOnException(): void
  }
}

/**
 * Module augmentation for Hono context with Cloudflare bindings
 */

declare module "hono" {
  interface ContextVariableMap {
    env: CloudflareEnv
  }
}

export {}
