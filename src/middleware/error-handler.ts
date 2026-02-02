import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c): Response => {
  console.error('Unhandled error:', err);

  if (err instanceof Error) {
    if (err.message.includes('unique constraint')) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Resource already exists',
          },
        },
        409,
      );
    }
  }

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    500,
  );
};
