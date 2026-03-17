# Artha - Personal Finance Tracker

**Artha** (Sanskrit: अर्थ, meaning "wealth, prosperity") is a production-ready personal finance tracker built with a modular monolith architecture optimized for maintainability, extensibility, and Cloudflare Workers deployment.

## Repositories

- **Frontend**: https://github.com/sayyidrafeed/artha-web.git
- **Backend**: https://github.com/sayyidrafeed/artha-api.git

## Live Application

- **Production**: https://artha.sayyidrafee.com

## Architecture Overview

Artha follows a **modular monolith** architecture designed for single-owner access:

```mermaid
graph TB
    subgraph "Client Layer"
        FE[React 19.2.4 + Vite]
        TQ[TanStack Query 5.90.20]
        ZOD[Zod 4.3.6]
    end
    
    subgraph "API Layer - Modular Monolith"
        HONO[Hono 4.11.7<br/>Cloudflare Workers]
        
        subgraph "Auth Module"
            BA[Better Auth 1.4.18]
            OAUTH[OAuth Providers<br/>GitHub, Google]
        end
        
        subgraph "Core Modules"
            TXN[Transaction Module]
            CAT[Category Module]
            DASH[Dashboard Module]
        end
    end
    
    subgraph "Data Layer"
        DB[Neon PostgreSQL 18]
        DRZ[Drizzle ORM 0.45.1]
    end
    
    FE -->|HTTPS + Cookies| HONO
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

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | React | 19.2.4 |
| Build Tool | Vite | 6.x |
| State Management | TanStack Query | 5.90.20 |
| Validation | Zod | 4.3.6 |
| Backend Framework | Hono | 4.11.7 |
| Deployment Runtime | Cloudflare Workers | - |
| Authentication | Better Auth | 1.4.18 |
| Database | Neon PostgreSQL | 18 |
| ORM | Drizzle ORM | 0.45.1 |
| Development Runtime | Bun | latest |
| Linter | oxlint | ^0.15.0 |
| Formatter | oxfmt | ^0.1.0 |

## Development Toolchain: Bun + Wrangler + oxlint + oxfmt

This project uses **Bun** for development workflows and **Wrangler** for Cloudflare Workers deployment:

- **Bun**: Fast package management, development server, and test runner
- **Wrangler**: Cloudflare Workers CLI for local development and deployment
- **oxlint**: High-performance linting with strict TypeScript rules
- **oxfmt**: Fast, consistent code formatting

### Why Bun + Wrangler?

- **Speed**: Bun installs dependencies 3x faster than npm
- **Edge Runtime**: Cloudflare Workers provides global low-latency deployment
- **Performance**: oxlint is 50-100x faster than ESLint
- **Consistency**: oxfmt provides deterministic formatting

## Single-User Owner-Only Access

Artha is designed for **single-owner access only**. There is no public registration:

- **Pre-seeded Owner Account**: The owner account is created via OAuth sign-in
- **Verified Account Required**: Only the owner email can authenticate
- **No Registration Endpoint**: No `/auth/register` endpoint exposed
- **OAuth-First**: Primary authentication via GitHub OAuth or Google OAuth

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI (`bun add -g wrangler`)
- Neon PostgreSQL database
- GitHub OAuth App (for authentication)
- Google OAuth App (optional)
- Cloudflare account

### 1. Clone Repository

```bash
git clone https://github.com/sayyidrafeed/artha-api.git
cd artha-api
```

### 2. Backend Setup

#### Option A: Local PostgreSQL with Docker (Recommended)

The project includes a complete Docker Compose setup for local PostgreSQL development:

```bash
# Copy Docker environment file
cp .env.docker .env.docker.local

# Start PostgreSQL and pgAdmin
docker-compose up -d

# Verify services are running
docker-compose ps

# Access:
# - PostgreSQL: localhost:5432 (user: artha, password: artha_dev_secure_2024)
# - pgAdmin: http://localhost:5050 (email: admin@artha.local, password: admin)
```

Update your `.dev.vars`:

```bash
DATABASE_URL="postgresql://artha:artha_dev_secure_2024@localhost:5432/artha?sslmode=disable"
```

See [DOCKER.md](DOCKER.md) for complete Docker setup documentation.

#### Option B: Neon PostgreSQL (Cloud)

```bash
# Install dependencies with Bun
bun install

# Create development variables file
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your Neon database URL:
# DATABASE_URL=postgresql://user:pass@neon-host/db?sslmode=require
```

#### Continue Backend Setup

```bash
# Edit .dev.vars with your values:
# BETTER_AUTH_SECRET=...
# GITHUB_CLIENT_ID=...
# GITHUB_CLIENT_SECRET=...
# OWNER_EMAIL=your-email@example.com
# FRONTEND_URLS=http://localhost:5173

# Run database migrations
bun run db:migrate

# Better Auth will auto-create its tables on first run

