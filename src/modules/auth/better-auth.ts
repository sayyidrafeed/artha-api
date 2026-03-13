import { betterAuth } from "better-auth"

import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { getDb } from "../../db"

import type { Env } from "../../env"

let authInstance: ReturnType<typeof betterAuth> | null = null

/**
 * Creates or returns cached auth instance for Cloudflare Workers
 * Note: We can't cache per-request since better-auth instance is heavy
 */

export function getAuth(env: Env) {
  if (!authInstance) {
    authInstance = betterAuth({
      database: drizzleAdapter(getDb(env), {
        provider: "pg",
      }),

      secret: env.BETTER_AUTH_SECRET,

      baseURL: env.BETTER_AUTH_URL,

      trustedOrigins: env.FRONTEND_URLS,

      socialProviders: {
        github: {
          clientId: env.GITHUB_CLIENT_ID,

          clientSecret: env.GITHUB_CLIENT_SECRET,
        },

        google: {
          clientId: env.GOOGLE_CLIENT_ID,

          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      },

      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days

        updateAge: 60 * 60 * 24, // 1 day
      },

      cookies: {
        sessionToken: {
          name: "artha.session",

          options: {
            httpOnly: true,

            secure: env.NODE_ENV === "production",

            sameSite: "lax",

            path: "/",

            maxAge: 60 * 60 * 24 * 7, // 7 days
          },
        },
      },
    })
  }

  return authInstance
}

export const authHandler = (env: Env) => getAuth(env).handler
