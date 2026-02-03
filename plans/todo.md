# Artha Personal Finance Tracker - Implementation Todo

## Phase 1: Project Structure & Architecture Design

- [x] Define project name "Artha" with Sanskrit meaning
- [x] Document repository URLs (artha-web, artha-api)
- [x] Define tech stack versions (React 19.2.4, TanStack Query 5.90.20, Zod 4.3.6, Hono 4.11.7, PostgreSQL 18/Neon, Drizzle 0.45.1, Better Auth 1.4.18)
- [x] Design modular monolith architecture pattern
- [x] Design single-user owner-only access model
- [x] Document domain: artha.sayyidrafee.com
- [x] Design Better Auth integration (replacing JWT)
- [x] Document environment variables for both projects
- [x] Identify domino effects of owner-only access model
- [x] Define Bun runtime for development, npm for production
- [x] Define oxlint and oxfmt toolchain for code quality

## Phase 2: Backend Implementation (artha-api)

### 2.1 Project Setup
- [ ] Initialize artha-api project with TypeScript
- [ ] Install Bun runtime (development)
- [ ] Install dependencies with Bun:
  - [ ] hono@^4.11.7
  - [ ] drizzle-orm@^0.45.1
  - [ ] @neondatabase/serverless
  - [ ] better-auth@^1.4.18
  - [ ] zod@^4.3.6
- [ ] Install dev dependencies with Bun:
  - [ ] oxlint@^0.15.0
  - [ ] oxfmt@^0.1.0
  - [ ] typescript@^5.3.0
  - [ ] drizzle-kit@^0.30.0
  - [ ] @types/node
- [ ] Configure TypeScript with strict mode
- [ ] Set up modular monolith structure (src/modules/)
- [ ] Configure oxlint (.oxlintrc.json) with strict TypeScript rules
- [ ] Configure oxfmt (.oxfmt.json) for code formatting
- [ ] Add package.json scripts for Bun development workflow
- [ ] Add package.json scripts for npm production workflow

### 2.2 Better Auth Setup
- [ ] Configure Better Auth with Drizzle adapter
- [ ] Set up OAuth providers (GitHub, Google)
- [ ] Configure session cookies (httpOnly, Secure, SameSite=Strict)
- [ ] Implement owner-only middleware
- [ ] Create auth module structure

### 2.3 Database Layer
- [ ] Configure Neon PostgreSQL connection with pooling
- [ ] Set up Drizzle ORM configuration
- [ ] Create application schema (categories, transactions)
  - [ ] Note: No user_id columns (owner-only model)
- [ ] Generate and run initial migration
- [ ] Add indexes on transaction_date and category_id
- [ ] Seed default categories

### 2.4 Middleware Stack
- [ ] Configure Hono with explicit CORS (artha.sayyidrafee.com)
- [ ] Create request logging middleware
- [ ] Implement rate limiting (auth: 5/min, api: 100/min)
- [ ] Create error handling middleware
- [ ] Add owner-only access middleware

### 2.5 Transaction Module
- [ ] Create transaction routes
- [ ] Implement transaction service layer
- [ ] Create transaction Zod schemas
- [ ] GET /transactions (pagination, filters)
- [ ] POST /transactions (create)
- [ ] GET /transactions/:id (get one)
- [ ] PUT /transactions/:id (update)
- [ ] DELETE /transactions/:id (delete)

### 2.6 Category Module
- [ ] Create category routes
- [ ] Implement category service layer
- [ ] Create category Zod schemas
- [ ] GET /categories (list all)
- [ ] POST /categories (create)
- [ ] PUT /categories/:id (update)
- [ ] DELETE /categories/:id (delete)

### 2.7 Dashboard Module
- [ ] Create dashboard routes
- [ ] Implement dashboard service layer
- [ ] GET /dashboard/summary (monthly aggregations)
- [ ] GET /dashboard/by-category (category breakdown)
- [ ] SQL GROUP BY queries for aggregations

### 2.8 Code Quality & Tooling
- [ ] Run oxlint and fix all issues
- [ ] Run oxfmt and format all files
- [ ] Set up pre-commit hooks for linting/formatting
- [ ] Configure VS Code settings for oxlint/oxfmt

### 2.9 Deployment Configuration
- [ ] Configure vercel.json for Functions deployment
- [ ] Set up environment variables
- [ ] Optimize for cold starts
- [ ] Add health check endpoint

## Phase 3: Frontend Implementation (artha-web)

