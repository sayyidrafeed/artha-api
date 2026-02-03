import { createMiddleware } from "hono/factory"
import { Redis } from "@upstash/redis"

// Initialize Upstash Redis if environment variables are available
// Fallback to in-memory store for development
const upstashRedis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory fallback for development (not suitable for serverless production)
const inMemoryStore = new Map<string, RateLimitRecord>()

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

async function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<RateLimitResult> {
  const now = Date.now()
  const resetTime = now + windowMs

  if (upstashRedis) {
    // Use Upstash Redis for distributed rate limiting
    const countKey = `ratelimit:${key}`
    const result = await upstashRedis.incr(countKey)

    if (result === 1) {
      // First request in window, set expiry
      await upstashRedis.expire(countKey, Math.ceil(windowMs / 1000))
    }

    const count = result
    const remaining = Math.max(0, maxRequests - count)
    const allowed = count <= maxRequests

    return { allowed, remaining, resetTime }
  } else {
    // Fallback to in-memory store (development only)
    const record = inMemoryStore.get(key)

    if (!record || record.resetTime < now) {
      inMemoryStore.set(key, {
        count: 1,
        resetTime,
      })
      return { allowed: true, remaining: maxRequests - 1, resetTime }
    }

    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime }
    }

    record.count++
    return { allowed: true, remaining: maxRequests - record.count, resetTime }
  }
}

export function rateLimit(options: RateLimitOptions) {
  return createMiddleware(async (c, next): Promise<Response | void> => {
    const ip =
      c.req.header("x-forwarded-for") ||
      c.req.header("cf-connecting-ip") ||
      "unknown"
    const path = c.req.path
    const key = `ratelimit:${ip}:${path}`

    const result = await checkRateLimit(
      key,
      options.windowMs,
      options.maxRequests,
    )

    if (!result.allowed) {
      return c.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests, please try again later",
          },
        },
        429,
      )
    }

    // Add rate limit headers
    c.header("X-RateLimit-Limit", options.maxRequests.toString())
    c.header("X-RateLimit-Remaining", result.remaining.toString())
    c.header("X-RateLimit-Reset", new Date(result.resetTime).toISOString())

    await next()
  })
}

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 5,
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100,
})
