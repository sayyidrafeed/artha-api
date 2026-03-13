import { Hono } from "hono"

import type { Env } from "./env"

/** Request-scoped variables */

export type AppVariables = {
  session: {
    user: {
      id: string

      email: string

      name: string

      image?: string | null
    }

    session: {
      id: string

      token: string

      expiresAt: Date

      createdAt: Date

      updatedAt: Date

      userId: string

      ipAddress?: string | null

      userAgent?: string | null
    }
  }

  requestId?: string
}

/** Full environment type with Bindings */

export type AppEnv = {
  Bindings: Env

  Variables: AppVariables
}

/**
 * Creates a new Hono app with proper Cloudflare Workers typing
 * Use this instead of `new Hono()` for type-safe routes
 */

export function createApp<E extends AppEnv = AppEnv>(): Hono<E> {
  return new Hono<E>()
}