### 3.1 Project Setup
- [ ] Initialize artha-web with Vite + React 19.2.4 + TypeScript
- [ ] Install Bun runtime (development)
- [ ] Install dependencies with Bun:
  - [ ] react@^19.2.4
  - [ ] @tanstack/react-query@^5.90.20
  - [ ] better-auth@^1.4.18
  - [ ] zod@^4.3.6
  - [ ] react-hook-form
  - [ ] react-router-dom
  - [ ] tailwindcss
  - [ ] shadcn/ui components
- [ ] Install dev dependencies with Bun:
  - [ ] oxlint@^0.15.0
  - [ ] oxfmt@^0.1.0
  - [ ] typescript@^5.3.0
  - [ ] vite@^5.0.0
  - [ ] @vitejs/plugin-react
- [ ] Configure TypeScript with strict mode
- [ ] Set up modular structure (src/modules/)
- [ ] Configure oxlint (.oxlintrc.json) with React and TypeScript rules
- [ ] Configure oxfmt (.oxfmt.json) for code formatting
- [ ] Add package.json scripts for Bun development workflow
- [ ] Add package.json scripts for npm production workflow

### 3.2 Better Auth Integration
- [ ] Create Better Auth client configuration
- [ ] Implement useSession hook
- [ ] Create OAuth sign-in buttons (GitHub, Google)
- [ ] Implement sign-out functionality
- [ ] Create ProtectedRoute component

### 3.3 State Management
- [ ] Configure TanStack Query client
- [ ] Set up query keys factory
- [ ] Configure stale-while-revalidate caching
- [ ] Set up API client with axios

### 3.4 Authentication UI
- [ ] Build Login page with OAuth buttons
- [ ] Add owner-only access messaging
- [ ] Create loading states for auth
- [ ] Handle 401/403 errors

### 3.5 Dashboard Module
- [ ] Build Dashboard page layout
- [ ] Create Summary cards component
  - [ ] Income total
  - [ ] Expense total
  - [ ] Balance calculation
- [ ] Create Category breakdown component
- [ ] Implement month/year filtering
- [ ] Currency formatting (cents to display)

### 3.6 Transaction Module
- [ ] Build TransactionList component
  - [ ] Pagination
  - [ ] Date range filters
  - [ ] Category filter
- [ ] Create TransactionForm component
  - [ ] Add transaction
  - [ ] Edit transaction
- [ ] Create TransactionCard/Row component
- [ ] Implement delete with confirmation

### 3.7 Category Module
- [ ] Build CategoryList component
- [ ] Create CategoryForm component
- [ ] Implement category CRUD operations

### 3.8 Shared Components
- [ ] Set up shadcn/ui
- [ ] Create Button, Input, Select components
- [ ] Build Modal/Dialog component
- [ ] Create DatePicker component
- [ ] Build LoadingSpinner component
- [ ] Create ErrorBoundary

### 3.9 Utilities
- [ ] Copy Zod schemas from shared documentation
- [ ] Create currency formatter
- [ ] Build date formatting utilities
- [ ] Add error message mapping

### 3.10 Code Quality & Tooling
- [ ] Run oxlint and fix all issues
- [ ] Run oxfmt and format all files
- [ ] Set up pre-commit hooks for linting/formatting
- [ ] Configure VS Code settings for oxlint/oxfmt

### 3.11 Deployment
- [ ] Configure Vite for production
- [ ] Set up Vercel deployment
- [ ] Configure environment variables

## Phase 4: Shared Schema & Type Safety

- [ ] Create shared Zod schemas:
  - [ ] auth.ts (Better Auth types, no registration)
  - [ ] transaction.ts (CRUD, filters)
  - [ ] category.ts (CRUD)
  - [ ] dashboard.ts (aggregations)
  - [ ] common.ts (responses, pagination)
- [ ] Copy schemas to artha-api/src/schemas/
- [ ] Copy schemas to artha-web/src/schemas/
- [ ] Ensure end-to-end type safety

## Phase 5: Database Optimization

- [ ] Create Drizzle migration files
- [ ] Add index: idx_transactions_date
- [ ] Add index: idx_transactions_date_category (composite)
- [ ] Add index: idx_transactions_category_id
- [ ] Seed default categories:
  - [ ] Income: Salary, Freelance, Investment, Gift, Other Income
  - [ ] Expense: Food & Dining, Transportation, Utilities, Entertainment, Healthcare, Shopping, Education, Housing, Other Expense

## Phase 6: OAuth Provider Setup

