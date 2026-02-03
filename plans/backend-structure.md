# Artha Backend Structure - Modular Monolith with Better Auth

## Toolchain: Bun + oxlint + oxfmt

This project uses **Bun** for development workflows while retaining npm for production deployments. Code quality is enforced by **oxlint** (linting) and **oxfmt** (formatting).

## Project Structure

```
artha-api/
├── src/
│   ├── modules/                    # Feature modules (modular monolith)
│   │   ├── auth/                   # Better Auth integration
│   │   │   ├── index.ts            # Auth module exports
│   │   │   ├── better-auth.ts      # Better Auth configuration
│   │   │   └── owner-guard.ts      # Owner-only access middleware
│   │   ├── transactions/           # Transaction module
│   │   │   ├── routes.ts           # Route handlers
│   │   │   ├── service.ts          # Business logic
│   │   │   └── schema.ts           # Zod schemas
│   │   ├── categories/             # Category module
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   └── schema.ts
│   │   └── dashboard/              # Dashboard module
│   │       ├── routes.ts
│   │       └── service.ts
│   ├── db/
│   │   ├── index.ts                # Drizzle connection with pooling
│   │   └── schema.ts               # Application tables
│   ├── middleware/
│   │   ├── cors.ts                 # CORS configuration
│   │   ├── logging.ts              # Request logging
│   │   ├── rate-limit.ts           # Rate limiting
│   │   └── error-handler.ts        # Global error handling
│   ├── lib/
│   │   ├── response.ts             # Standardized API responses
│   │   └── currency.ts             # Currency conversion utilities
│   └── index.ts                    # Hono app entry point
├── drizzle/
│   └── migrations/                 # Database migrations
├── .oxlintrc.json                  # oxlint configuration
├── .oxfmt.json                     # oxfmt configuration
├── bun.lockb                       # Bun lockfile
├── package.json
├── tsconfig.json
└── vercel.json
```

## Package.json

```json
{
  "name": "artha-api",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run src/db/seed.ts",
    "lint": "oxlint . --config .oxlintrc.json",
    "lint:fix": "oxlint . --config .oxlintrc.json --fix",
    "format": "oxfmt . --config .oxfmt.json",
    "format:check": "oxfmt . --config .oxfmt.json --check",
    "typecheck": "tsc --noEmit",
    "check": "bun run typecheck && bun run lint && bun run format:check",
    "ci:install": "npm ci",
    "ci:build": "npm run build",
    "ci:test": "bun test"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "better-auth": "^1.4.18",
    "drizzle-orm": "^0.45.1",
    "hono": "^4.11.7",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "drizzle-kit": "^0.30.0",
    "oxlint": "^0.15.0",
    "oxfmt": "^0.1.0",
    "typescript": "^5.3.0"
  }
}
```

## oxlint Configuration

### .oxlintrc.json

```json
{
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": [
    "oxlint:recommended",
    "oxlint:typescript"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
    "no-console": ["warn", { "allow": ["error", "warn", "info"] }],
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error"
  },
  "ignorePatterns": [
    "dist/",
    "node_modules/",
    "drizzle/",
    "*.config.ts"
  ]
}
```

## oxfmt Configuration

### .oxfmt.json

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "parser": "json"
      }
    }
  ],
  "ignore": [
    "dist/",
    "node_modules/",
    "drizzle/",
    "bun.lockb"
  ]
}
```

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["node", "bun"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Vercel Configuration

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/src/index.ts"
    }
  ],
  "env": {
    "NODE_OPTIONS": "--enable-source-maps"
  }
}
```

## Better Auth Configuration

### src/modules/auth/better-auth.ts

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  
  // OAuth Providers
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
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  
  // Cookie configuration
  cookies: {
    sessionToken: {
      name: 'artha.session',
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    },
  },
});
```

### src/modules/auth/owner-guard.ts

```typescript
import { createMiddleware } from 'hono/factory';
import { auth } from './better-auth';
import { error } from '@/lib/response';

// Owner email from environment
const OWNER_EMAIL = process.env.OWNER_EMAIL!;

declare module 'hono' {
  interface ContextVariableMap {
    session: {
      user: {
        id: string;
        email: string;
        name: string;
        image?: string;
      };
      session: {
        id: string;
        token: string;
        expiresAt: Date;
      };
    };
  }
}

export const ownerOnlyMiddleware = createMiddleware(async (c, next): Promise<Response | void> => {
  // Get session from Better Auth
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  
  if (!session) {
    return error(c, 'UNAUTHORIZED', 'Authentication required', 401);
  }
  
  // Verify this is the owner account
  if (session.user.email !== OWNER_EMAIL) {
    return error(c, 'FORBIDDEN', 'Access restricted to owner only', 403);
  }
  
  // Store session in context
  c.set('session', session);
  
  await next();
});

// Export auth handler for Better Auth routes
export const authHandler = auth.handler;
```

### src/modules/auth/index.ts

```typescript
export { auth, authHandler } from './better-auth';
export { ownerOnlyMiddleware } from './owner-guard';
```

## Middleware Implementation

### src/middleware/cors.ts

```typescript
import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';

