import { createMiddleware } from "hono/factory"

import { getAuth } from "./better-auth"

import { error } from "../../lib/response"

import { EnvSchema } from "../../env"

import type { AppEnv } from "../../factory"

export const ownerOnlyMiddleware = createMiddleware<AppEnv>(
  async (c, next): Promise<Response | void> => {
    // Validate environment variables

    const envResult = EnvSchema.safeParse(c.env)

    if (!envResult.success) {
      return error(c, "INTERNAL_ERROR", "Server misconfiguration", 500)
    }

    const env = envResult.data

    // Get session from Better Auth

    const session = await getAuth(env).api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session) {
      return error(c, "UNAUTHORIZED", "Authentication required", 401)
    }

    // Verify this is the owner account

    if (session.user.email !== env.OWNER_EMAIL) {
      return error(c, "FORBIDDEN", "Access restricted to owner only", 403)
    }

    // Store session in context

    c.set("session", session)

    await next()
  },
)
