# Artha Frontend Architecture - React 19 + Vite

## Toolchain: Bun + oxlint + oxfmt

This project uses **Bun** for development workflows while retaining npm for production deployments. Code quality is enforced by **oxlint** (linting) and **oxfmt** (formatting).

## Project Structure

```
artha-web/
├── src/
│   ├── modules/                 # Feature modules
│   │   ├── auth/               # Authentication module
│   │   │   ├── components/
│   │   │   │   ├── login-button.tsx
│   │   │   │   └── logout-button.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-auth.ts
│   │   │   └── pages/
│   │   │       └── login.tsx
│   │   ├── dashboard/          # Dashboard module
│   │   │   ├── components/
│   │   │   │   ├── summary-cards.tsx
│   │   │   │   └── category-breakdown.tsx
│   │   │   └── pages/
│   │   │       └── dashboard.tsx
│   │   └── transactions/       # Transactions module
│   │       ├── components/
│   │       │   ├── transaction-list.tsx
│   │       │   └── transaction-form.tsx
│   │       └── pages/
│   │           └── transactions.tsx
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── query-client.ts     # TanStack Query config
│   │   └── utils.ts            # Utilities
│   ├── schemas/                # Zod schemas
│   ├── App.tsx
│   └── main.tsx
├── .oxlintrc.json              # oxlint configuration
├── .oxfmt.json                 # oxfmt configuration
├── bun.lockb                   # Bun lockfile
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Package.json

```json
{
  "name": "artha-web",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "bunx --bun vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "oxlint . --config .oxlintrc.json",
    "lint:fix": "oxlint . --config .oxlintrc.json --fix",
    "format": "oxfmt . --config .oxfmt.json",
    "format:check": "oxfmt . --config .oxfmt.json --check",
    "typecheck": "tsc --noEmit",
    "check": "bun run typecheck && bun run lint && bun run format:check",
    "ci:install": "npm ci",
    "ci:build": "npm run build",
    "ci:test": "bun test"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.90.20",
    "better-auth": "^1.4.18",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.300.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-hook-form": "^7.50.0",
    "react-router-dom": "^6.21.0",
    "tailwind-merge": "^2.2.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "oxfmt": "^0.1.0",
    "oxlint": "^0.15.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

## oxlint Configuration

### .oxlintrc.json

```json
{
  "env": {
    "browser": true,
    "es2022": true
  },
  "extends": [
    "oxlint:recommended",
    "oxlint:typescript",
    "oxlint:react"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": ["error", {
      "allowExpressions": true,
      "allowTypedFunctionExpressions": true
    }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": ["warn", { "allow": ["error", "warn", "info"] }],
    "no-debugger": "error",
    "prefer-const": "error",
    "no-var": "error"
  },
  "ignorePatterns": [
    "dist/",
    "node_modules/",
    "*.config.ts",
    "*.config.js"
  ]
}
```

## oxfmt Configuration

### .oxfmt.json

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "parser": "json"
      }
    },
    {
      "files": "*.css",
      "options": {
        "parser": "css"
      }
    }
  ],
  "ignore": [
    "dist/",
    "node_modules/",
    "bun.lockb"
  ]
}
```

## TanStack Query Configuration

### src/lib/query-client.ts

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex: number): number =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount: number, error: Error): boolean => {
        if (error.message.includes('Network')) {
          return failureCount < 2;
        }
        return false;
      },
    },
  },
});
```

### Query Keys Factory

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters: Record<string, unknown>): readonly string[] =>
      [...queryKeys.transactions.all, 'list', JSON.stringify(filters)] as const,
    detail: (id: string): readonly string[] =>
      [...queryKeys.transactions.all, 'detail', id] as const,
  },
  dashboard: {
    summary: (year: number, month?: number): readonly string[] =>
      ['dashboard', 'summary', String(year), month ? String(month) : 'all'] as const,
    byCategory: (year: number, month?: number): readonly string[] =>
      ['dashboard', 'byCategory', String(year), month ? String(month) : 'all'] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (): readonly string[] => [...queryKeys.categories.all, 'list'] as const,
  },
};
```

## Better Auth Client Setup

### src/lib/auth-client.ts

```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
});

// Export typed auth client
export type AuthClient = typeof authClient;
```

## API Client

### src/lib/api.ts

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for session cookies
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || 'An error occurred';
    const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
    
    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    
    // Handle 403 - owner only
    if (error.response?.status === 403) {
      window.location.href = '/unauthorized';
    }
    
    return Promise.reject({ message, code, status: error.response?.status });
  }
);
```

## Authentication Module

### src/modules/auth/hooks/use-auth.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { queryKeys } from '@/lib/query-keys';
import type { User } from '@/schemas/auth';

interface SessionData {
  user: User;
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: string;
  };
}

