import type { ErrorHandler } from "hono"
import type { ZodError } from "zod"

export const errorHandler: ErrorHandler = (err, c): Response => {
  console.error("Unhandled error:", err)

  // Handle Zod validation errors
  if (err && typeof err === "object" && "issues" in err) {
    const zodError = err as ZodError
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: zodError.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      400,
    )
  }

  if (err instanceof Error) {
    // Handle unique constraint errors
    if (err.message.includes("unique constraint")) {
      return c.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Resource already exists",
          },
        },
        409,
      )
    }

    // Handle foreign key constraint errors
    if (err.message.includes("foreign key constraint")) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Referenced resource does not exist",
          },
        },
        400,
      )
    }
  }

  // Default internal server error
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500,
  )
}
