/**
 * Currency conversion utilities for IDR (Indonesian Rupiah)
 * All monetary values are stored as integer Rupiah in the database
 * IDR has no decimal places (0 minor units)
 */

export const IDR_LOCALE = "id-ID"
export const IDR_CURRENCY = "IDR"

/**
 * Convert user input (decimal) to IDR integer for storage
 * IDR has no minor units, so we round to nearest integer
 * @param amount - The amount from user input (e.g., 150000.50)
 * @returns The amount as integer (e.g., 150001)
 */
export function toRupiah(amount: number): number {
  return Math.round(amount)
}

/**
 * Convert IDR integer to display value (for compatibility with existing code)
 * Since IDR has no decimals, this returns the same value
 * @param rupiah - The amount in IDR (e.g., 150000)
 * @returns The same amount (e.g., 150000)
 */
export function fromRupiah(rupiah: number): number {
  return rupiah
}

/**
 * Format IDR amount for display
 * Uses Indonesian locale with Rp symbol
 * @param rupiah - Amount in IDR (e.g., 150000)
 * @returns Formatted currency string (e.g., 'Rp150.000')
 */
export function formatCurrency(rupiah: number): string {
  return new Intl.NumberFormat(IDR_LOCALE, {
    style: "currency",
    currency: IDR_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupiah)
}

/**
 * Format IDR amount without currency symbol
 * @param rupiah - Amount in IDR (e.g., 150000)
 * @returns Formatted number string (e.g., '150.000')
 */
export function formatCurrencyPlain(rupiah: number): string {
  return new Intl.NumberFormat(IDR_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupiah)
}

/**
 * Parse IDR input string to integer
 * Handles various input formats including Rp prefix and thousand separators
 * @param input - Currency string (e.g., "Rp150.000" or "150000")
 * @returns Amount as integer (e.g., 150000)
 */
export function parseRupiahInput(input: string): number {
  // Remove currency symbol and thousand separators, keep only digits
  const cleaned = input.replace(/[^0-9]/g, "")
  const value = parseInt(cleaned, 10)
  if (isNaN(value)) {
    return 0
  }
  return value
}

// Legacy function aliases for backward compatibility during migration
// These will be removed after full migration
export const dollarsToCents = toRupiah
export const centsToDollars = fromRupiah

/**
 * @deprecated Use formatCurrency instead
 */
export const formatCurrencyLegacy = formatCurrency
