# Backend Style Guide - Artha API

## Overview

This style guide covers TypeScript coding standards specific to the Artha backend API built with Hono, Drizzle ORM, and PostgreSQL.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Hono Patterns](#hono-patterns)
3. [Database & Drizzle ORM](#database--drizzle-orm)
4. [API Design Standards](#api-design-standards)
5. [Middleware Patterns](#middleware-patterns)
6. [Error Handling](#error-handling)
7. [Validation Patterns](#validation-patterns)
8. [Authentication & Authorization](#authentication--authorization)
9. [Testing Patterns](#testing-patterns)

---

## Project Structure

### Module Organization

```
backend/src/
├── index.ts              # Application entry point
├── db/
│   ├── index.ts          # Database connection
│   └── schema.ts         # Drizzle schema definitions
├── lib/
│   ├── response.ts       # Response helpers
│   └── currency.ts       # Currency utilities
├── middleware/
│   ├── cors.ts
│   ├── error-handler.ts
│   ├── logging.ts
│   └── rate-limit.ts
├── modules/
│   ├── auth/             # Authentication module
│   │   ├── better-auth.ts
│   │   ├── index.ts
│   │   └── owner-guard.ts
│   ├── categories/       # Categories module
│   │   ├── routes.ts
│   │   ├── service.ts
│   │   └── schema.ts
│   ├── transactions/     # Transactions module
│   │   ├── routes.ts
│   │   ├── service.ts
│   │   └── schema.ts
│   └── dashboard/        # Dashboard module
│       ├── routes.ts
│       ├── service.ts
│       └── schema.ts
└── schemas/              # Shared Zod schemas
    ├── auth.ts
    └── common.ts
```

### Module File Conventions

Each feature module must contain:
- `routes.ts` - Route definitions and handlers
- `service.ts` - Business logic and database operations
- `schema.ts` - Zod validation schemas and types

---

## Hono Patterns

### Application Setup

```typescript
// ✅ Good - Proper Hono app setup
import { Hono } from 'hono';
import { corsMiddleware } from '@/middleware/cors';
import { loggingMiddleware } from '@/middleware/logging';
import { errorHandler } from '@/middleware/error-handler';

const app = new Hono();

// Global middleware (order matters)
app.use('*', corsMiddleware);
app.use('*', loggingMiddleware);
app.use('*', errorHandler);

// Route mounting
app.route('/api/transactions', transactionsRoutes);
app.route('/api/categories', categoriesRoutes);

export default app;
```

### Route Handlers

```typescript
// ✅ Good - Typed route handlers
import type { Context } from 'hono';

export async function getTransactionHandler(
  c: Context
): Promise<Response> {
  const id = c.req.param('id');
  const transaction = await getTransactionById(id);
  
  if (!transaction) {
    throw new HTTPException(404, { message: 'Transaction not found' });
  }
  
  return c.json({
    success: true,
    data: transaction,
  });
}

// ✅ Good - POST with validation
export async function createTransactionHandler(
  c: Context
): Promise<Response> {
  const body = await c.req.json();
  const data = createTransactionSchema.parse(body);
  
  const user = c.get('user');
  const transaction = await createTransaction(user.id, data);
  
  return c.json(
    {
      success: true,
      data: transaction,
    },
    201
  );
}
```

### Route Organization

```typescript
// ✅ Good - Route file structure
import { Hono } from 'hono';
import { authMiddleware } from '@/modules/auth';
import { ownerOnlyMiddleware } from '@/modules/auth/owner-guard';
import {
  listTransactionsHandler,
  getTransactionHandler,
  createTransactionHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
} from './service';

const app = new Hono();

// Public routes (if any)
// app.get('/public', publicHandler);

// Protected routes
app.use('*', authMiddleware);

app.get('/', listTransactionsHandler);
app.post('/', createTransactionHandler);
app.get('/:id', getTransactionHandler);
app.patch('/:id', ownerOnlyMiddleware, updateTransactionHandler);
app.delete('/:id', ownerOnlyMiddleware, deleteTransactionHandler);

export default app;
```

---

## Database & Drizzle ORM

### Schema Definition

```typescript
// ✅ Good - Proper schema definition
import { pgTable, uuid, varchar, timestamp, numeric, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Table definition
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));
```

### Query Patterns

```typescript
// ✅ Good - Type-safe queries
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

// Single record lookup
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});

// With relations
const userWithTransactions = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    transactions: {
      orderBy: [desc(transactions.date)],
      limit: 10,
    },
  },
});

// List with filters
const transactions = await db.query.transactions.findMany({
  where: and(
    eq(transactions.userId, userId),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate)
  ),
  orderBy: [desc(transactions.date)],
  limit,
  offset,
});

// Insert with returning
const [newTransaction] = await db
  .insert(transactions)
  .values({
    userId,
    amount: data.amount.toString(),
    description: data.description,
    date: new Date(data.date),
  })
  .returning();

// Update
const [updated] = await db
  .update(transactions)
  .set({
    amount: data.amount.toString(),
    description: data.description,
    updatedAt: new Date(),
  })
  .where(eq(transactions.id, id))
  .returning();

// Delete
await db.delete(transactions).where(eq(transactions.id, id));
```

### Transaction Patterns

```typescript
// ✅ Good - Database transactions
await db.transaction(async (tx) => {
  // Create transaction record
  const [record] = await tx
    .insert(transactions)
    .values({
      userId,
      amount: data.amount.toString(),
      type: data.type,
    })
    .returning();
  
  // Update account balance
  await tx
    .update(accounts)
    .set({
      balance: sql`${accounts.balance} + ${data.amount}`,
    })
    .where(eq(accounts.id, data.accountId));
  
  // Create audit log
  await tx.insert(auditLogs).values({
    userId,
    action: 'transaction_created',
    entityId: record.id,
  });
});
```

### Aggregation Queries

```typescript
// ✅ Good - Aggregation with Drizzle
import { sql, sum, count } from 'drizzle-orm';

// Sum of transactions by category
const categoryTotals = await db
  .select({
    categoryId: transactions.categoryId,
    total: sum(transactions.amount),
    count: count(),
  })
  .from(transactions)
  .where(and(
    eq(transactions.userId, userId),
    gte(transactions.date, startDate)
  ))
  .groupBy(transactions.categoryId);

// Monthly summary
const monthlySummary = await db
  .select({
    month: sql<string>`DATE_TRUNC('month', ${transactions.date})`,
    income: sum(sql`CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END`),
    expense: sum(sql`CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END`),
  })
  .from(transactions)
  .where(eq(transactions.userId, userId))
  .groupBy(sql`DATE_TRUNC('month', ${transactions.date})`)
  .orderBy(desc(sql`DATE_TRUNC('month', ${transactions.date})`));
```

---

## API Design Standards

### Response Format

```typescript
// lib/response.ts

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ✅ Good - Response helpers
export function successResponse<T>(
  c: Context,
  data: T,
  status = 200
): Response {
  return c.json({ success: true, data }, status);
}

export function paginatedResponse<T>(
  c: Context,
  data: T[],
  meta: { page: number; limit: number; total: number }
): Response {
  return c.json({
    success: true,
    data,
    meta,
  });
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request (malformed) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (no permission) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, etc.) |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### Pagination

```typescript
// ✅ Good - Pagination implementation
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface PaginationParams {
  page: number;
  limit: number;
}

function getPaginationParams(c: Context): PaginationParams {
  const page = Math.max(1, parseInt(c.req.query('page') || String(DEFAULT_PAGE), 10));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(c.req.query('limit') || String(DEFAULT_LIMIT), 10))
  );
  return { page, limit };
}

// Usage
app.get('/transactions', async (c) => {
  const { page, limit } = getPaginationParams(c);
  const offset = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    db.query.transactions.findMany({
      where: eq(transactions.userId, c.get('user').id),
      limit,
      offset,
      orderBy: [desc(transactions.date)],
    }),
    db.$count(transactions, eq(transactions.userId, c.get('user').id)),
  ]);
  
  return paginatedResponse(c, data, { page, limit, total });
});
```

---

## Middleware Patterns

### Authentication Middleware

```typescript
// ✅ Good - Auth middleware with types
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

interface AuthContext {
  Variables: {
    user: {
      id: string;
      email: string;
    };
    session: {
      id: string;
      expiresAt: Date;
    };
  };
}

export const authMiddleware = createMiddleware<AuthContext>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Missing authorization header' });
    }
    
    const token = authHeader.slice(7);
    const session = await validateSession(token);
    
    if (!session || session.expiresAt < new Date()) {
      throw new HTTPException(401, { message: 'Invalid or expired session' });
    }
    
    c.set('user', session.user);
    c.set('session', session);
    
    await next();
  }
);
```

### Rate Limiting Middleware

```typescript
// ✅ Good - Rate limiting implementation
import { rateLimiter } from 'hono-rate-limiter';

export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  keyGenerator: (c) => c.req.header('x-forwarded-for') || c.req.ip,
  handler: (c) => {
    throw new HTTPException(429, {
      message: 'Too many authentication attempts. Please try again later.',
    });
  },
});

