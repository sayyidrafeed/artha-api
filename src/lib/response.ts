import type { Context } from "hono"
import type { PaginationMeta } from "../schemas/common"

interface SuccessResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export function success<T>(
  c: Context,
  data: T,
  meta?: PaginationMeta,
): Response {
  const response: SuccessResponse<T> = { success: true, data }
  if (meta) {
    response.meta = meta
  }
  return c.json(response)
}

export function error(
  c: Context,
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 429 | 500 = 500,
  details?: unknown,
): Response {
  const response: ErrorResponse = {
    success: false,
    error: { code, message },
  }
  if (details !== undefined) {
    response.error.details = details
  }
  return c.json(response, status)
}
