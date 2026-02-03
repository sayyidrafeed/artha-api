# Artha - Personal Finance Tracker Architecture Document

## System Overview

**Artha** (Sanskrit: अर्थ, meaning "wealth, prosperity") is a production-ready personal finance tracker built with a modular monolith architecture optimized for maintainability, extensibility, and Vercel deployment.

- **Frontend Repository**: https://github.com/sayyidrafeed/artha-web.git
- **Backend Repository**: https://github.com/sayyidrafeed/artha-api.git
- **Production Domain**: https://artha.sayyidrafee.com

## Development Toolchain

This project uses **Bun** for development workflows while retaining **npm** for production deployments:

| Tool | Purpose | Environment |
|------|---------|-------------|
| **Bun** | Package management, dev server, test runner | Development |
| **oxlint** | Linting with strict TypeScript rules | Development & CI |
| **oxfmt** | Code formatting | Development & CI |
| **npm** | Production builds, CI/CD compatibility | Production |

### Why This Toolchain?

- **Bun**: 3x faster package installs, built-in TypeScript support, fast dev server
- **oxlint**: 50-100x faster than ESLint, strict TypeScript enforcement
- **oxfmt**: Consistent, deterministic formatting
- **npm**: Universal compatibility for production deployments

## Architecture Pattern: Modular Monolith

Artha follows a **modular monolith** architecture designed for high maintainability and future extensibility:

```mermaid
graph TB
    subgraph "Client Layer"
        FE[React 19.2.4 + Vite]
        TQ[TanStack Query 5.90.20]
        ZOD[Zod 4.3.6]
    end
    
    subgraph "API Layer - Modular Monolith"
        HONO[Hono 4.11.7]
        
        subgraph "Auth Module"
            BA[Better Auth 1.4.18]
            OAUTH[OAuth Providers<br/>GitHub, Google]
        end
        
        subgraph "Core Modules"
            TXN[Transaction Module]
            CAT[Category Module]
            DASH[Dashboard Module]
        end
        
        subgraph "Shared Infrastructure"
            CORS[CORS Middleware]
            LOG[Request Logging]
            RATE[Rate Limiting]
            ERR[Error Handler]
        end
    end
    
    subgraph "Data Layer"
        DB[Neon PostgreSQL 18]
        DRZ[Drizzle ORM 0.45.1]
        IDX[Indexes]
    end
    
    FE -->|HTTPS + Cookies| CORS
    CORS --> LOG
    LOG --> RATE
    RATE --> HONO
    
    HONO --> BA
    BA --> OAUTH
    
    HONO --> TXN
    HONO --> CAT
    HONO --> DASH
    
    TXN --> DRZ
    CAT --> DRZ
    DASH --> DRZ
    
    DRZ --> DB
```

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend Framework | React | 19.2.4 | UI framework |
| Build Tool | Vite | 6.x | Development and production builds |
| State Management | TanStack Query | 5.90.20 | Server state with SWR caching |
| Validation | Zod | 4.3.6 | Runtime schema validation |
| Backend Framework | Hono | 4.11.7 | Lightweight web framework |
| Backend Runtime | Vercel Functions | Node.js 20 | Serverless compute |
| Authentication | Better Auth | 1.4.18 | OAuth + session management |
| Database | Neon PostgreSQL | 18 | Serverless Postgres |
| ORM | Drizzle ORM | 0.45.1 | Type-safe SQL queries |
| Dev Runtime | Bun | latest | Development workflow |
| Linter | oxlint | ^0.15.0 | Code linting |
| Formatter | oxfmt | ^0.1.0 | Code formatting |

## Single-User Owner-Only Access Model

Artha is designed for **single-owner access only**. There is no public registration:

### Access Control Strategy

1. **Pre-seeded Owner Account**: The owner account is created via OAuth sign-in
2. **Verified Account Required**: Only verified accounts can authenticate
3. **No Registration Endpoint**: No `/auth/register` endpoint exposed
4. **OAuth-First**: Primary authentication via GitHub OAuth or Google OAuth
5. **Email/Password Fallback**: Optional email/password for local development

### Owner Account Setup

