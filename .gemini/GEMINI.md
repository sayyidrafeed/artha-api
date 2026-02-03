# Gemini Code Reviewer Configuration - Backend

## Overview

Backend-specific configuration for automated code reviews using Gemini Code Reviewer. This focuses on Hono API, Drizzle ORM, and server-side TypeScript patterns.

## Tech Stack Context

- **Framework**: Hono 4.11.7
- **Runtime**: Node.js 20+ / Bun
- **ORM**: Drizzle ORM 0.45.1
- **Database**: Neon PostgreSQL
- **Auth**: Better Auth 1.4.18
- **Validation**: Zod 4.3.6

## Backend-Specific Review Triggers

### File Patterns
```yaml
include:
  - "backend/**/*.ts"
  - "shared/**/*.ts"

exclude:
  - "backend/node_modules/**"
  - "backend/dist/**"
  - "backend/drizzle/**"
  - "**/*.test.ts"
  - "**/*.spec.ts"
```

## Backend Review Rules

### API Design (CRITICAL)

#### HTTP Status Codes
Must use appropriate status codes:
- `200` - Successful GET/PUT/PATCH
- `201` - Successful POST (created)
- `204` - Successful DELETE (no content)
- `400` - Bad request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (no permission)
- `404` - Not found
- `409` - Conflict (duplicate, etc.)
- `422` - Unprocessable entity
- `429` - Too many requests
- `500` - Internal server error

```typescript
// ✅ Good
app.get('/users/:id', async (c) => {
  const user = await getUser(c.req.param('id'));
  if (!user) {
    throw new HTTPException(404, { message: 'User not found' });
  }
  return c.json(user);
});

app.post('/users', async (c) => {
  const data = await c.req.json();
  try {
    const user = await createUser(data);
    return c.json(user, 201);
  } catch (error) {
    if (error instanceof DuplicateError) {
      throw new HTTPException(409, { message: 'User already exists' });
    }
    throw error;
  }
});
```

#### Response Format
All API responses must follow the standardized format:

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "meta": { // optional for pagination
    "page": 1,
    "limit": 10,
    "total": 100
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [ ... ] // optional field-specific errors
  }
}
```

### Database & ORM (CRITICAL)

#### Drizzle ORM Usage
- Always use Drizzle ORM for database operations
- No raw SQL except in migrations
- Use proper type-safe queries

```typescript
// ✅ Good - Type-safe Drizzle query
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    transactions: true,
  },
});

// ✅ Good - Insert with returning
const newUser = await db
  .insert(users)
  .values({ email, name })
  .returning();

// ❌ Bad - Raw SQL in application code
const result = await db.execute(`SELECT * FROM users WHERE id = ${userId}`);
```

#### Transaction Safety
Use transactions for multi-step database operations:

```typescript
// ✅ Good - Atomic transaction
await db.transaction(async (tx) => {
  const [account] = await tx
    .insert(accounts)
    .values({ userId, balance: 0 })
    .returning();
  
  await tx.insert(accountSettings).values({
    accountId: account.id,
    notifications: true,
  });
});
```

#### N+1 Query Prevention
Avoid N+1 queries by using proper relations:

```typescript
// ❌ Bad - N+1 query
const users = await db.query.users.findMany();
for (const user of users) {
  const transactions = await db.query.transactions.findMany({
    where: eq(transactions.userId, user.id),
  });
}

// ✅ Good - Single query with relations
const users = await db.query.users.findMany({
  with: {
    transactions: true,
  },
});
```

### Middleware (CRITICAL)

#### Middleware Order
Middleware must be applied in correct order:

```typescript
// ✅ Correct order
app.use('*', corsMiddleware);        // 1. CORS first
app.use('*', loggingMiddleware);     // 2. Logging
app.use('*', errorHandler);          // 3. Error handling
app.use('/api/auth/*', authRateLimit); // 4. Rate limiting (auth)
app.use('/api/*', apiRateLimit);     // 5. Rate limiting (general)
```

#### Custom Middleware Pattern
```typescript
// ✅ Good - Typed middleware
import { createMiddleware } from 'hono/factory';
import type { Context, Next } from 'hono';

interface AuthContext {
  Variables: {
    user: User;
    session: Session;
  };
}

