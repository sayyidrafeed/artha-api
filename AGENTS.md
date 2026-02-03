> ⚠️ **MANDATORY DIRECTIVE FOR AI ASSISTANTS**
> 
> **ALWAYS CHECK Context7 MCP server to get the latest documentation for libraries** before implementing any code changes. This includes but is not limited to: Hono, Better Auth, Drizzle ORM, Zod, and any other dependencies.

---

# Artha Backend - AI Assistant Guidelines

**Repository**: artha-api  
**Framework**: Hono 4.11.7 on Vercel Functions  
**Runtime**: Bun (development and production)  
**Authentication**: Better Auth 1.4.18 (owner-only)  
**Database**: Neon PostgreSQL with Drizzle ORM 0.45.1

## Critical Constraints

### Owner-Only Access (NON-NEGOTIABLE)
- **NO PUBLIC REGISTRATION**: There is no `/auth/register` endpoint
- **Owner Verification Required**: All protected endpoints must verify `OWNER_EMAIL`
- **Single User System**: No `user_id` columns in application tables
- **OAuth Only**: GitHub and Google OAuth are the primary authentication methods

### Security Requirements
- All inputs MUST be validated with Zod schemas
- All endpoints (except auth callbacks) MUST use `ownerOnlyMiddleware`
- Session cookies MUST be httpOnly, Secure, SameSite=Strict
- Rate limiting: 5 req/min for auth, 100 req/min for API

## Code Style Enforcement

### oxlint Rules (MANDATORY)
All code MUST pass oxlint with the following strict rules:

```json
{
  "@typescript-eslint/explicit-function-return-type": "error",
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  "@typescript-eslint/strict-boolean-expressions": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/await-thenable": "error",
  "@typescript-eslint/prefer-nullish-coalescing": "error",
  "@typescript-eslint/prefer-optional-chain": "error",
  "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
  "no-console": ["warn", { "allow": ["error", "warn", "info"] }],
  "no-debugger": "error",
  "prefer-const": "error",
  "no-var": "error"
}
```

### oxfmt Formatting (MANDATORY)
All code MUST be formatted with oxfmt:

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
  "endOfLine": "lf"
}
```

### Pre-commit Hooks (Husky)
Linting and formatting are enforced via husky pre-commit hook:
- `bun run typecheck` - TypeScript type checking
- `bun run lint` - oxlint linting
- `bun run format:check` - oxfmt format verification

These run automatically before every commit. Manual runs:
```bash
bun run check  # Run all checks
bun run lint:fix  # Auto-fix lint issues
bun run format  # Auto-format code
```

## Project Structure

```
artha-api/
├── src/
│   ├── modules/              # Feature modules (modular monolith)
│   │   ├── auth/            # Better Auth + owner guard
│   │   ├── transactions/    # Transaction CRUD
│   │   ├── categories/      # Category CRUD
│   │   └── dashboard/       # Aggregations
│   ├── db/
│   │   ├── index.ts         # Drizzle connection
│   │   └── schema.ts        # Application tables
│   ├── middleware/
│   │   ├── owner-only.ts    # Owner verification
│   │   ├── cors.ts
│   │   ├── logging.ts
│   │   ├── rate-limit.ts
│   │   └── error-handler.ts
│   ├── lib/
│   │   ├── response.ts      # Standardized responses
│   │   └── currency.ts      # Currency conversion
│   └── index.ts             # Hono app entry
├── .husky/
│   └── pre-commit           # Pre-commit hook
├── .oxlintrc.json
├── .oxfmt.json
├── vercel.json              # Minimal Vercel config
└── package.json
```

## Module Boundaries

### Auth Module (`src/modules/auth/`)
**Responsibilities:**
- Better Auth configuration
- Owner-only middleware
- OAuth provider setup

**Exports:**
- `auth` - Better Auth instance
- `authHandler` - Route handler
- `ownerOnlyMiddleware` - Owner verification

**MUST NOT:**
- Handle business logic
- Directly query application tables

### Transaction Module (`src/modules/transactions/`)
**Responsibilities:**
- Transaction CRUD operations
- Transaction filtering and pagination

**Files:**
- `routes.ts` - Hono routes
- `service.ts` - Business logic
- `schema.ts` - Zod schemas

**MUST:**
- Use `ownerOnlyMiddleware`
- Validate all inputs with Zod
- Return standardized responses

### Category Module (`src/modules/categories/`)
**Responsibilities:**
- Category CRUD operations
- Category listing

**Files:**
- `routes.ts`
- `service.ts`
- `schema.ts`

### Dashboard Module (`src/modules/dashboard/`)
**Responsibilities:**
- Monthly summary aggregations
- Category breakdown aggregations
- SQL GROUP BY queries

**Files:**
- `routes.ts`
- `service.ts`

## API Contract Patterns

### Standard Response Format

**Success:**
```typescript
{
  success: true,
  data: T,
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

**Error:**
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_ERROR';
    message: string;
    details?: unknown;
  }
}
```

### Route Handler Pattern

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ownerOnlyMiddleware } from '@/modules/auth';
import { success, error } from '@/lib/response';
import { someSchema } from './schema';
import * as service from './service';

const app = new Hono();

// ALWAYS apply owner-only middleware
app.use(ownerOnlyMiddleware);

// ALWAYS validate inputs
app.get('/', zValidator('query', someSchema), async (c): Promise<Response> => {
  const input = c.req.valid('query');
  const result = await service.someOperation(input);
  return success(c, result.data, result.meta);
});

export default app;
```

