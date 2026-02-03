/**
 * Currency conversion utilities
 * All monetary values are stored as integer cents in the database
 */

/**
 * Convert dollars to cents for storage
 * @param dollars - The dollar amount (e.g., 25.99)
 * @returns The amount in cents (e.g., 2599)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Convert cents to dollars for display
 * @param cents - The amount in cents (e.g., 2599)
 * @returns The dollar amount (e.g., 25.99)
 */
export function centsToDollars(cents: number): number {
  return cents / 100
}

/**
 * Format cents as a currency string
 * @param cents - The amount in cents (e.g., 2599)
 * @param currency - The currency code (default: 'USD')
 * @returns Formatted currency string (e.g., '$25.99')
 */
export function formatCurrency(
  cents: number,
  currency: string = "USD",
): string {
  const dollars = centsToDollars(cents)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(dollars)
}