const allowedOrigins = [
  'https://artha.sayyidrafee.com',
  'http://localhost:5173', // Development
];

export const corsMiddleware: MiddlewareHandler = cors({
  origin: (origin): string | null => {
    if (!origin) return '*';
    if (allowedOrigins.includes(origin)) {
      return origin;
    }
    return null;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Set-Cookie'],
  maxAge: 86400,
});
```

### src/middleware/logging.ts

```typescript
import { createMiddleware } from 'hono/factory';

export const loggingMiddleware = createMiddleware(async (c, next): Promise<void> => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  
  console.log(`[${new Date().toISOString()}] ${method} ${path} - Started`);
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  
  console.log(`[${new Date().toISOString()}] ${method} ${path} - ${status} (${duration}ms)`);
});
```

### src/middleware/rate-limit.ts

```typescript
import { createMiddleware } from 'hono/factory';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function rateLimit(options: RateLimitOptions) {
  return createMiddleware(async (c, next): Promise<Response | void> => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    const record = rateLimitStore.get(ip);
    
    if (!record || record.resetTime < now) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
    } else if (record.count >= options.maxRequests) {
      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again later',
        },
      }, 429);
    } else {
      record.count++;
    }
    
    await next();
  });
}

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 5,
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100,
});
```

### src/middleware/error-handler.ts

```typescript
import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c): Response => {
  console.error('Unhandled error:', err);
  
  if (err instanceof Error) {
    if (err.message.includes('unique constraint')) {
      return c.json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
        },
      }, 409);
    }
  }
  
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  }, 500);
};
```

## Utility Libraries

### src/lib/response.ts

```typescript
import type { Context } from 'hono';
import type { PaginationMeta } from '@/schemas/common';

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function success<T>(
  c: Context,
  data: T,
  meta?: PaginationMeta,
  status = 200
): Response {
  const response: SuccessResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  return c.json(response, status);
}

export function error(
  c: Context,
  code: string,
  message: string,
  status = 400,
  details?: unknown
): Response {
  const response: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  if (details) response.error.details = details;
  return c.json(response, status);
}
```

### src/lib/currency.ts

```typescript
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}
```

## Module Example: Transactions

### src/modules/transactions/schema.ts

```typescript
import { z } from 'zod';

export const transactionTypeSchema = z.enum(['income', 'expense']);

export const createTransactionSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount is too large'),
  description: z.string().min(1).max(500),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  categoryId: z.string().uuid().optional(),
  type: transactionTypeSchema.optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
```

### src/modules/transactions/service.ts

```typescript
import { db } from '@/db';
import { transactions, categories } from '@/db/schema';
import { eq, and, desc, gte, lte, count } from 'drizzle-orm';
import { dollarsToCents } from '@/lib/currency';
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
} from './schema';

