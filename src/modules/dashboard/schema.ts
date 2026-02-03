import { z } from "zod"

// Dashboard date range filter
export const dashboardFilterSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
})

// Monthly summary response
export const monthlySummarySchema = z.object({
  year: z.number().int(),
  month: z.number().int().optional(),
  incomeCents: z.number().int(),
  expenseCents: z.number().int(),
  balanceCents: z.number().int(),
})

// Category aggregation item
export const categoryAggregationSchema = z.object({
  categoryId: z.string().uuid().nullable(),
  categoryName: z.string().nullable(),
  type: z.enum(["income", "expense"]).nullable(),
  totalCents: z.number().int(),
  transactionCount: z.number().int(),
})

// Dashboard by-category response
export const dashboardByCategorySchema = z.object({
  year: z.number().int(),
  month: z.number().int().optional(),
  income: z.array(categoryAggregationSchema),
  expense: z.array(categoryAggregationSchema),
})

// Types
export type DashboardFilter = z.infer<typeof dashboardFilterSchema>
export type MonthlySummary = z.infer<typeof monthlySummarySchema>
export type CategoryAggregation = z.infer<typeof categoryAggregationSchema>
export type DashboardByCategory = z.infer<typeof dashboardByCategorySchema>