### Service Layer Pattern

```typescript
import { db } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import type { SomeInput } from './schema';

interface SomeResult {
  data: SomeType[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function someOperation(input: SomeInput): Promise<SomeResult> {
  // Implementation
}
```

## Import Patterns

### Import Paths (ALLOWED)
Prefer `@/` alias for internal imports when a bundler resolves aliases at build time.
Relative imports are allowed when the runtime cannot resolve aliases.

```typescript
// CORRECT (alias-based)
import { ownerOnlyMiddleware } from '@/modules/auth';
import { db } from '@/db';
import { success, error } from '@/lib/response';
import type { Transaction } from '@/schemas/transaction';

// CORRECT (relative)
import { ownerOnlyMiddleware } from '../auth';
import { db } from '../../db';
import { success, error } from '../../lib/response';
```

### Type Imports (MANDATORY)
Use `type` keyword for type-only imports:

```typescript
// CORRECT
import type { Context } from 'hono';
import type { Transaction } from '@/schemas/transaction';

// INCORRECT
import { Context } from 'hono'; // if only using as type
```

## Error Handling Standards

### Service Layer Errors
```typescript
export async function getTransactionById(id: string): Promise<Transaction | undefined> {
  try {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    
    return transaction;
  } catch (error) {
    console.error('Failed to fetch transaction:', error);
    throw new Error('Failed to fetch transaction');
  }
}
```

### Route Layer Errors
```typescript
app.get('/:id', async (c): Promise<Response> => {
  try {
    const id = c.req.param('id');
    const transaction = await service.getTransactionById(id);
    
    if (!transaction) {
      return error(c, 'NOT_FOUND', 'Transaction not found', 404);
    }
    
    return success(c, transaction);
  } catch (err) {
    console.error('Error fetching transaction:', err);
    return error(c, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});
```

## Environment Variable Management

### Required Variables
```bash
# Database (REQUIRED)
DATABASE_URL="postgresql://user:pass@neon-host/db?sslmode=require"

# Better Auth (REQUIRED)
BETTER_AUTH_SECRET="min-32-characters"
BETTER_AUTH_URL="https://artha.sayyidrafee.com/api"

# OAuth Providers (REQUIRED)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Owner Configuration (CRITICAL)
OWNER_EMAIL="owner@sayyidrafee.com"

# CORS (REQUIRED)
FRONTEND_URL="https://artha.sayyidrafee.com"
```

### Access Pattern
```typescript
const OWNER_EMAIL = process.env.OWNER_EMAIL!;

if (!OWNER_EMAIL) {
  throw new Error('OWNER_EMAIL environment variable is required');
}
```

## Database Patterns

### No user_id in Application Tables
```typescript
// CORRECT - No user_id
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  // ...
});

// INCORRECT - Do not add user_id
userId: uuid('user_id').notNull(), // FORBIDDEN
```

### Currency Handling
```typescript
// Store as cents (integer)
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Never store floating point in DB
const amountCents = dollarsToCents(25.99); // 2599
```

## Deployment (Vercel)

### Zero-Config Deployment
This project uses Vercel's auto-detection with Bun:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x"
}
```

**How it works:**
1. Vercel detects `bun.lockb` → runs `bun install`
2. Vercel finds `src/index.ts` exporting Hono app → runs as Vercel Function
3. `bunVersion: "1.x"` → Runs with Bun runtime (not Node.js)

**No build step required** - Vercel runs TypeScript directly.

### Environment Variables in Vercel
- All environment variables MUST be set in Vercel dashboard
- `NODE_ENV` is automatically set to "production"
- `VERCEL_URL` is available for dynamic URLs

### Database Migrations
Migrations are handled separately from deployments:
```bash
# Generate migration from schema changes
bun run db:generate

# Push schema to database (development)
bun run db:push

# Run migrations (production)
bun run db:migrate
```

**Best Practice**: Run migrations manually or via a separate CI job before deploying new code that depends on schema changes.

## Testing Requirements

### Before Committing
Pre-commit hook automatically runs:
1. `bun run typecheck` - TypeScript compilation check
2. `bun run lint` - oxlint linting
3. `bun run format:check` - oxfmt formatting check

### Manual Testing
Test critical paths manually before pushing.

## File Naming Conventions

- **Routes**: `routes.ts`
- **Services**: `service.ts`
- **Schemas**: `schema.ts`
- **Middleware**: `kebab-case.ts` (e.g., `owner-only.ts`)
- **Libraries**: `kebab-case.ts` (e.g., `response.ts`)
- **Types**: PascalCase in dedicated files or inline

## Prohibited Patterns

### NEVER DO:
1. Create a registration endpoint
2. Add `user_id` to application tables
3. Use `any` type
4. Skip Zod validation
5. Skip explicit return types on exported functions
6. Use `console.log` in production (use `console.info` or `console.error`)
7. Expose stack traces in production errors

## AI Assistant Checklist

Before generating any code:
- [ ] Is this for owner-only access?
- [ ] Are all inputs validated with Zod?
- [ ] Are explicit return types provided?
- [ ] Are type imports marked with `type`?
- [ ] Are import paths aligned with repo rules (alias or relative)?
- [ ] Does it follow the module boundary rules?
- [ ] Will it pass oxlint?
- [ ] Will it pass oxfmt?
