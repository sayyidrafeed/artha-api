> ⚠️ **MANDATORY DIRECTIVE FOR AI ASSISTANTS**
> 
> **ALWAYS CHECK Context7 MCP server to get the latest documentation for libraries** before implementing any code changes. This includes but is not limited to: Hono, Better Auth, Drizzle ORM, Zod, and any other dependencies.

---

# Artha Backend - Single Source of Truth

**Repository**: artha-api  
**Last Updated**: 2024-01-15  
**Version**: 1.0.0

## Domain Models

### User (Better Auth Managed)

The User entity is managed by Better Auth. Application code should not modify these tables directly.

```typescript
interface User {
  id: string;                    // CUID primary key
  email: string;                 // Unique, owner email
  name: string;                  // Display name
  image?: string;                // Avatar URL from OAuth
  emailVerified: boolean;        // Must be true for access
  createdAt: Date;
  updatedAt: Date;
}
```

**Constraints:**
- Only ONE user record exists (owner-only system)
- Email MUST match `OWNER_EMAIL` environment variable
- Created via OAuth sign-in (GitHub or Google)

### Session (Better Auth Managed)

```typescript
interface Session {
  id: string;                    // CUID primary key
  userId: string;                // FK to user.id
  token: string;                 // Unique session token
  expiresAt: Date;               // 7 days from creation
  ipAddress?: string;            // Client IP
  userAgent?: string;            // Client user agent
  createdAt: Date;
  updatedAt: Date;
}
```

**Constraints:**
- Session cookie: httpOnly, Secure, SameSite=Strict
- Expires in 7 days
- Single active session per owner

### Account (Better Auth Managed)

```typescript
interface Account {
  id: string;                    // CUID primary key
  userId: string;                // FK to user.id
  accountId: string;             // Provider account ID
  providerId: 'github' | 'google'; // OAuth provider
  accessToken?: string;          // OAuth access token
  refreshToken?: string;         // OAuth refresh token
  idToken?: string;              // OIDC ID token
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  password?: string;             // Hashed password (dev only)
  createdAt: Date;
  updatedAt: Date;
}
```

**Constraints:**
- One account per OAuth provider
- Password field only used in development

### Transaction (Application)

```typescript
interface Transaction {
  id: string;                    // UUID primary key
  categoryId: string;            // FK to categories.id
  amountCents: number;           // Positive integer (cents)
  description: string;           // Max 500 chars
  transactionDate: string;       // YYYY-MM-DD format
  createdAt: Date;
  updatedAt: Date;
}

// API Response includes category info
interface TransactionResponse {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryType: 'income' | 'expense';
  amountCents: number;
  description: string;
  transactionDate: string;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

**Constraints:**
- `amountCents` MUST be positive integer
- `transactionDate` format: YYYY-MM-DD
- No `user_id` (owner-only system)
- Category cannot be deleted if transactions exist

### Category (Application)

```typescript
interface Category {
  id: string;                    // UUID primary key
  name: string;                  // Max 100 chars
  type: 'income' | 'expense';    // Enum
  createdAt: Date;
}

