import { db } from '@/db';
import { transactions, categories } from '@/db/schema';
import type { CreateTransactionInput, UpdateTransactionInput, Transaction } from './schema';
import type { TransactionFilter } from './schema';
import { dollarsToCents } from '@/lib/currency';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

export class TransactionService {
  /**
   * Get transactions with pagination and filters
   */
  async list(filter: TransactionFilter): Promise<{ data: Transaction[]; total: number }> {
    const { page, limit, startDate, endDate, categoryId, type } = filter;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (startDate) {
      conditions.push(gte(transactions.transactionDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(transactions.transactionDate, endDate));
    }

    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }

    if (type) {
      conditions.push(eq(categories.type, type));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(transactions.transactionDate))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    return { data, total };
  }

  /**
   * Get a single transaction by ID
   */
  async getById(id: string): Promise<Transaction | null> {
    const result = await db
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
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Create a new transaction
   */
  async create(input: CreateTransactionInput): Promise<Transaction> {
    const amountCents = dollarsToCents(input.amount);

    const result = await db
      .insert(transactions)
      .values({
        categoryId: input.categoryId,
        amountCents,
        description: input.description,
        transactionDate: input.transactionDate,
      })
      .returning();

    const created = result[0];

    // Fetch with category details
    const withCategory = await this.getById(created.id);
    if (!withCategory) {
      throw new Error('Failed to create transaction');
    }

    return withCategory;
  }

  /**
   * Update a transaction
   */
  async update(id: string, input: UpdateTransactionInput): Promise<Transaction | null> {
    const updateData: Record<string, unknown> = {};

    if (input.amount !== undefined) {
      updateData.amountCents = dollarsToCents(input.amount);
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.transactionDate !== undefined) {
      updateData.transactionDate = input.transactionDate;
    }
    if (input.categoryId !== undefined) {
      updateData.categoryId = input.categoryId;
    }

    const result = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return this.getById(id);
  }

  /**
   * Delete a transaction
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning();

    return result.length > 0;
  }
}

export const transactionService = new TransactionService();