```typescript
// Seeded owner account (database seed)
const ownerAccount = {
  id: 'owner-uuid',
  email: 'owner@sayyidrafee.com',
  name: 'Sayyid Rafee',
  emailVerified: true,
  role: 'owner',
  createdAt: new Date(),
};
```

## Database Schema

### Better Auth Tables

Better Auth requires the following tables (managed by Better Auth):

```mermaid
erDiagram
    USER {
        string id PK
        string email UK
        string name
        string image
        timestamp emailVerified
        timestamp createdAt
        timestamp updatedAt
    }
    
    SESSION {
        string id PK
        string userId FK
        string token UK
        timestamp expiresAt
        string ipAddress
        string userAgent
        timestamp createdAt
        timestamp updatedAt
    }
    
    ACCOUNT {
        string id PK
        string userId FK
        string accountId
        string providerId
        string accessToken
        string refreshToken
        string idToken
        timestamp accessTokenExpiresAt
        timestamp refreshTokenExpiresAt
        string scope
        string password
        timestamp createdAt
        timestamp updatedAt
    }
    
    VERIFICATION {
        string id PK
        string identifier
        string value
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }
    
    USER ||--o{ SESSION : "has many"
    USER ||--o{ ACCOUNT : "has many"
```

### Application Tables

```mermaid
erDiagram
    CATEGORIES {
        uuid id PK
        string name
        enum type "income|expense"
        timestamp created_at
    }
    
    TRANSACTIONS {
        uuid id PK
        uuid category_id FK
        integer amount_cents "stored as cents"
        string description
        date transaction_date
        timestamp created_at
        timestamp updated_at
    }
    
    CATEGORIES ||--o{ TRANSACTIONS : "categorizes"
```

### Table Definitions

#### Better Auth Tables (Auto-managed)
| Table | Purpose |
|-------|---------|
| `user` | Owner account information |
| `session` | Active sessions with tokens |
| `account` | OAuth provider connections |
| `verification` | Email verification tokens |

#### categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name | varchar(100) | NOT NULL |
| type | enum | CHECK (type IN ('income', 'expense')) |
| created_at | timestamp | DEFAULT now() |

#### transactions
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() |
| category_id | uuid | FOREIGN KEY (categories.id), NOT NULL |
| amount_cents | integer | NOT NULL, CHECK (amount_cents > 0) |
| description | varchar(500) | NOT NULL |
| transaction_date | date | NOT NULL |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | DEFAULT now() |

### Indexes
```sql
-- For date range filtering and sorting
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- Composite index for dashboard queries
CREATE INDEX idx_transactions_date_category ON transactions(transaction_date, category_id);

-- For category lookups
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
```

## API Architecture

### Base URL Structure
```
Production: https://artha.sayyidrafee.com/api
Local: http://localhost:3000/api
```

### Authentication Flow (Better Auth)

```mermaid
sequenceDiagram
    participant U as Owner
    participant F as Artha Web
    participant A as Artha API
    participant BA as Better Auth
    participant GH as GitHub/Google
    
    U->>F: Click "Sign In"
    F->>A: GET /auth/signin/github
    A->>BA: Initialize OAuth flow
    BA->>GH: Redirect to OAuth provider
    GH-->>U: Login prompt
    U->>GH: Authenticate
    GH-->>A: OAuth callback with code
    A->>BA: Exchange code for tokens
    BA->>A: Create/verify user account
    A-->>F: Set session cookie + redirect
    F-->>U: Dashboard loaded
    
    Note over F,A: Subsequent requests
    F->>A: GET /transactions (with session cookie)
    A->>BA: Validate session
    BA-->>A: Session valid
    A->>A: Verify owner access
    A-->>F: Transaction data
```

### API Endpoints

#### Authentication (Better Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /auth/signin/github | Initiate GitHub OAuth |
| GET | /auth/signin/google | Initiate Google OAuth |
| POST | /auth/signin/email | Email/password signin (dev only) |
| POST | /auth/signout | Clear session |
| GET | /auth/session | Get current session |
| GET | /auth/callback/:provider | OAuth callback handler |

**Note**: No `/auth/register` endpoint. Accounts are pre-seeded.

#### Transactions
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /transactions | List with pagination & filters | Yes (Owner) |
| POST | /transactions | Create transaction | Yes (Owner) |
| GET | /transactions/:id | Get single transaction | Yes (Owner) |
| PUT | /transactions/:id | Update transaction | Yes (Owner) |
| DELETE | /transactions/:id | Delete transaction | Yes (Owner) |

