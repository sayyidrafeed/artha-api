import { z } from 'zod';

// Transaction type enum
export const transactionTypeSchema = z.enum(['income', 'expense']);

// Create transaction schema
export const createTransactionSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount is too large'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// Update transaction schema (all fields optional)
export const updateTransactionSchema = createTransactionSchema.partial();

// Transaction filter/query schema
export const transactionFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  categoryId: z.string().uuid().optional(),
  type: transactionTypeSchema.optional(),
});

// Transaction response schema
export const transactionSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  categoryType: transactionTypeSchema,
  amountCents: z.number().int().positive(),
  description: z.string(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Types
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