export function useSession() {
  return useQuery<SessionData | null>({
    queryKey: queryKeys.auth.session,
    queryFn: async (): Promise<SessionData | null> => {
      const { data } = await authClient.getSession();
      return data as SessionData | null;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (provider: 'github' | 'google'): Promise<void> => {
      await authClient.signIn.social({ provider });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await authClient.signOut();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });
}

export function useIsOwner(): {
  isOwner: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const { data: session } = useSession();
  const ownerEmail = import.meta.env.VITE_OWNER_EMAIL;
  
  return {
    isOwner: session?.user?.email === ownerEmail,
    isAuthenticated: !!session,
    isLoading: !session,
  };
}
```

### src/modules/auth/components/login-button.tsx

```typescript
import { Github, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSignIn } from '../hooks/use-auth';

interface LoginButtonProps {
  provider: 'github' | 'google';
}

export function LoginButton({ provider }: LoginButtonProps): JSX.Element {
  const signIn = useSignIn();
  
  const Icon = provider === 'github' ? Github : Chrome;
  const label = provider === 'github' ? 'GitHub' : 'Google';
  
  return (
    <Button
      onClick={() => signIn.mutate(provider)}
      disabled={signIn.isPending}
      className="w-full"
      variant={provider === 'github' ? 'default' : 'outline'}
    >
      <Icon className="mr-2 h-4 w-4" />
      {signIn.isPending ? 'Connecting...' : `Sign in with ${label}`}
    </Button>
  );
}
```

### src/modules/auth/pages/login.tsx

```typescript
import { LoginButton } from '../components/login-button';

export function LoginPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Artha</h1>
          <p className="mt-2 text-muted-foreground">
            Personal Finance Tracker
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Owner access only. Please sign in with your authorized account.
          </p>
        </div>
        
        <div className="space-y-4">
          <LoginButton provider="github" />
          <LoginButton provider="google" />
        </div>
      </div>
    </div>
  );
}
```

## Protected Route Component

### src/components/protected-route.tsx

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '@/modules/auth/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const { data: session, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

## Transaction Hooks

### src/modules/transactions/hooks/use-transactions.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { 
  Transaction, 
  CreateTransactionInput, 
  UpdateTransactionInput,
  TransactionFilter 
} from '@/schemas/transaction';
import type { ApiResponse, PaginationMeta } from '@/schemas/common';

interface TransactionsResponse {
  data: Transaction[];
  meta: PaginationMeta;
}

export function useTransactions(filters: TransactionFilter) {
  return useQuery<ApiResponse<TransactionsResponse>>({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: async () => api.get('/transactions', { params: filters }),
    staleTime: 30 * 1000,
  });
}

export function useTransaction(id: string) {
  return useQuery<ApiResponse<Transaction>>({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: async () => api.get(`/transactions/${id}`),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => 
      api.post('/transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransactionInput }) => 
      api.put(`/transactions/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.transactions.detail(variables.id) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

## Currency Utilities

### src/lib/currency.ts

```typescript
export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}
```

## Vite Configuration

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          forms: ['react-hook-form', 'zod'],
          auth: ['better-auth'],
        },
      },
    },
  },
});
```

## Environment Variables

### .env.local

```bash
# API URL
VITE_API_URL=https://artha.sayyidrafee.com/api

# Better Auth
VITE_BETTER_AUTH_URL=https://artha.sayyidrafee.com/api

# Owner email (for client-side verification if needed)
VITE_OWNER_EMAIL=owner@sayyidrafee.com
```

### .env.production

```bash
VITE_API_URL=https://artha.sayyidrafee.com/api
VITE_BETTER_AUTH_URL=https://artha.sayyidrafee.com/api
VITE_OWNER_EMAIL=owner@sayyidrafee.com
```

## Development Workflow with Bun

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies with Bun
bun install
```

### Development Commands

```bash
# Start development server with hot reload
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

### Production Commands (npm)

```bash
# Install dependencies (CI/production)
npm ci

# Build for production
npm run build

# Preview production build
npm run preview
```

## CI/CD Pipeline (GitHub Actions)

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
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

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build
```

## IDE Configuration

### VS Code Settings (.vscode/settings.json)

```json
{
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.oxlint": "explicit"
  },
  "oxlint.enable": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

### VS Code Extensions

- **oxc.oxc-vscode**: oxlint and oxfmt support
- **bradlc.vscode-tailwindcss**: Tailwind CSS IntelliSense
- **dbaeumer.vscode-eslint**: Disabled (replaced by oxlint)
- **esbenp.prettier-vscode**: Disabled (replaced by oxfmt)

## Key Implementation Notes

1. **React 19 Features**
   - Use new hooks like `use()` for data fetching
   - Automatic memoization with compiler (when available)
   - Improved Suspense boundaries

2. **Better Auth Integration**
   - Client-side auth state via `useSession()`
   - OAuth sign-in via `signIn.social()`
   - Session cookies handled automatically

3. **Owner-Only UI**
   - No registration page
   - Simple login with OAuth providers
   - Clear messaging about owner access

4. **Caching Strategy**
   - Transactions: 30 seconds stale time
   - Dashboard: 1 minute stale time
   - Auth session: 5 minutes stale time

5. **Error Handling**
   - 401 redirects to login
   - 403 redirects to unauthorized page
   - Toast notifications for mutations

6. **Bun for Development**
   - Faster package installation
   - Built-in test runner
   - Native TypeScript support

7. **npm for Production**
   - Vercel uses npm for builds
   - Standard Node.js runtime
   - Compatible with all hosting platforms