interface TransactionWithCategory {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryType: 'income' | 'expense';
  amountCents: number;
  description: string;
  transactionDate: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionsResult {
  data: TransactionWithCategory[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getTransactions(
  filters: TransactionFilter
): Promise<TransactionsResult> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;
  
  const conditions = [];
  
  if (filters.startDate) conditions.push(gte(transactions.transactionDate, filters.startDate));
  if (filters.endDate) conditions.push(lte(transactions.transactionDate, filters.endDate));
  if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [{ count: total }] = await db
    .select({ count: count() })
    .from(transactions)
    .where(whereClause);
  
  const data = await db
    .select({
      id: transactions.id,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryType: categories.type,
      amountCents: transactions.amountCents,
      description: transactions.description,
      transactionDate: transactions.transactionDate,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(whereClause)
    .orderBy(desc(transactions.transactionDate))
    .limit(limit)
    .offset(offset);
  
  return {
    data,
    meta: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<typeof transactions.$inferSelect> {
  const amountCents = dollarsToCents(input.amount);
  
  const [transaction] = await db
    .insert(transactions)
    .values({
      categoryId: input.categoryId,
      amountCents,
      description: input.description,
      transactionDate: input.transactionDate,
    })
    .returning();
  
  return transaction;
}

export async function getTransactionById(
  id: string
): Promise<TransactionWithCategory | undefined> {
  const [transaction] = await db
    .select({
      id: transactions.id,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryType: categories.type,
      amountCents: transactions.amountCents,
      description: transactions.description,
      transactionDate: transactions.transactionDate,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.id, id))
    .limit(1);
  
  return transaction;
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput
): Promise<typeof transactions.$inferSelect | undefined> {
  const updates: Partial<typeof transactions.$inferInsert> = {};
  
  if (input.categoryId) updates.categoryId = input.categoryId;
  if (input.amount) updates.amountCents = dollarsToCents(input.amount);
  if (input.description) updates.description = input.description;
  if (input.transactionDate) updates.transactionDate = input.transactionDate;
  
  const [transaction] = await db
    .update(transactions)
    .set(updates)
    .where(eq(transactions.id, id))
    .returning();
  
  return transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.delete(transactions).where(eq(transactions.id, id));
}
```

### src/modules/transactions/routes.ts

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ownerOnlyMiddleware } from '@/modules/auth';
import { success, error } from '@/lib/response';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
} from './schema';
import * as service from './service';

const app = new Hono();

// All routes require owner authentication
app.use(ownerOnlyMiddleware);

// GET /transactions
app.get('/', zValidator('query', transactionFilterSchema), async (c): Promise<Response> => {
  const filters = c.req.valid('query');
  const result = await service.getTransactions(filters);
  return success(c, result.data, result.meta);
});

// POST /transactions
app.post('/', zValidator('json', createTransactionSchema), async (c): Promise<Response> => {
  const input = c.req.valid('json');
  const transaction = await service.createTransaction(input);
  return success(c, transaction, undefined, 201);
});

// GET /transactions/:id
app.get('/:id', async (c): Promise<Response> => {
  const id = c.req.param('id');
  const transaction = await service.getTransactionById(id);
  
  if (!transaction) {
    return error(c, 'NOT_FOUND', 'Transaction not found', 404);
  }
  
  return success(c, transaction);
});

// PUT /transactions/:id
app.put('/:id', zValidator('json', updateTransactionSchema), async (c): Promise<Response> => {
  const id = c.req.param('id');
  const input = c.req.valid('json');
  const transaction = await service.updateTransaction(id, input);
  return success(c, transaction);
});

// DELETE /transactions/:id
app.delete('/:id', async (c): Promise<Response> => {
  const id = c.req.param('id');
  await service.deleteTransaction(id);
  return success(c, null);
});

export default app;
```

## Main App Entry

### src/index.ts

```typescript
import { Hono } from 'hono';
import { corsMiddleware } from '@/middleware/cors';
import { loggingMiddleware } from '@/middleware/logging';
import { apiRateLimit, authRateLimit } from '@/middleware/rate-limit';
import { errorHandler } from '@/middleware/error-handler';
import { authHandler } from '@/modules/auth';

// Import module routes
import transactionRoutes from '@/modules/transactions/routes';
import categoryRoutes from '@/modules/categories/routes';
import dashboardRoutes from '@/modules/dashboard/routes';

const app = new Hono().basePath('/api');

// Global middleware
app.use(corsMiddleware);
app.use(loggingMiddleware);

// Better Auth routes (with rate limiting)
app.use('/auth/*', authRateLimit);
app.on(['POST', 'GET'], '/auth/*', (c): Promise<Response> => authHandler(c.req.raw));

// Protected API routes
app.use('/transactions/*', apiRateLimit);
app.route('/transactions', transactionRoutes);

app.use('/categories/*', apiRateLimit);
app.route('/categories', categoryRoutes);

app.use('/dashboard/*', apiRateLimit);
app.route('/dashboard', dashboardRoutes);

// Error handling
app.onError(errorHandler);

// Health check
app.get('/health', (c): Response => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
```

## Environment Variables

### .env.local

```bash
# Database
DATABASE_URL="postgresql://user:pass@neon-host/db?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-better-auth-secret-min-32-characters"
BETTER_AUTH_URL="https://artha.sayyidrafee.com/api"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Owner Configuration
OWNER_EMAIL="owner@sayyidrafee.com"

# CORS
FRONTEND_URL="https://artha.sayyidrafee.com"

# Rate Limiting (Upstash Redis optional)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

## Development Workflow with Bun

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies with Bun
bun install
```

### Development Commands

```bash
# Start development server with hot reload
bun run dev

# Run database migrations
bun run db:migrate

# Seed default categories
bun run db:seed

# Run linter
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Check formatting
bun run format:check

# Type check
bun run typecheck

# Run all checks
bun run check
```

### Production Commands (npm)

```bash
# Install dependencies (CI/production)
npm ci

# Build for production
npm run build

# Start production server
npm start
```

## CI/CD Pipeline (GitHub Actions)

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run oxlint
        run: bun run lint
      
      - name: Check formatting
        run: bun run format:check
      
      - name: Type check
        run: bun run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests
        run: bun test
```

## IDE Configuration

### VS Code Settings (.vscode/settings.json)

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.oxlint": "explicit"
  },
  "oxlint.enable": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### VS Code Extensions

- **oxc.oxc-vscode**: oxlint and oxfmt support
- **bradlc.vscode-tailwindcss**: Tailwind CSS IntelliSense
- **dbaeumer.vscode-eslint**: Disabled (replaced by oxlint)

## Cold Start Optimizations

1. **Lazy Loading**: Import heavy dependencies only when needed
2. **Connection Pooling**: Reuse database connections via Neon
3. **Lean Global Scope**: Minimize top-level code execution
4. **Better Auth**: Efficient session validation

Example:
```typescript
// Lazy load for cold start optimization
const heavyOperation = async (): Promise<void> => {
  const { heavyModule } = await import('./heavy-module');
  return heavyModule.process();
};
```

## Key Differences from npm-based Setup

1. **Bun for Development**: Faster installs, faster dev server, built-in test runner
2. **npm for Production**: Vercel uses npm for builds, standard Node.js runtime
3. **oxlint over ESLint**: Faster linting, strict TypeScript rules
4. **oxfmt over Prettier**: Faster formatting, consistent style
5. **bun.lockb**: Binary lockfile for reproducible installs
