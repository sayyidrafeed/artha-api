/**
 * Currency Utility Tests
 * Following TDD: Tests for IDR (Indonesian Rupiah) currency handling
 */

import { describe, it, expect } from "bun:test"
import {
  toRupiah,
  fromRupiah,
  formatCurrency,
  formatCurrencyPlain,
  parseRupiahInput,
  IDR_LOCALE,
  IDR_CURRENCY,
  dollarsToCents,
  centsToDollars,
  formatCurrencyLegacy,
} from "@/lib/currency"

describe("Currency Constants", () => {
  it("should have correct IDR locale", () => {
    expect(IDR_LOCALE).toBe("id-ID")
  })

  it("should have correct IDR currency code", () => {
    expect(IDR_CURRENCY).toBe("IDR")
  })
})

describe("toRupiah", () => {
  it("should convert decimal to integer by rounding", () => {
    expect(toRupiah(150000.5)).toBe(150001)
    expect(toRupiah(150000.4)).toBe(150000)
  })

  it("should handle whole numbers", () => {
    expect(toRupiah(150000)).toBe(150000)
  })

  it("should handle zero", () => {
    expect(toRupiah(0)).toBe(0)
  })

  it("should handle negative numbers by rounding", () => {
    expect(toRupiah(-150000.5)).toBe(-150000)
  })
})

describe("fromRupiah", () => {
  it("should return the same value (IDR has no decimals)", () => {
    expect(fromRupiah(150000)).toBe(150000)
    expect(fromRupiah(0)).toBe(0)
    expect(fromRupiah(-50000)).toBe(-50000)
  })
})

describe("formatCurrency", () => {
  it("should format positive amounts with Rp symbol", () => {
    const result = formatCurrency(150000)
    expect(result).toContain("Rp")
    expect(result).toContain("150")
    expect(result).toContain("000")
  })

  it("should format zero correctly", () => {
    const result = formatCurrency(0)
    expect(result).toContain("Rp")
    expect(result).toContain("0")
  })

  it("should format large amounts with thousand separators", () => {
    const result = formatCurrency(1000000)
    expect(result).toContain("1")
    expect(result).toContain("000")
    expect(result).toContain("000")
  })
})

describe("formatCurrencyPlain", () => {
  it("should format without currency symbol", () => {
    const result = formatCurrencyPlain(150000)
    expect(result.startsWith("Rp")).toBe(false)
    expect(result).toContain("150")
  })

  it("should format large numbers with separators", () => {
    const result = formatCurrencyPlain(1000000)
    expect(result).toBe("1.000.000")
  })

  it("should format zero", () => {
    expect(formatCurrencyPlain(0)).toBe("0")
  })
})

describe("parseRupiahInput", () => {
  it("should parse plain number string", () => {
    expect(parseRupiahInput("150000")).toBe(150000)
  })

  it("should parse string with thousand separators", () => {
    expect(parseRupiahInput("150.000")).toBe(150000)
  })

  it("should parse string with Rp prefix", () => {
    expect(parseRupiahInput("Rp150.000")).toBe(150000)
  })

  it("should parse string with Rp prefix and spaces", () => {
    expect(parseRupiahInput("Rp 150.000")).toBe(150000)
  })

  it("should return 0 for invalid input", () => {
    expect(parseRupiahInput("")).toBe(0)
    expect(parseRupiahInput("abc")).toBe(0)
    expect(parseRupiahInput("Rp")).toBe(0)
  })

  it("should handle large numbers", () => {
    expect(parseRupiahInput("10.000.000")).toBe(10000000)
  })

  it("should handle decimal inputs (ignoring decimals)", () => {
    expect(parseRupiahInput("150000.50")).toBe(15000050)
  })
})

describe("Legacy Aliases", () => {
  it("dollarsToCents should be alias for toRupiah", () => {
    expect(dollarsToCents(150000.5)).toBe(toRupiah(150000.5))
  })

  it("centsToDollars should be alias for fromRupiah", () => {
    expect(centsToDollars(150000)).toBe(fromRupiah(150000))
  })

  it("formatCurrencyLegacy should be alias for formatCurrency", () => {
    expect(formatCurrencyLegacy(150000)).toBe(formatCurrency(150000))
  })
})