#### Dashboard
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /dashboard/summary | Monthly summary | Yes (Owner) |
| GET | /dashboard/by-category | Aggregated by category | Yes (Owner) |

#### Categories
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /categories | List all categories | Yes (Owner) |
| POST | /categories | Create category | Yes (Owner) |
| PUT | /categories/:id | Update category | Yes (Owner) |
| DELETE | /categories/:id | Delete category | Yes (Owner) |

### Standardized Response Format

```typescript
// Success Response
{
  "success": true,
  "data": T,
  "meta": {
    "page": number,
    "limit": number,
    "total": number
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR",
    "message": string,
    "details": unknown
  }
}
```

## CORS Configuration

```typescript
// Exact production URL matching
const allowedOrigins = [
  'https://artha.sayyidrafee.com',
  'http://localhost:5173' // development only
];

// CORS middleware configuration
app.use(cors({
  origin: (origin) => allowedOrigins.includes(origin) ? origin : null,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Set-Cookie']
}));
```

## Security Considerations

### Better Auth Configuration
- Session stored in httpOnly, Secure, SameSite=Strict cookie
- Session expiration: 7 days
- CSRF protection enabled
- PKCE for OAuth flows

### Rate Limiting
- OAuth endpoints: 10 requests per minute per IP
- General API: 100 requests per minute per session

### Owner-Only Access
```typescript
// Owner verification middleware
export const ownerOnlyMiddleware = createMiddleware(async (c, next) => {
  const session = c.get('session');
  
  if (!session) {
    return error(c, 'UNAUTHORIZED', 'Authentication required', 401);
  }
  
  // Verify this is the owner account
  const ownerEmail = process.env.OWNER_EMAIL;
  if (session.user.email !== ownerEmail) {
    return error(c, 'FORBIDDEN', 'Access restricted to owner only', 403);
  }
  
  await next();
});
```

### Input Sanitization
- All inputs validated with Zod schemas
- SQL injection prevention via Drizzle ORM
- XSS prevention via output encoding

## Performance Optimizations

### Backend (Cold Start Optimization)
1. Keep global scope lean - minimal imports at module level
2. Use Neon connection pooling (PgBouncer)
3. Lazy-load heavy dependencies
4. Use Edge-compatible packages

### Frontend (Caching Strategy)
```typescript
// TanStack Query stale-while-revalidate config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
});
```

## Monetary Value Handling

All monetary values stored as **integer cents** in database:

```typescript
// Database layer - store as cents
const amountCents = Math.round(dollars * 100);

// Presentation layer - divide by 100
const displayAmount = (cents: number) => (cents / 100).toFixed(2);

// Example
// Input: $50.99 -> Store: 5099 cents -> Display: 50.99
```

## Modular Monolith Project Structure

```
artha/
├── artha-api/                    # Backend repository
│   ├── src/
│   │   ├── modules/             # Feature modules
│   │   │   ├── auth/            # Better Auth integration
│   │   │   │   ├── index.ts
│   │   │   │   └── better-auth.ts
│   │   │   ├── transactions/    # Transaction module
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── schema.ts
│   │   │   ├── categories/      # Category module
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── schema.ts
│   │   │   └── dashboard/       # Dashboard module
│   │   │       ├── routes.ts
│   │   │       └── service.ts
│   │   ├── db/
│   │   │   ├── index.ts         # Drizzle connection
│   │   │   └── schema.ts        # App tables schema
│   │   ├── middleware/
│   │   │   ├── owner-only.ts    # Owner access verification
│   │   │   ├── cors.ts
│   │   │   ├── logging.ts
│   │   │   ├── rate-limit.ts
│   │   │   └── error-handler.ts
│   │   ├── lib/
│   │   │   ├── response.ts      # Standardized responses
│   │   │   └── currency.ts      # Currency conversion
│   │   └── index.ts             # Hono app entry
│   ├── .oxlintrc.json           # oxlint configuration
│   ├── .oxfmt.json              # oxfmt configuration
│   ├── bun.lockb                # Bun lockfile
│   ├── drizzle/
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json
│
├── artha-web/                    # Frontend repository
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   └── pages/
│   │   │   ├── dashboard/
│   │   │   │   ├── components/
│   │   │   │   └── pages/
│   │   │   └── transactions/
│   │   │       ├── components/
│   │   │       └── pages/
│   │   ├── components/
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── api.ts           # API client
│   │   │   ├── query-client.ts
│   │   │   └── utils.ts
│   │   ├── schemas/             # Zod schemas
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .oxlintrc.json           # oxlint configuration
│   ├── .oxfmt.json              # oxfmt configuration
│   ├── bun.lockb                # Bun lockfile
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── plans/                        # Documentation
    ├── architecture.md
    ├── api-endpoints.md
    ├── database-schema.md
    ├── backend-structure.md
    ├── frontend-architecture.md
    └── todo.md
```

