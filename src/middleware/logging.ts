import { createMiddleware } from "hono/factory"

export const loggingMiddleware = createMiddleware(
  async (c, next): Promise<void> => {
    const start = Date.now()
    const method = c.req.method
    const path = c.req.path

    console.info(`[${new Date().toISOString()}] ${method} ${path} - Started`)

    await next()

    const duration = Date.now() - start
    const status = c.res.status

    console.info(
      `[${new Date().toISOString()}] ${method} ${path} - ${status} (${duration}ms)`,
    )
  },
)
