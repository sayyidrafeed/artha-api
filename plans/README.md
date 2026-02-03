# Artha - Personal Finance Tracker

**Artha** (Sanskrit: अर्थ, meaning "wealth, prosperity") is a production-ready personal finance tracker built with a modular monolith architecture optimized for maintainability, extensibility, and Vercel deployment.

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
| Authentication | Better Auth | 1.4.18 |
| Database | Neon PostgreSQL | 18 |
| ORM | Drizzle ORM | 0.45.1 |
| Development Runtime | Bun | latest |
| Linter | oxlint | ^0.15.0 |
| Formatter | oxfmt | ^0.1.0 |

## Development Toolchain: Bun + oxlint + oxfmt

This project uses **Bun** for development workflows while retaining **npm** for production deployments:

- **Bun**: Fast package management, development server, and test runner
- **oxlint**: High-performance linting with strict TypeScript rules
- **oxfmt**: Fast, consistent code formatting
- **npm**: Production builds and CI/CD compatibility

### Why Bun + oxlint/oxfmt?

- **Speed**: Bun installs dependencies 3x faster than npm
- **Performance**: oxlint is 50-100x faster than ESLint
- **Consistency**: oxfmt provides deterministic formatting
- **Compatibility**: npm ensures production deployment compatibility

## Single-User Owner-Only Access

Artha is designed for **single-owner access only**. There is no public registration:

- **Pre-seeded Owner Account**: The owner account is created via OAuth sign-in
- **Verified Account Required**: Only the owner email can authenticate
- **No Registration Endpoint**: No `/auth/register` endpoint exposed
- **OAuth-First**: Primary authentication via GitHub OAuth or Google OAuth

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed
- Node.js 20+ (for production builds)
- Neon PostgreSQL database
- GitHub OAuth App (for authentication)
- Google OAuth App (optional)
- Vercel account

### 1. Clone Repositories

```bash
# Clone frontend
git clone https://github.com/sayyidrafeed/artha-web.git
cd artha-web

# Clone backend
git clone https://github.com/sayyidrafeed/artha-api.git
cd ../artha-api
```

### 2. Backend Setup (artha-api)

```bash
cd artha-api

# Install dependencies with Bun
bun install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values:
# DATABASE_URL=postgresql://...
# BETTER_AUTH_SECRET=...
# GITHUB_CLIENT_ID=...
# GITHUB_CLIENT_SECRET=...
# OWNER_EMAIL=your-email@example.com

# Run database migrations
bun run db:migrate

# Better Auth will auto-create its tables on first run

# Seed default categories
bun run db:seed

# Start development server with hot reload
bun run dev
```

### 3. Frontend Setup (artha-web)

```bash
cd artha-web

# Install dependencies with Bun
bun install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your values:
# VITE_API_URL=https://artha.sayyidrafee.com/api
# VITE_BETTER_AUTH_URL=https://artha.sayyidrafee.com/api

# Start development server
bun run dev
```

## Development Workflow

### Bun Commands (Development)

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

# Run tests
bun test
```

### npm Commands (Production/CI)

```bash
# Install dependencies (CI/production)
npm ci

# Build for production
npm run build

# Start production server (backend)
npm start
```

## Project Structure

```
artha/
├── artha-api/              # Backend repository
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Better Auth integration
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   └── dashboard/
│   │   ├── db/            # Drizzle ORM
│   │   └── lib/           # Utilities
│   ├── .oxlintrc.json     # oxlint configuration
│   ├── .oxfmt.json        # oxfmt configuration
│   ├── bun.lockb          # Bun lockfile
│   └── drizzle/           # Migrations
│
├── artha-web/             # Frontend repository
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   ├── components/    # UI components
│   │   └── lib/           # Utilities
│   ├── .oxlintrc.json     # oxlint configuration
│   ├── .oxfmt.json        # oxfmt configuration
│   ├── bun.lockb          # Bun lockfile
│   └── public/
│
└── plans/                 # Documentation
    ├── architecture.md
    ├── api-endpoints.md
    ├── database-schema.md
    ├── backend-structure.md
    ├── frontend-architecture.md
    └── todo.md
```

## Key Features

- **Owner-Only Access**: Single user via OAuth (GitHub/Google)
- **Transactions**: Full CRUD with category classification
- **Dashboard**: Monthly aggregations with SQL GROUP BY
- **Categories**: Income/expense categorization
- **Pagination**: Date range filters and pagination
- **Security**: CSRF protection, rate limiting, httpOnly cookies
- **Performance**: SWR caching, connection pooling
- **Code Quality**: oxlint + oxfmt for consistent, error-free code

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
- React hooks rules

### oxfmt (.oxfmt.json)

Consistent formatting:
- 100 character print width
- 2-space indentation
- Single quotes
- Trailing commas (ES5)
- LF line endings

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

## Architecture Decisions

### 1. Modular Monolith Pattern
- Feature-based module organization
- Clear boundaries between auth, transactions, categories, and dashboard
- Easy to extract into microservices if needed

### 2. Single-Owner Access Model
- No `user_id` columns in application tables
- Owner verification at authentication layer
- Simplified data model and queries

### 3. Better Auth over JWT
- Built-in OAuth support (GitHub, Google)
- Server-side session management
- CSRF protection out of the box

### 4. Bun + oxlint/oxfmt
- Faster development workflow
- Better code quality enforcement
- npm for production compatibility

### 5. Monetary Values as Integer Cents
- Store: `Math.round(dollars * 100)` → cents
- Display: `cents / 100` → dollars
- Prevents floating-point errors

## API Documentation

See [plans/api-endpoints.md](plans/api-endpoints.md) for complete API documentation.

## Database Schema

See [plans/database-schema.md](plans/database-schema.md) for database documentation.

## Deployment

### Backend (Vercel Functions)

```bash
cd artha-api

# Install with npm for production
npm ci

# Deploy
vercel --prod
```

### Frontend (Vercel Edge)

```bash
cd artha-web

# Install with npm for production
npm ci

# Deploy
vercel --prod
```

### Post-Deployment Checklist

1. Configure OAuth apps with production callback URLs
2. Set `OWNER_EMAIL` to your verified email
3. Run database migrations
4. Seed default categories
5. Test OAuth sign-in flow
6. Verify oxlint and oxfmt in CI/CD

## Documentation

- [Architecture](plans/architecture.md) - System architecture and design decisions
- [API Endpoints](plans/api-endpoints.md) - Complete API documentation
- [Database Schema](plans/database-schema.md) - Database design and migrations
- [Backend Structure](plans/backend-structure.md) - Backend implementation with Bun/oxlint
- [Frontend Architecture](plans/frontend-architecture.md) - Frontend implementation with Bun/oxlint
- [Shared Schemas](plans/shared-schemas.md) - Zod schema definitions

## Future Expansion

The architecture supports future features:

- **Budgeting**: Add `budgets` table with alert thresholds
- **Data Export**: CSV export endpoint
- **Charts**: Additional dashboard aggregations
- **Recurring Transactions**: Scheduled transaction support

All features must maintain backward compatibility with existing API contracts.

## License

MIT