// API Response
interface CategoryResponse {
  id: string;
  name: string;
  type: 'income' | 'expense';
  createdAt: string;             // ISO 8601
}
```

**Constraints:**
- Name must be unique per type
- Cannot delete category with transactions
- No `user_id` (owner-only system)

### Budget (Future Expansion)

```typescript
interface Budget {
  id: string;                    // UUID primary key
  categoryId: string;            // FK to categories.id
  amountCents: number;           // Monthly budget amount
  alertThreshold: number;        // Percentage (0-100)
  year: number;
  month: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Status**: Not yet implemented

## Authentication Flows

### Owner-Only Access Model

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Owner     │────▶│  OAuth      │────▶│  GitHub/    │
│   (Human)   │◄────│  Provider   │◄────│  Google     │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │ Redirect with code
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Artha     │────▶│  Better     │────▶│  Database   │
│   API       │◄────│  Auth       │◄────│  (Session)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │ Session cookie set
       ▼
┌─────────────┐
│   Owner     │
│   Guard     │───▶ Verify email === OWNER_EMAIL
│   Middleware│
└─────────────┘
```

### Flow Steps

1. **Initiate OAuth**
   - Endpoint: `GET /api/auth/signin/github` or `/api/auth/signin/google`
   - Redirects to OAuth provider

2. **OAuth Callback**
   - Endpoint: `GET /api/auth/callback/:provider`
   - Exchanges code for tokens
   - Creates/updates user record
   - Sets session cookie

3. **Owner Verification**
   - Middleware: `ownerOnlyMiddleware`
   - Checks `session.user.email === OWNER_EMAIL`
   - Returns 403 if not owner

4. **Session Validation**
   - Endpoint: `GET /api/auth/session`
   - Returns current session or null

### No Registration Flow

**PROHIBITED:**
- No `/api/auth/register` endpoint
- No email verification flow
- No password reset flow (use OAuth)
- No invite system

**ALLOWED:**
- OAuth sign-in only
- Manual user creation via database (for initial setup)

## Database Schema

### Better Auth Tables (Auto-Managed)

Better Auth automatically creates and manages these tables:

```sql
-- User table
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session table
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account table (OAuth connections)
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification table
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Application Tables (Drizzle ORM)

```typescript
// src/db/schema.ts

import { 
  pgTable, 
  uuid, 
  varchar, 
  integer, 
  timestamp, 
  date, 
  index,
  pgEnum 
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);

// Categories Table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Transactions Table
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  amountCents: integer('amount_cents').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dateIdx: index('idx_transactions_date').on(table.transactionDate),
  dateCategoryIdx: index('idx_transactions_date_category').on(table.transactionDate, table.categoryId),
  categoryIdIdx: index('idx_transactions_category_id').on(table.categoryId),
}));

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

// Types
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
```

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| idx_transactions_date | transaction_date | Date range filtering |
| idx_transactions_date_category | transaction_date, category_id | Dashboard aggregations |
| idx_transactions_category_id | category_id | Category lookups |

## API Endpoint Specifications

### Authentication Endpoints

#### GET /api/auth/signin/github
- **Description**: Initiate GitHub OAuth flow
- **Auth Required**: No
- **Rate Limit**: 5/min
- **Response**: Redirect to GitHub OAuth

#### GET /api/auth/signin/google
- **Description**: Initiate Google OAuth flow
- **Auth Required**: No
- **Rate Limit**: 5/min
- **Response**: Redirect to Google OAuth

#### GET /api/auth/callback/:provider
- **Description**: OAuth callback handler
- **Auth Required**: No
- **Query Params**: `code`, `state`
- **Response**: Redirect to frontend with session cookie

#### POST /api/auth/signout
- **Description**: Clear session
- **Auth Required**: Yes
- **Response**: `{ success: true }`
- **Side Effect**: Clears session cookie

#### GET /api/auth/session
- **Description**: Get current session
- **Auth Required**: No (returns null if no session)
- **Response**:
```json
{
  "session": {
    "id": "string",
    "token": "string",
    "userId": "string",
    "expiresAt": "2024-01-15T10:30:00Z"
  },
  "user": {
    "id": "string",
    "email": "owner@sayyidrafee.com",
    "name": "string",
    "image": "string"
  }
}
```

### Transaction Endpoints

#### GET /api/transactions
- **Description**: List transactions with pagination
- **Auth Required**: Yes (Owner only)
- **Query Params**:
  - `page`: number (default: 1)
  - `limit`: number (default: 20, max: 100)
  - `startDate`: string (YYYY-MM-DD)
  - `endDate`: string (YYYY-MM-DD)
  - `categoryId`: UUID
  - `type`: 'income' | 'expense'
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "categoryId": "uuid",
      "categoryName": "string",
      "categoryType": "income" | "expense",
      "amountCents": 2599,
      "description": "string",
      "transactionDate": "2024-01-15",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### POST /api/transactions
- **Description**: Create transaction
- **Auth Required**: Yes (Owner only)
- **Body**:
```json
{
  "categoryId": "uuid",
  "amount": 25.99,
  "description": "string",
  "transactionDate": "2024-01-15"
}
```
- **Response**: 201 Created with transaction object

#### GET /api/transactions/:id
- **Description**: Get single transaction
- **Auth Required**: Yes (Owner only)
- **Response**: Transaction object or 404

#### PUT /api/transactions/:id
- **Description**: Update transaction
- **Auth Required**: Yes (Owner only)
- **Body**: Partial transaction fields
- **Response**: Updated transaction object

#### DELETE /api/transactions/:id
- **Description**: Delete transaction
- **Auth Required**: Yes (Owner only)
- **Response**: `{ success: true, data: null }`

### Category Endpoints

#### GET /api/categories
- **Description**: List all categories
- **Auth Required**: Yes (Owner only)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "type": "income" | "expense",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/categories
- **Description**: Create category
- **Auth Required**: Yes (Owner only)
- **Body**:
```json
{
  "name": "string",
  "type": "income" | "expense"
}
```
- **Response**: 201 Created with category object

#### PUT /api/categories/:id
- **Description**: Update category
- **Auth Required**: Yes (Owner only)
- **Body**:
```json
{
  "name": "string"
}
```
- **Response**: Updated category object

#### DELETE /api/categories/:id
- **Description**: Delete category
- **Auth Required**: Yes (Owner only)
- **Constraints**: Cannot delete if transactions exist
- **Response**: `{ success: true, data: null }` or 400 error

### Dashboard Endpoints

#### GET /api/dashboard/summary
- **Description**: Monthly income/expense/balance summary
- **Auth Required**: Yes (Owner only)
- **Query Params**:
  - `year`: number (required)
  - `month`: number (optional, 1-12)
- **Response**:
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "incomeCents": 500000,
    "expenseCents": 325000,
    "balanceCents": 175000
  }
}
```

#### GET /api/dashboard/by-category
- **Description**: Transactions aggregated by category
- **Auth Required**: Yes (Owner only)
- **Query Params**:
  - `year`: number (required)
  - `month`: number (optional, 1-12)
- **Response**:
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "income": [
      {
        "categoryId": "uuid",
        "categoryName": "string",
        "type": "income",
        "totalCents": 500000,
        "transactionCount": 1
      }
    ],
    "expense": [
      {
        "categoryId": "uuid",
        "categoryName": "string",
        "type": "expense",
        "totalCents": 120000,
        "transactionCount": 15
      }
    ]
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Not the owner |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Input validation failed |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Default Categories (Seed Data)

### Income Categories
1. Salary
2. Freelance
3. Investment
4. Gift
5. Other Income

### Expense Categories
1. Food & Dining
2. Transportation
3. Utilities
4. Entertainment
5. Healthcare
6. Shopping
7. Education
8. Housing
9. Other Expense

## Currency Handling

### Storage
- Store as integer cents in database
- Use `Math.round(dollars * 100)` for conversion

### Display
- Convert to dollars: `cents / 100`
- Format with `Intl.NumberFormat`

### Example
```typescript
// Input: $50.99
const amountCents = Math.round(50.99 * 100); // 5099