# Seed default categories
bun run db:seed

# Start local development server
bun run dev
```

## Development Workflow

### Bun + Wrangler Commands

```bash
# Install dependencies
bun install

# Start local development server (wrangler dev)
bun run dev

# Deploy to Cloudflare Workers
bun run deploy

# Run linter
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Check formatting
bun run format:check

# Type check (includes test files)
bun run typecheck

# Run all checks (lint + format + typecheck)
bun run check

# Run tests (TDD: write tests first, then implement)
bun test

# Run tests in watch mode
bun test --watch

# Database commands
bun run db:generate  # Generate migration from schema changes
bun run db:migrate   # Run migrations
bun run db:push      # Push schema to database (development)
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed default categories
```

### TDD Workflow

This project follows Test-Driven Development:

1. **Write failing tests first** - Create test files in [`tests/`](tests/) matching the source module structure
2. **Run tests** - Use `bun test` to see tests fail
3. **Implement the feature** - Write the minimum code to make tests pass
4. **Refactor** - Improve code while keeping tests green
5. **Type check** - Run `bun check` to ensure type safety across all files

Test file organization mirrors source structure:

```
backend/
├── src/
│   ├── modules/
│   │   └── auth/
│   │       └── owner-guard.ts    # Source implementation
│   └── ...
└── tests/
    └── modules/
        └── auth/
            └── owner-guard.test.ts  # Tests (TDD)
```

## Project Structure

```
artha-api/
├── src/
│   ├── modules/              # Feature modules (modular monolith)
│   │   ├── auth/            # Better Auth integration + owner guard
│   │   ├── transactions/    # Transaction CRUD
│   │   ├── categories/      # Category CRUD
│   │   └── dashboard/       # Aggregations
│   ├── db/
│   │   ├── index.ts         # Drizzle connection
│   │   ├── schema.ts        # Application tables
│   │   └── seed.ts          # Database seeding
│   ├── middleware/
│   │   ├── cors.ts          # CORS middleware
│   │   ├── error-handler.ts # Error handling
│   │   ├── logging.ts       # Request logging
│   │   └── rate-limit.ts    # Rate limiting
│   ├── lib/
│   │   ├── response.ts      # Standardized responses
│   │   └── currency.ts      # Currency conversion
│   ├── schemas/
│   │   ├── auth.ts          # Auth schemas
│   │   └── common.ts        # Common schemas
│   ├── env.ts               # Environment validation (Zod)
│   ├── factory.ts           # Hono factory with Cloudflare typing
│   └── index.ts             # Hono app entry
├── .dev.vars                # Local development variables
├── wrangler.toml            # Cloudflare Workers configuration
├── drizzle.config.ts        # Drizzle ORM configuration
├── drizzle/
│   └── migrations/           # Database migrations
├── .oxlintrc.json           # oxlint configuration
├── .oxfmt.json              # oxfmt configuration
└── package.json
```

## Key Features

- **Owner-Only Access**: Single user via OAuth (GitHub/Google)
- **Transactions**: Full CRUD with category classification
- **Dashboard**: Monthly aggregations with SQL GROUP BY
- **Categories**: Income/expense categorization
- **Pagination**: Date range filters and pagination
- **Security**: CSRF protection, rate limiting, httpOnly cookies
- **Performance**: Edge deployment, connection pooling
- **Code Quality**: oxlint + oxfmt for consistent, error-free code

## Environment Variables

### Backend (.dev.vars)

```bash
# Database
DATABASE_URL="postgresql://user:pass@neon-host/db?sslmode=require"

# Better Auth
BETTER_AUTH_SECRET="your-better-auth-secret-min-32-characters"
BETTER_AUTH_URL="https://artha.sayyidrafee.com"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Owner Configuration
OWNER_EMAIL="owner@sayyidrafee.com"

# Frontend URLs (comma-separated for multiple)
FRONTEND_URLS="https://artha.sayyidrafee.com,http://localhost:5173"

# Optional: Hyperdrive for database connection pooling
HYPERDRIVE_ID="your-hyperdrive-id"

# Optional: Upstash Redis for rate limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### Frontend (.env.local)

```bash
# API URL
VITE_API_URL="https://artha.sayyidrafee.com"

# Better Auth
VITE_BETTER_AUTH_URL="https://artha.sayyidrafee.com"

# Owner email (for client-side verification)
VITE_OWNER_EMAIL="owner@sayyidrafee.com"
```

## Code Quality Configuration

### oxlint (.oxlintrc.json)

Strict TypeScript rules including:

- Explicit function return types
- No explicit `any` types
- Strict boolean expressions
- Consistent type imports

### oxfmt (.oxfmt.json)

Consistent formatting:

- 100 character print width
- 2-space indentation
- Single quotes
- Trailing commas (ES5)
- LF line endings

### Test-Driven Development (TDD)

This project follows TDD principles with comprehensive test coverage:

