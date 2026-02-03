import { createMiddleware } from "hono/factory"

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

export function rateLimit(options: RateLimitOptions) {
  return createMiddleware(async (c, next): Promise<Response | void> => {
    const ip = c.req.header("x-forwarded-for") || "unknown"
    const now = Date.now()

    const record = rateLimitStore.get(ip)

    if (!record || record.resetTime < now) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      })
    } else if (record.count >= options.maxRequests) {
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
    } else {
      record.count++
    }

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
