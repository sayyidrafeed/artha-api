# Artha API Endpoints Documentation

## Base URL

```
Production: https://artha.sayyidrafee.com/api
Local: http://localhost:3000/api
```

## Authentication

Artha uses **Better Auth** for authentication with **owner-only access**. There is **no public registration** - only pre-seeded/verified accounts can access the application.

### Supported Authentication Methods
- **GitHub OAuth** (Primary)
- **Google OAuth** (Primary)
- **Email/Password** (Development fallback only)

---

## Authentication Endpoints (Better Auth)

### GET /auth/signin/github

Initiate GitHub OAuth sign-in flow.

**Response:** Redirects to GitHub OAuth consent screen

---

### GET /auth/signin/google

Initiate Google OAuth sign-in flow.

**Response:** Redirects to Google OAuth consent screen

---

### POST /auth/signin/email

Sign in with email and password (development only).

**Rate Limit:** 5 requests per minute per IP

**Request Body:**
```json
{
  "email": "owner@sayyidrafee.com",
  "password": "your-password"
}
```

**Response 200 OK:**
```json
{
  "token": "session-token",
  "user": {
    "id": "user-cuid",
    "email": "owner@sayyidrafee.com",
    "name": "Sayyid Rafee",
    "image": "https://avatar.url"
  }
}
```

**Response 401 Unauthorized:**
```json
{
  "error": {
    "message": "Invalid email or password"
  }
}
```

**Response 403 Forbidden (Non-owner):**
```json
{
  "error": {
    "message": "Access restricted to owner only"
  }
}
```

---

### GET /auth/callback/:provider

OAuth callback handler for GitHub and Google.

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| code | OAuth authorization code |
| state | CSRF state token |

**Response:** Redirects to frontend with session cookie set

---

### POST /auth/signout

Sign out and clear session.

**Response 200 OK:**
```json
{
  "success": true
}
```
**Clears session cookie**

---

### GET /auth/session

Get current session information.

**Response 200 OK (Authenticated):**
```json
{
  "session": {
    "id": "session-cuid",
    "token": "session-token",
    "userId": "user-cuid",
    "expiresAt": "2024-02-09T10:30:00Z"
  },
  "user": {
    "id": "user-cuid",
    "email": "owner@sayyidrafee.com",
    "name": "Sayyid Rafee",
    "image": "https://avatar.url"
  }
}
```

**Response 200 OK (Unauthenticated):**
```json
{
  "session": null,
  "user": null
}
```

---

## Transaction Endpoints

**Note:** All transaction endpoints require owner authentication.

### GET /transactions

List transactions with pagination and filters.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| startDate | string | - | Filter from date (YYYY-MM-DD) |
| endDate | string | - | Filter to date (YYYY-MM-DD) |
| categoryId | uuid | - | Filter by category |
| type | enum | - | Filter by type: 'income' or 'expense' |

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "categoryId": "550e8400-e29b-41d4-a716-446655440010",
      "categoryName": "Food & Dining",
      "categoryType": "expense",
      "amountCents": 2599,
      "description": "Lunch at cafe",
      "transactionDate": "2024-01-15",
      "createdAt": "2024-01-15T12:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### POST /transactions

Create a new transaction.

**Request Body:**
```json
{
  "categoryId": "550e8400-e29b-41d4-a716-446655440010",
  "amount": 25.99,
  "description": "Lunch at cafe",
  "transactionDate": "2024-01-15"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "categoryId": "550e8400-e29b-41d4-a716-446655440010",
    "categoryName": "Food & Dining",
    "categoryType": "expense",
    "amountCents": 2599,
    "description": "Lunch at cafe",
    "transactionDate": "2024-01-15",
    "createdAt": "2024-01-15T12:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

---

### GET /transactions/:id

Get a single transaction by ID.

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "categoryId": "550e8400-e29b-41d4-a716-446655440010",
    "categoryName": "Food & Dining",
    "categoryType": "expense",
    "amountCents": 2599,
    "description": "Lunch at cafe",
    "transactionDate": "2024-01-15",
    "createdAt": "2024-01-15T12:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

---

### PUT /transactions/:id

Update a transaction.

**Request Body:** (all fields optional)
```json
{
  "categoryId": "550e8400-e29b-41d4-a716-446655440011",
  "amount": 30.50,
  "description": "Updated description",
  "transactionDate": "2024-01-16"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "categoryId": "550e8400-e29b-41d4-a716-446655440011",
    "categoryName": "Entertainment",
    "categoryType": "expense",
    "amountCents": 3050,
    "description": "Updated description",
    "transactionDate": "2024-01-16",
    "createdAt": "2024-01-15T12:00:00Z",
    "updatedAt": "2024-01-16T10:00:00Z"
  }
}
```

---

### DELETE /transactions/:id

Delete a transaction.

**Response 200 OK:**
```json
{
  "success": true,
  "data": null
}
```

---

## Dashboard Endpoints

**Note:** All dashboard endpoints require owner authentication.

### GET /dashboard/summary

Get monthly income/expense/balance summary.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | integer | Yes | Year (e.g., 2024) |
| month | integer | No | Month (1-12), omit for yearly summary |

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "incomeCents": 500000,
    "expenseCents": 325000,
    "balanceCents": 175000
  }
}
```

---

### GET /dashboard/by-category

Get transactions aggregated by category.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| year | integer | Yes | Year (e.g., 2024) |
| month | integer | No | Month (1-12), omit for yearly aggregation |

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "income": [
      {
        "categoryId": "550e8400-e29b-41d4-a716-446655440020",
        "categoryName": "Salary",
        "type": "income",
        "totalCents": 500000,
        "transactionCount": 1
      }
    ],
    "expense": [
      {
        "categoryId": "550e8400-e29b-41d4-a716-446655440010",
        "categoryName": "Food & Dining",
        "type": "expense",
        "totalCents": 120000,
        "transactionCount": 15
      }
    ]
  }
}
```

---

## Category Endpoints

**Note:** All category endpoints require owner authentication.

### GET /categories

List all categories.

**Response 200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "name": "Salary",
      "type": "income",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Food & Dining",
      "type": "expense",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /categories

Create a new category.

**Request Body:**
```json
{
  "name": "Gym Membership",
  "type": "expense"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "name": "Gym Membership",
    "type": "expense",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### PUT /categories/:id

Update a category.

**Request Body:**
```json
{
  "name": "Fitness & Health"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "name": "Fitness & Health",
    "type": "expense",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### DELETE /categories/:id

Delete a category.

**Response 200 OK:**
```json
{
  "success": true,
  "data": null
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot delete category with existing transactions"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Owner access only |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Input validation failed |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| /auth/signin/* | 5 per minute |
| /auth/callback/* | 10 per minute |
| All other endpoints | 100 per minute |

## Key Changes from Multi-User API

1. **No Registration**: No `/auth/register` endpoint
2. **Owner-Only**: All protected endpoints verify owner email
3. **No user_id in responses**: Transactions don't include user identification
4. **OAuth-First**: Primary auth via GitHub/Google, not email/password
5. **Better Auth Standard**: Uses Better Auth response formats for auth endpoints
