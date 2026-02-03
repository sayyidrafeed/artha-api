/**
 * Test setup and configuration
 * This file sets up the testing environment for all test suites
 */

// Set test environment variables before any imports
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/artha_test"
process.env.BETTER_AUTH_SECRET = "test-secret-key-min-32-characters"
process.env.BETTER_AUTH_URL = "http://localhost:3000/api"
process.env.OWNER_EMAIL = "test-owner@example.com"
process.env.GITHUB_CLIENT_ID = "test-github-client-id"
process.env.GITHUB_CLIENT_SECRET = "test-github-client-secret"
process.env.GOOGLE_CLIENT_ID = "test-google-client-id"
process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret"

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: (): void => {},
  debug: (): void => {},
  info: (): void => {},
  warn: (): void => {},
  error: (): void => {},
}