```bash
# Run tests
bun test

# Type check (includes test files)
bun check

# Run type check only
bun run typecheck
```

#### Type Safety in Tests

All test files are type-checked via `bun check` before running tests. This ensures:

- **Early Error Detection**: Type errors in tests are caught during `bun check` before running tests
- **Type Safety Across Entire Project**: Ensures test files correctly use your types and schemas
- **Self-Documenting Tests**: Strong types in tests make the expected behavior clearer
- **Refactoring Safety**: When changing types, tests will fail type check if they're incompatible

#### Test Type Definitions

The project includes custom type definitions for Bun's test framework in [`types/bun-test.d.ts`](types/bun-test.d.ts). These extend the base `bun:test` types with:

- Full `expect()` API including `.not` modifier for negative assertions
- All standard matchers (`toBe`, `toEqual`, `toContain`, etc.)

Example test usage:

```typescript
import { describe, it, expect } from "bun:test"

describe("example", () => {
  it("should pass", () => {
    expect(value).toBe(expected)
    expect(value).not.toBe(unexpected)
  })
})
```

### Pre-commit Hooks (Husky)

Linting and formatting are enforced via husky pre-commit hook:

- `bun run typecheck` - TypeScript type checking (including tests)
- `bun run lint` - oxlint linting
- `bun run format:check` - oxfmt format verification

## CI/CD Pipeline

GitHub Actions workflows use Bun for speed:

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

- name: Deploy to Cloudflare
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: deploy
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
- **Cloudflare Workers**: Wrangler support

## Architecture Decisions

### 1. Modular Monolith Pattern

- Feature-based module organization
- Clear boundaries between auth, transactions, categories, and dashboard
- Easy to extract into microservices if needed

### 2. Single-Owner Access Model

- No `user_id` columns in application tables
- Owner verification at authentication layer
- Simplified data model and queries

### 3. Cloudflare Workers Deployment

- Edge deployment for global low latency
- No cold starts, instant scaling
- Built-in observability with Cloudflare Logs and Traces

### 4. Better Auth over JWT

- Built-in OAuth support (GitHub, Google)
- Server-side session management
- CSRF protection out of the box

### 5. Bun + Wrangler + oxlint/oxfmt

- Faster development workflow
- Better code quality enforcement
- Edge-ready deployment

### 6. Monetary Values as Integer Cents

- Store: `Math.round(dollars * 100)` → cents
- Display: `cents / 100` → dollars
- Prevents floating-point errors

## Cloudflare Workers Configuration

### wrangler.toml

```toml
name = "artha-api"
main = "src/index.ts"
compatibility_date = "2026-01-31"
compatibility_flags = ["nodejs_compat"]

[observability]
enabled = true
```

### Key Differences from Vercel

| Aspect | Vercel | Cloudflare Workers |
|--------|--------|-------------------|
| Runtime | Node.js | Edge (V8) |
| Env vars | `process.env` | `c.env` |
| App creation | `new Hono()` | `createApp()` |
| DB connection | Global pool | Per-request |
| Deployment | `vercel deploy` | `wrangler deploy` |

## API Documentation

See [plans/api-endpoints.md](plans/api-endpoints.md) for complete API documentation.

## Database Schema

See [plans/database-schema.md](plans/database-schema.md) for database documentation.

## Deployment

### Backend (Cloudflare Workers)

```bash
# Install dependencies
bun install

# Run all checks
bun run check

# Deploy to Cloudflare Workers
bun run deploy
```

### Frontend (Vercel)

```bash
cd artha-web

# Install dependencies
npm ci

# Deploy
vercel --prod
```

### Post-Deployment Checklist

1. Configure OAuth apps with production callback URLs
2. Set `OWNER_EMAIL` to your verified email in Cloudflare dashboard
3. Run database migrations
4. Seed default categories
5. Test OAuth sign-in flow
6. Verify oxlint and oxfmt in CI/CD

## Documentation

- [Architecture](plans/architecture.md) - System architecture and design decisions
- [API Endpoints](plans/api-endpoints.md) - Complete API documentation
- [Database Schema](plans/database-schema.md) - Database design and migrations
- [Backend Structure](plans/backend-structure.md) - Backend implementation details
- [Frontend Architecture](plans/frontend-architecture.md) - Frontend implementation details
- [Shared Schemas](plans/shared-schemas.md) - Zod schema definitions
- [Vercel to Cloudflare Migration](plans/vercel-to-cloudflare-migration.md) - Migration guide

## Future Expansion

The architecture supports future features:

- **Budgeting**: Add `budgets` table with alert thresholds
- **Data Export**: CSV export endpoint
- **Charts**: Additional dashboard aggregations
- **Recurring Transactions**: Scheduled transaction support
- **Hyperdrive**: Enable connection pooling for better performance

All features must maintain backward compatibility with existing API contracts.

## License

MIT
