import { z } from 'zod';
import { transactionTypeSchema } from '../transactions/schema';

// Create category schema
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters'),
  type: transactionTypeSchema,
});

// Update category schema
export const updateCategorySchema = createCategorySchema.partial();

// Category response schema
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: transactionTypeSchema,
  createdAt: z.string().datetime(),
});

// Types
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type Category = z.infer<typeof categorySchema>;
