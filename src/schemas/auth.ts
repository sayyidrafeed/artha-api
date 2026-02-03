import { z } from "zod"

// OAuth provider schema
export const oauthProviderSchema = z.enum(["github", "google"])

// User schema (from Better Auth)
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().optional(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Session schema (from Better Auth)
export const sessionSchema = z.object({
  id: z.string(),
  token: z.string(),
  userId: z.string(),
  expiresAt: z.string().datetime(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Sign in with email (development only)
export const emailSignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// Types
export type OAuthProvider = z.infer<typeof oauthProviderSchema>
export type User = z.infer<typeof userSchema>
export type Session = z.infer<typeof sessionSchema>
export type EmailSignInInput = z.infer<typeof emailSignInSchema>