export const authMiddleware = createMiddleware<AuthContext>(
  async (c, next) => {
    const session = await validateSession(c.req.header('Authorization'));
    if (!session) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }
    c.set('user', session.user);
    c.set('session', session);
    await next();
  }
);

// Usage
app.get('/protected', authMiddleware, (c) => {
  const user = c.get('user'); // Type-safe access
  return c.json({ user });
});
```

### Authentication & Authorization (CRITICAL)

#### Better Auth Integration
```typescript
// ✅ Good - Better Auth handler setup
import { auth } from '@/modules/auth/better-auth';

app.all('/api/auth/*', async (c) => {
  const response = await auth.handler(c.req.raw);
  return response;
});
```

#### Owner Guard Pattern
```typescript
// ✅ Good - Resource ownership check
export const ownerOnlyMiddleware = createMiddleware<AuthContext>(
  async (c, next) => {
    const user = c.get('user');
    const resourceId = c.req.param('id');
    
    const resource = await db.query.resources.findFirst({
      where: eq(resources.id, resourceId),
    });
    
    if (!resource || resource.userId !== user.id) {
      throw new HTTPException(403, { message: 'Forbidden' });
    }
    
    await next();
  }
);

// Usage
app.delete('/transactions/:id', authMiddleware, ownerOnlyMiddleware, handler);
```

### Error Handling (CRITICAL)

#### Error Handler Middleware
```typescript
// ✅ Good - Centralized error handling
export const errorHandler = async (err: Error, c: Context) => {
  console.error('Error:', err);

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

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: err.errors,
        },
      },
      400
    );
  }

  // Default 500 error
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    500
  );
};
```

### Module Structure (WARNING)

#### Feature Module Pattern
Each module should follow this structure:

```typescript
// modules/transactions/routes.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/', listTransactionsHandler);
app.post('/', createTransactionHandler);
app.get('/:id', getTransactionHandler);
app.patch('/:id', updateTransactionHandler);
app.delete('/:id', deleteTransactionHandler);

export default app;

// modules/transactions/service.ts
export async function listTransactions(
  userId: string,
  filters: TransactionFilters
): Promise<Transaction[]> {
  // Business logic
}

export async function createTransaction(
  userId: string,
  data: CreateTransactionData
): Promise<Transaction> {
  // Business logic
}

// modules/transactions/schema.ts
import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(255),
  categoryId: z.string().uuid(),
  date: z.string().datetime(),
});

export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
```

### Validation (WARNING)

#### Zod Schema Patterns
```typescript
// ✅ Good - Reusable validators
export const uuidSchema = z.string().uuid();
export const positiveNumberSchema = z.number().positive();
export const nonEmptyStringSchema = z.string().min(1);

// ✅ Good - Composable schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const listTransactionsSchema = z.object({
  ...paginationSchema.shape,
  categoryId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
```

### Performance (WARNING)

#### Rate Limiting
All sensitive endpoints must have rate limiting:

```typescript
// ✅ Good - Different limits for different endpoints
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts',
});

export const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Rate limit exceeded',
});
```

#### Query Optimization
```typescript
// ✅ Good - Select only needed columns
const users = await db
  .select({
    id: users.id,
    email: users.email,
    name: users.name,
  })
  .from(users)
  .where(eq(users.active, true))
  .limit(10);

// ✅ Good - Use indexes in queries
const recentTransactions = await db.query.transactions.findMany({
  where: and(
    eq(transactions.userId, userId),
    gte(transactions.date, startDate)
  ),
  orderBy: [desc(transactions.date)],
  limit: 50,
});
```

## Backend-Specific Review Output

When reviewing backend code, focus on:

1. **API correctness** - Proper HTTP methods, status codes, response formats
2. **Database safety** - No SQL injection, proper transactions, N+1 prevention
3. **Security** - Authentication checks, authorization, input validation
4. **Error handling** - Proper error responses, no information leakage
5. **Performance** - Query optimization, rate limiting, caching opportunities
6. **Type safety** - Proper TypeScript types, Drizzle type inference

## Integration with Backend CI/CD

Gemini reviews should check:
- All routes have proper middleware
- All database queries use Drizzle ORM
- All inputs are validated with Zod
- All errors are handled properly
- No secrets in code
- Proper TypeScript types throughout
