# Artha Database Schema - Drizzle ORM Definitions

## Overview

Artha uses **Better Auth** for authentication (which manages its own tables) and custom tables for application data. The database is designed for **single-owner access** - no `user_id` foreign keys are needed on application tables.

## Schema Files Structure

```
artha-api/src/db/
├── index.ts           # Database connection with pooling
├── schema.ts          # Application tables (categories, transactions)
└── migrations/        # Generated migration files

Note: Better Auth tables are auto-managed by the library
```

## Better Auth Tables (Auto-Managed)

Better Auth automatically creates and manages these tables:

### user
| Column | Type | Description |
|--------|------|-------------|
| id | string (cuid) | Primary key |
| email | string | Unique, owner email |
| name | string | Owner name |
| image | string | Avatar URL (from OAuth) |
| emailVerified | timestamp | Email verification date |
| createdAt | timestamp | Account creation |
| updatedAt | timestamp | Last update |

### session
| Column | Type | Description |
|--------|------|-------------|
| id | string (cuid) | Primary key |
| userId | string | FK to user.id |
| token | string | Unique session token |
| expiresAt | timestamp | Session expiration |
| ipAddress | string | Client IP |
| userAgent | string | Client user agent |
| createdAt | timestamp | Session creation |
| updatedAt | timestamp | Last update |

### account
| Column | Type | Description |
|--------|------|-------------|
| id | string (cuid) | Primary key |
| userId | string | FK to user.id |
| accountId | string | Provider account ID |
| providerId | string | OAuth provider (github, google) |
| accessToken | string | OAuth access token |
| refreshToken | string | OAuth refresh token |
| idToken | string | OIDC ID token |
| accessTokenExpiresAt | timestamp | Token expiration |
| refreshTokenExpiresAt | timestamp | Refresh token expiration |
| scope | string | OAuth scopes |
| password | string | Hashed password (if using email/pass) |
| createdAt | timestamp | Account creation |
| updatedAt | timestamp | Last update |

### verification
| Column | Type | Description |
|--------|------|-------------|
| id | string (cuid) | Primary key |
| identifier | string | Verification identifier |
| value | string | Verification value/token |
| expiresAt | timestamp | Expiration time |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |

## Application Schema (Drizzle ORM)

### schema.ts

```typescript
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
// Note: No user_id - single owner system
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Transactions Table
// Note: No user_id - single owner system
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  amountCents: integer('amount_cents').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // For date range filtering and sorting
  dateIdx: index('idx_transactions_date').on(table.transactionDate),
  // Composite index for dashboard queries
  dateCategoryIdx: index('idx_transactions_date_category').on(table.transactionDate, table.categoryId),
  // For category lookups
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

## Database Connection with Pooling

### index.ts

```typescript
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

// Connection pooling for serverless environment
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout for new connections
});

export const db = drizzle(pool, { schema });

// Graceful shutdown for pool
process.on('beforeExit', async () => {
  await pool.end();
});

// Export schema for use in migrations
export { schema };
```

## Drizzle Configuration

### drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

## Migration Commands

```bash
# Generate migration for application tables
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Push schema changes (development only)
npx drizzle-kit push

# Studio (visual database management)
npx drizzle-kit studio
```

## Better Auth Migration

Better Auth manages its own tables. Run this once after setup:

```bash
# Better Auth will auto-create its tables on first run
# Or use the CLI if available
npx @better-auth/cli migrate
```

## Seed Data

### seed.ts

```typescript
import { db } from './index';
import { categories } from './schema';

const defaultCategories = [
  // Income categories
  { name: 'Salary', type: 'income' as const },
  { name: 'Freelance', type: 'income' as const },
  { name: 'Investment', type: 'income' as const },
  { name: 'Gift', type: 'income' as const },
  { name: 'Other Income', type: 'income' as const },
  
  // Expense categories
  { name: 'Food & Dining', type: 'expense' as const },
  { name: 'Transportation', type: 'expense' as const },
  { name: 'Utilities', type: 'expense' as const },
  { name: 'Entertainment', type: 'expense' as const },
  { name: 'Healthcare', type: 'expense' as const },
  { name: 'Shopping', type: 'expense' as const },
  { name: 'Education', type: 'expense' as const },
  { name: 'Housing', type: 'expense' as const },
  { name: 'Other Expense', type: 'expense' as const },
];

async function seed() {
  console.log('Seeding categories...');
  
  for (const category of defaultCategories) {
    await db.insert(categories).values(category).onConflictDoNothing();
  }
  
  console.log('Categories seeded successfully!');
  console.log('Note: Owner account should be created via OAuth sign-in');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
```

## Raw SQL for Reference

### Application Tables
```sql
-- Create transaction_type enum
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type transaction_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    description VARCHAR(500) NOT NULL,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_date_category ON transactions(transaction_date, category_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);

-- Insert default categories
INSERT INTO categories (name, type) VALUES
    ('Salary', 'income'),
    ('Freelance', 'income'),
    ('Investment', 'income'),
    ('Gift', 'income'),
    ('Other Income', 'income'),
    ('Food & Dining', 'expense'),
    ('Transportation', 'expense'),
    ('Utilities', 'expense'),
    ('Entertainment', 'expense'),
    ('Healthcare', 'expense'),
    ('Shopping', 'expense'),
    ('Education', 'expense'),
    ('Housing', 'expense'),
    ('Other Expense', 'expense');
```

### Better Auth Tables (for reference)
```sql
-- Better Auth creates these automatically
-- user, session, account, verification tables
```

## Index Strategy

| Index Name | Columns | Purpose |
|------------|---------|---------|
| idx_transactions_date | transaction_date | Date range filtering |
| idx_transactions_date_category | transaction_date, category_id | Dashboard aggregations |
| idx_transactions_category_id | category_id | Category lookups |

## Key Differences from Multi-User Design

1. **No user_id columns**: Application tables don't track ownership
2. **No user-scoped queries**: All queries are global (single owner)
3. **Simplified authorization**: Owner check happens at auth layer, not data layer
4. **No user management**: No need for user CRUD operations

## Environment Variables

```bash
# Required for Drizzle
DATABASE_URL="postgresql://user:password@neon-host/db?sslmode=require"
```
