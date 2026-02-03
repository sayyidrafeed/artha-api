import { createMiddleware } from "hono/factory"
import { auth } from "./better-auth"
import { error } from "../../lib/response"

// Owner email from environment
const OWNER_EMAIL = process.env.OWNER_EMAIL!

declare module "hono" {
  interface ContextVariableMap {
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
  }
}

export const ownerOnlyMiddleware = createMiddleware(
  async (c, next): Promise<Response | void> => {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session) {
      return error(c, "UNAUTHORIZED", "Authentication required", 401)
    }

    // Verify this is the owner account
    if (session.user.email !== OWNER_EMAIL) {
      return error(c, "FORBIDDEN", "Access restricted to owner only", 403)
    }

    // Store session in context
    c.set("session", session)

    await next()
  },
)

// Re-export auth handler from better-auth.ts
export { authHandler } from "./better-auth"