export const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  keyGenerator: (c) => c.get('user')?.id || c.req.ip,
});
```

### Logging Middleware

```typescript
// ✅ Good - Request logging
import { createMiddleware } from 'hono/factory';

export const loggingMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  c.set('requestId', requestId);
  
  console.info(`[${requestId}] ${c.req.method} ${c.req.path} - Started`);
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  
  console.info(
    `[${requestId}] ${c.req.method} ${c.req.path} - ${status} (${duration}ms)`
  );
});
```

---

## Error Handling

### Error Handler Middleware

```typescript
// ✅ Good - Centralized error handling
import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId');
  
  // Log all errors
  console.error(`[${requestId}] Error:`, err);
  
  // HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message: err.message,
        },
      },
      err.status
    );
  }
  
  // Validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      422
    );
  }
  
  // Database errors
  if (err instanceof DatabaseError) {
    return c.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
        },
      },
      500
    );
  }
  
  // Default error
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    500
  );
};
```

### Custom Error Classes

```typescript
// ✅ Good - Domain-specific errors
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id ${id} not found` : `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
```

---

## Validation Patterns

### Zod Schema Patterns

```typescript
// ✅ Good - Schema organization
import { z } from 'zod';

// Reusable validators
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const positiveDecimalSchema = z.string().regex(/^\d+(\.\d{1,2})?$/);

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Transaction schemas
export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(500).optional(),
  categoryId: uuidSchema,
  date: z.string().datetime(),
  type: z.enum(['income', 'expense']),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const listTransactionsSchema = z.object({
  ...paginationSchema.shape,
  categoryId: uuidSchema.optional(),
  type: z.enum(['income', 'expense']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Type inference
export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsParams = z.infer<typeof listTransactionsSchema>;
```

### Request Validation

```typescript
// ✅ Good - Validating requests
import { z } from 'zod';

export async function createTransactionHandler(c: Context): Promise<Response> {
  // Parse and validate body
  const body = await c.req.json();
  const data = createTransactionSchema.parse(body);
  
  // Validate query params
  const querySchema = z.object({
    includeCategory: z.coerce.boolean().default(false),
  });
  const query = querySchema.parse(Object.fromEntries(c.req.query()));
  
  // Validate route params
  const paramsSchema = z.object({
    id: z.string().uuid(),
  });
  const params = paramsSchema.parse(c.req.param());
  
  // Process...
}
```

---

## Authentication & Authorization

### Better Auth Integration

```typescript
// ✅ Good - Better Auth setup
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';

export const auth = betterAuth({
  database: drizzleAdapter(db),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

// Handler for auth routes
export const authHandler = async (request: Request): Promise<Response> => {
  return auth.handler(request);
};
```

### Owner Guard Pattern

```typescript
// ✅ Good - Resource ownership verification
export const ownerOnlyMiddleware = createMiddleware<AuthContext>(
  async (c, next) => {
    const user = c.get('user');
    const resourceId = c.req.param('id');
    
    // Determine resource type from path
    const path = c.req.path;
    let resource: { userId: string } | undefined;
    
    if (path.includes('/transactions/')) {
      resource = await db.query.transactions.findFirst({
        where: eq(transactions.id, resourceId),
        columns: { userId: true },
      });
    } else if (path.includes('/categories/')) {
      resource = await db.query.categories.findFirst({
        where: eq(categories.id, resourceId),
        columns: { userId: true },
      });
    }
    
    if (!resource) {
      throw new HTTPException(404, { message: 'Resource not found' });
    }
    
    if (resource.userId !== user.id) {
      throw new HTTPException(403, { message: 'Access denied' });
    }
    
    await next();
  }
);
```

---

## Testing Patterns

### Unit Testing Services

```typescript
// ✅ Good - Service testing
import { describe, it, expect, beforeEach } from 'bun:test';
import { createTransaction, getTransactionById } from './service';
import { db } from '@/db';

describe('TransactionService', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(transactions);
  });
  
  describe('createTransaction', () => {
    it('should create a transaction with valid data', async () => {
      const data = {
        amount: 100.50,
        description: 'Test transaction',
        categoryId: 'cat-123',
        date: new Date().toISOString(),
        type: 'expense' as const,
      };
      
      const result = await createTransaction('user-123', data);
      
      expect(result).toBeDefined();
      expect(result.amount).toBe('100.50');
      expect(result.userId).toBe('user-123');
    });
    
    it('should throw ValidationError for negative amount', async () => {
      const data = {
        amount: -100,
        description: 'Test',
        categoryId: 'cat-123',
        date: new Date().toISOString(),
        type: 'expense' as const,
      };
      
      await expect(createTransaction('user-123', data))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

### Integration Testing Routes

```typescript
// ✅ Good - Route integration testing
import { describe, it, expect } from 'bun:test';
import app from '@/index';

describe('Transactions API', () => {
  describe('POST /api/transactions', () => {
    it('should create a transaction', async () => {
      const response = await app.request('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: JSON.stringify({
          amount: 100,
          description: 'Test',
          categoryId: 'cat-123',
          date: new Date().toISOString(),
          type: 'expense',
        }),
      });
      
      expect(response.status).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.amount).toBe('100');
    });
    
    it('should return 401 without auth', async () => {
      const response = await app.request('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      expect(response.status).toBe(401);
    });
  });
});
```

### Test Utilities

```typescript
// ✅ Good - Test helpers
import { db } from '@/db';

export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      ...overrides,
    })
    .returning();
  return user;
}

export async function createTestTransaction(
  userId: string,
  overrides: Partial<Transaction> = {}
): Promise<Transaction> {
  const [transaction] = await db
    .insert(transactions)
    .values({
      userId,
      amount: '100.00',
      description: 'Test transaction',
      date: new Date(),
      ...overrides,
    })
    .returning();
  return transaction;
}

export function createAuthHeader(userId: string): string {
  return `Bearer test-token-${userId}`;
}
```