## Development Workflow

### Bun (Development)

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Run linter
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Check formatting
bun run format:check

# Type check
bun run typecheck

# Run all checks
bun run check
```

### npm (Production)

```bash
# Install dependencies (CI/production)
npm ci

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

### Backend (.env.local)
```bash
# Database
DATABASE_URL="postgresql://user:pass@neon-host/db?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-better-auth-secret-min-32-characters"
BETTER_AUTH_URL="https://artha.sayyidrafee.com/api"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Owner Configuration
OWNER_EMAIL="owner@sayyidrafee.com"

# CORS
FRONTEND_URL="https://artha.sayyidrafee.com"

# Rate Limiting (Upstash Redis optional)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### Frontend (.env.local)
```bash
# API URL
VITE_API_URL="https://artha.sayyidrafee.com/api"

# Better Auth
VITE_BETTER_AUTH_URL="https://artha.sayyidrafee.com/api"

# Owner email (for client-side verification if needed)
VITE_OWNER_EMAIL="owner@sayyidrafee.com"
```

## Code Quality Configuration

### oxlint (.oxlintrc.json)

Strict TypeScript rules including:
- Explicit function return types
- No explicit `any` types
- Strict boolean expressions
- Consistent type imports
- React hooks rules (frontend)

### oxfmt (.oxfmt.json)

Consistent formatting:
- 100 character print width
- 2-space indentation
- Single quotes
- Trailing commas (ES5)
- LF line endings

## CI/CD Pipeline

GitHub Actions use Bun for speed:

```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest

- name: Install dependencies
  run: bun install

- name: Run oxlint
  run: bun run lint

- name: Check formatting
  run: bun run format:check

- name: Type check
  run: bun run typecheck
```

## IDE Configuration

### VS Code Settings

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.oxlint": "explicit"
  },
  "oxlint.enable": true
}
```

### Recommended Extensions

- **oxc.oxc-vscode**: oxlint and oxfmt support
- **bradlc.vscode-tailwindcss**: Tailwind CSS IntelliSense

## Future Expansion Considerations

### Category-Based Budgeting
- Add `budgets` table with alert thresholds
- Monthly budget tracking against actual spending
- Alert notifications when approaching limits

### Data Export
- CSV export endpoint: `GET /export/transactions.csv`
- Date range filtering for exports
- Optional column selection

### Visualization Charts
- Additional dashboard endpoints for chart data
- Time-series aggregation (weekly/monthly/yearly)
- Category distribution data

All future features must maintain backward compatibility with existing API contracts.

## Domino Effects of Owner-Only Access Model

### Removed Features
1. **Public Registration**: No `/auth/register` endpoint
2. **Multi-User Support**: No user management, roles, or permissions beyond owner
3. **User-scoped Data**: Transactions don't have `user_id` (single owner implied)

### Simplified Features
1. **Database Schema**: No `user_id` foreign keys on transactions/categories
2. **Authorization**: Simple owner email check instead of complex RBAC
3. **UI**: No user switcher, account settings, or multi-tenancy UI

### Security Implications
1. **Critical**: `OWNER_EMAIL` must be set correctly
2. **OAuth Apps**: GitHub/Google OAuth apps must be configured with restricted access
3. **Session Security**: Better Auth session cookies are the primary security boundary

### Operational Considerations
1. **Owner Change**: Requires database migration to update owner email
2. **Backup/Restore**: No multi-user data separation needed
3. **Audit**: All actions are owner actions (no need for user attribution)
