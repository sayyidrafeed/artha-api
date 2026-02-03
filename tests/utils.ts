/**
 * Test utilities and helper functions
 */

/**
 * Create a mock Hono request for testing
 */
export function createMockRequest(
  options: Partial<{
    method: string
    path: string
    headers: Headers
    body: unknown
  }> = {},
): Request {
  const requestOptions: RequestInit = {
    method: options.method || "GET",
    headers: options.headers || new Headers(),
  }

  // Only add body for non-GET methods
  if (options.method && options.method !== "GET" && options.body) {
    requestOptions.body = JSON.stringify(options.body)
  }

  return new Request(
    new URL(options.path || "/", "http://localhost"),
    requestOptions,
  )
}

/**
 * Create a mock session object for testing
 */
export function createMockSession(
  overrides: Partial<{
    id: string
    userId: string
    email: string
    name: string
    expiresAt: Date
  }> = {},
): {
  user: {
    id: string
    email: string
    name: string
    image: string | null
  }
  session: {
    id: string
    token: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
    userId: string
    ipAddress: string | null
    userAgent: string | null
  }
} {
  return {
    user: {
      id: overrides.userId || "test-user-id",
      email: overrides.email || "test-owner@example.com",
      name: overrides.name || "Test Owner",
      image: null,
    },
    session: {
      id: overrides.id || "test-session-id",
      token: "test-session-token",
      expiresAt:
        overrides.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: overrides.userId || "test-user-id",
      ipAddress: "127.0.0.1",
      userAgent: "test-agent",
    },
  }
}

/**
 * Parse JSON response safely
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`Failed to parse JSON response: ${text}`)
  }
}

/**
 * Wait for a specified duration (useful for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate a random UUID for testing
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