// Display
const display = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(5099 / 100); // "$50.99"
```

## Environment Variables

### Required
```bash
DATABASE_URL              # Neon PostgreSQL connection
BETTER_AUTH_SECRET        # Min 32 characters
BETTER_AUTH_URL           # https://artha.sayyidrafee.com/api
GITHUB_CLIENT_ID          # OAuth app ID
GITHUB_CLIENT_SECRET      # OAuth app secret
OWNER_EMAIL               # Owner email address
FRONTEND_URL              # https://artha.sayyidrafee.com
```

### Optional
```bash
GOOGLE_CLIENT_ID          # Google OAuth (optional)
GOOGLE_CLIENT_SECRET      # Google OAuth (optional)
UPSTASH_REDIS_REST_URL    # Rate limiting (optional)
UPSTASH_REDIS_REST_TOKEN  # Rate limiting (optional)
```

## File Locations

| Purpose | Path |
|---------|------|
| Auth config | `src/modules/auth/better-auth.ts` |
| Owner guard | `src/modules/auth/owner-guard.ts` |
| Transaction routes | `src/modules/transactions/routes.ts` |
| Transaction service | `src/modules/transactions/service.ts` |
| Category routes | `src/modules/categories/routes.ts` |
| Dashboard routes | `src/modules/dashboard/routes.ts` |
| Database schema | `src/db/schema.ts` |
| Database connection | `src/db/index.ts` |
| Response helpers | `src/lib/response.ts` |
| Currency utils | `src/lib/currency.ts` |
| Shared schemas | `src/schemas/*.ts` |
