import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../../db"

const authInstance = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,

  // Trusted origins for OAuth callbacks and CSRF protection
  trustedOrigins: [process.env.FRONTEND_URL || "https://artha.sayyidrafee.com"],

  // OAuth Providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  // Cookie configuration
  cookies: {
    sessionToken: {
      name: "artha.session",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
      },
    },
  },
})

export const auth = authInstance
export const authHandler = authInstance.handler
