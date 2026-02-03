import { z } from "zod"

// API error codes
export const errorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
])

// Pagination metadata
export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int(),
  totalPages: z.number().int(),
})

// Standard API success response
export function createSuccessResponseSchema<T extends z.ZodType>(
  dataSchema: T,
) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: paginationMetaSchema.optional(),
  })
}

// Standard API error response
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

// API response wrapper type helper
export type ApiResponse<T> = {
  success: true
  data: T
  meta?: z.infer<typeof paginationMetaSchema>
} | { success: false; error: z.infer<typeof errorResponseSchema>["error"] }

// Types
export type ErrorCode = z.infer<typeof errorCodeSchema>
export type PaginationMeta = z.infer<typeof paginationMetaSchema>