### 6.1 GitHub OAuth
- [ ] Create GitHub OAuth App
- [ ] Configure callback URL: https://artha.sayyidrafee.com/api/auth/callback/github
- [ ] Add Client ID and Secret to environment

### 6.2 Google OAuth (Optional)
- [ ] Create Google OAuth 2.0 credentials
- [ ] Configure callback URL: https://artha.sayyidrafee.com/api/auth/callback/google
- [ ] Add Client ID and Secret to environment

## Phase 7: Testing & Quality Assurance

### 7.1 Backend Tests
- [ ] Test Better Auth OAuth flow
- [ ] Test owner-only middleware
- [ ] Test transaction CRUD
- [ ] Test dashboard aggregations
- [ ] Test rate limiting
- [ ] Verify CORS configuration
- [ ] Run oxlint - no errors
- [ ] Run oxfmt - all files formatted

### 7.2 Frontend Tests
- [ ] Test authentication flow
- [ ] Test protected routes
- [ ] Test form validations
- [ ] Test data fetching with TanStack Query
- [ ] Test error handling
- [ ] Run oxlint - no errors
- [ ] Run oxfmt - all files formatted

### 7.3 Integration Tests
- [ ] End-to-end OAuth sign-in
- [ ] Transaction CRUD flow
- [ ] Dashboard data loading
- [ ] Session persistence

## Phase 8: Documentation & Deployment

- [ ] Update README with setup instructions
- [ ] Document Bun installation and usage
- [ ] Document oxlint/oxfmt configuration
- [ ] Document OAuth provider setup
- [ ] Create deployment guide
- [ ] Document environment variables
- [ ] Add architecture decision records
- [ ] Deploy to Vercel
- [ ] Configure production domain
- [ ] Test production OAuth flow

## Phase 9: CI/CD Pipeline Setup

### 9.1 GitHub Actions for Backend
- [ ] Create .github/workflows/ci.yml
- [ ] Setup Bun in CI environment
- [ ] Add oxlint check step
- [ ] Add oxfmt check step
- [ ] Add type check step
- [ ] Add test step
- [ ] Add build step

### 9.2 GitHub Actions for Frontend
- [ ] Create .github/workflows/ci.yml
- [ ] Setup Bun in CI environment
- [ ] Add oxlint check step
- [ ] Add oxfmt check step
- [ ] Add type check step
- [ ] Add build step

### 9.3 Pre-commit Hooks
- [ ] Configure lefthook or simple-git-hooks
- [ ] Add oxlint pre-commit hook
- [ ] Add oxfmt pre-commit hook

## Phase 10: IDE Configuration

- [ ] Create .vscode/settings.json for both repos
- [ ] Configure default formatter (oxfmt)
- [ ] Configure format on save
- [ ] Configure oxlint integration
- [ ] Document recommended VS Code extensions
- [ ] Disable ESLint and Prettier extensions

## Critical Implementation Notes

### Bun Development Workflow
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Development server
bun run dev

# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format
bun run format:check

# Type checking
bun run typecheck

# All checks
bun run check
```

### npm Production Workflow
```bash
# Install dependencies (CI/production)
npm ci

# Build
npm run build

# Start
npm start  # backend
# or serve static files  # frontend
```

### Owner-Only Access Model
- **No Registration**: Better Auth sign-in only, no register endpoint
- **Owner Verification**: Middleware checks `OWNER_EMAIL` environment variable
- **No user_id in tables**: Application tables don't track ownership
- **Single Session**: Only one owner session at a time

### Better Auth Configuration
- Session expires in 7 days
- Cookies: httpOnly, Secure, SameSite=Strict
- OAuth providers: GitHub (primary), Google (optional)
- No email/password in production (OAuth only)

### Monetary Values
- **ALWAYS** store as integer cents in database
- **ONLY** divide by 100 in presentation layer
- Use `Math.round()` to avoid floating point issues

### Security
- CSRF protection via Better Auth
- Rate limiting on auth endpoints (5 req/min)
- Rate limiting on API (100 req/min)
- CORS exact URL matching
- Input validation with Zod

### Performance
- Keep global scope lean for cold starts
- Use Neon connection pooling
- TanStack Query SWR caching (5min stale, 10min cache)
- Database indexes on date and category columns

### Code Quality (oxlint + oxfmt)
- Strict TypeScript rules enabled
- Explicit function return types required
- No explicit `any` types
- Consistent type imports
- Automatic formatting on save
- Pre-commit hooks enforce quality
