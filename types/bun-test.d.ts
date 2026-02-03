/**
 * Type definitions for Bun test framework
 */

declare module "bun:test" {
  export function describe(name: string, fn: () => void): void
  export function it(name: string, fn: () => void | Promise<void>): void
  export function test(name: string, fn: () => void | Promise<void>): void
  export function beforeAll(fn: () => void | Promise<void>): void
  export function afterAll(fn: () => void | Promise<void>): void
  export function beforeEach(fn: () => void | Promise<void>): void
  export function afterEach(fn: () => void | Promise<void>): void
  export function expect(
    value: unknown,
  ): {
    toBe(expected: unknown): void
    toEqual(expected: unknown): void
    toBeTruthy(): void
    toBeFalsy(): void
    toBeNull(): void
    toBeUndefined(): void
    toBeDefined(): void
    toBeGreaterThan(expected: number): void
    toBeLessThan(expected: number): void
    toBeGreaterThanOrEqual(expected: number): void
    toBeLessThanOrEqual(expected: number): void
    toContain(expected: unknown): void
    toHaveLength(expected: number): void
    toThrow(expected?: string | Error): void
    toMatch(expected: RegExp | string): void
    toBeInstanceOf(expected: unknown): void
    toHaveProperty(property: string, value?: unknown): void
    toBeCloseTo(expected: number, precision?: number): void
  }
}
