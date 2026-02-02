import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  date,
  index,
  pgEnum,
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
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    amountCents: integer('amount_cents').notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    transactionDate: date('transaction_date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // For date range filtering and sorting
    dateIdx: index('idx_transactions_date').on(table.transactionDate),
    // Composite index for dashboard queries
    dateCategoryIdx: index('idx_transactions_date_category').on(
      table.transactionDate,
      table.categoryId,
    ),
    // For category lookups
    categoryIdIdx: index('idx_transactions_category_id').on(table.categoryId),
  }),
);

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
