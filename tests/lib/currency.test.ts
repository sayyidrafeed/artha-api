/**
 * Currency utility tests
 */

import { describe, it, expect } from "bun:test"

import { dollarsToCents, centsToDollars, formatCurrency } from "@/lib/currency"

describe("Currency Utilities", () => {
  describe("dollarsToCents", () => {
    it("should convert whole dollars to cents", () => {
      expect(dollarsToCents(100)).toBe(10000)

      expect(dollarsToCents(50)).toBe(5000)

      expect(dollarsToCents(1)).toBe(100)
    })

    it("should convert dollars with cents", () => {
      expect(dollarsToCents(25.99)).toBe(2599)

      expect(dollarsToCents(10.5)).toBe(1050)

      expect(dollarsToCents(0.01)).toBe(1)
    })

    it("should round to nearest cent", () => {
      expect(dollarsToCents(10.995)).toBe(1100)

      expect(dollarsToCents(10.994)).toBe(1099)
    })

    it("should handle zero", () => {
      expect(dollarsToCents(0)).toBe(0)
    })

    it("should handle negative values", () => {
      expect(dollarsToCents(-25.99)).toBe(-2599)
    })
  })

  describe("centsToDollars", () => {
    it("should convert cents to dollars", () => {
      expect(centsToDollars(10000)).toBe(100)

      expect(centsToDollars(5000)).toBe(50)

      expect(centsToDollars(100)).toBe(1)
    })

    it("should convert cents with decimal", () => {
      expect(centsToDollars(2599)).toBe(25.99)

      expect(centsToDollars(1050)).toBe(10.5)

      expect(centsToDollars(1)).toBe(0.01)
    })

    it("should handle zero", () => {
      expect(centsToDollars(0)).toBe(0)
    })

    it("should handle negative values", () => {
      expect(centsToDollars(-2599)).toBe(-25.99)
    })
  })

  describe("formatCurrency", () => {
    it("should format rupiah as IDR currency string", () => {
      // IDR uses Indonesian locale with Rp symbol, no decimals
      expect(formatCurrency(2599)).toBe("Rp2.599")

      expect(formatCurrency(10000)).toBe("Rp10.000")

      expect(formatCurrency(100)).toBe("Rp100")
    })

    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("Rp0")
    })

    it("should handle negative values", () => {
      expect(formatCurrency(-2599)).toBe("-Rp2.599")
    })
  })

  describe("round-trip conversion", () => {
    it("should maintain precision through round-trip", () => {
      const original = 25.99

      const cents = dollarsToCents(original)

      const backToDollars = centsToDollars(cents)

      expect(backToDollars).toBe(original)
    })

    it("should handle edge cases", () => {
      const testCases = [0, 0.01, 0.99, 1, 10.5, 99.99, 100, 999.99]

      for (const testCase of testCases) {
        const cents = dollarsToCents(testCase)

        const backToDollars = centsToDollars(cents)

        expect(backToDollars).toBe(testCase)
      }
    })
  })
})
