# Artha Shared Zod Schemas Documentation

This document defines all shared Zod schemas that must be copied to both backend and frontend projects to maintain validation parity.

## File Structure

```
artha-api/src/schemas/
├── auth.ts
├── transaction.ts
├── category.ts
├── dashboard.ts
└── common.ts

artha-web/src/schemas/
├── auth.ts
├── transaction.ts
├── category.ts
├── dashboard.ts
└── common.ts
```

---

## auth.ts

**Note**: Better Auth handles most authentication. These schemas are for type safety and client-side validation.

```typescript
import { z } from 'zod';

// OAuth provider schema
export const oauthProviderSchema = z.enum(['github', 'google']);

// User schema (from Better Auth)
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().optional(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

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
});

// Sign in with email (development only)
export const emailSignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Types
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;
export type User = z.infer<typeof userSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type EmailSignInInput = z.infer<typeof emailSignInSchema>;
```

---

## transaction.ts

```typescript
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
```

---

## category.ts

```typescript
import { z } from 'zod';
import { transactionTypeSchema } from './transaction';

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
```

---

## dashboard.ts

```typescript
import { z } from 'zod';
import { transactionTypeSchema } from './transaction';

// Dashboard date range filter
export const dashboardFilterSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

// Monthly summary response
export const monthlySummarySchema = z.object({
  year: z.number().int(),
  month: z.number().int().optional(),
  incomeCents: z.number().int(),
  expenseCents: z.number().int(),
  balanceCents: z.number().int(),
});

// Category aggregation item
export const categoryAggregationSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  type: transactionTypeSchema,
  totalCents: z.number().int(),
  transactionCount: z.number().int(),
});

// Dashboard by-category response
export const dashboardByCategorySchema = z.object({
  year: z.number().int(),
  month: z.number().int().optional(),
  income: z.array(categoryAggregationSchema),
  expense: z.array(categoryAggregationSchema),
});

// Types
export type DashboardFilter = z.infer<typeof dashboardFilterSchema>;
export type MonthlySummary = z.infer<typeof monthlySummarySchema>;
export type CategoryAggregation = z.infer<typeof categoryAggregationSchema>;
export type DashboardByCategory = z.infer<typeof dashboardByCategorySchema>;
```

---

## common.ts

```typescript
import { z } from 'zod';

// API error codes
export const errorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);

// Pagination metadata
export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

// Standard API success response
export function createSuccessResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: paginationMetaSchema.optional(),
  });
}

// Standard API error response
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

// API response wrapper type helper
export type ApiResponse<T> =
  | { success: true; data: T; meta?: z.infer<typeof paginationMetaSchema> }
  | { success: false; error: z.infer<typeof errorResponseSchema>['error'] };

// Types
export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
```

---

## Copy Instructions

1. Create the following directories:
   - `artha-api/src/schemas/`
   - `artha-web/src/schemas/`

2. Copy all schema files to both directories

3. Install zod in both projects:
   ```bash
   npm install zod@^4.3.6
   ```

4. Import schemas in your code:
   ```typescript
   import { emailSignInSchema, type EmailSignInInput } from '@/schemas/auth';
   ```

## Key Changes from Multi-User Design

1. **No Registration Schema**: Removed `registerSchema` - no public registration
2. **No User ID in Transaction**: `transactionSchema` doesn't include `userId`
3. **Better Auth Types**: Added `userSchema` and `sessionSchema` for Better Auth compatibility
4. **Simplified Category**: No `userId` in category schema

## Version Control Note

When schemas change:
1. Update the source in both repositories
2. Keep versions in sync
3. Test both frontend and backend after changes
