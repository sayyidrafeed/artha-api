# Hono Migration Guide: Vercel to Cloudflare Workers

A comprehensive guide for migrating a Hono application from Vercel (Node.js) to Cloudflare Workers, based on patterns learned from the PWN backend project.

## Overview

This guide documents the key patterns, skills, and architectural decisions needed to migrate a Hono application from Vercel's Node.js runtime to Cloudflare Workers' edge runtime.

---

## 1. Environment Variables: process.env vs c.env

### The Core Difference

**Vercel (Node.js):**
```typescript
// ✅ Works in Vercel
const dbUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_KEY;
```

**Cloudflare Workers:**
```typescript
// ❌ Undefined in Workers - will crash!
const dbUrl = process.env.DATABASE_URL;

// ✅ Access via context
app.get("/", (c) => {
  const dbUrl = c.env.DATABASE_URL;
  // ...
});
```

### Recommended Pattern: Zod Schema Validation

Define environment variables with Zod for type safety:

```typescript
// src/env.ts
import { z } from "zod";

export const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  FRONTEND_URLS: z.string().min(1).transform((val) =>
    val.split(",").map((url) => url.trim()).filter(Boolean)
  ),
  NODE_ENV: z.enum(["development", "production"]).optional(),
});

export type Env = z.infer<typeof EnvSchema>;
```

### Apply Middleware in app.ts

```typescript
// src/app.ts
import { EnvSchema } from "./env";

app.use("*", async (c, next) => {
  const result = EnvSchema.safeParse(c.env);
  if (!result.success) {
    return c.json({ 
      message: "Server misconfiguration", 
      errors: result.error.issues.map((i) => i.message) 
    }, 500);
  }
  await next();
});
```

---

## 2. Factory Pattern for Type Safety

### The Problem

In Vercel, you might create Hono instances directly:
```typescript
// Works in Vercel - DON'T do this in Workers
import { Hono } from "hono";
const app = new Hono();
```

This loses type safety for your environment bindings in Cloudflare Workers.

### The Solution: Centralized Factory

Create a factory that centralizes type definitions:

```typescript
// src/factory.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { createFactory } from "hono/factory";
import type { Env } from "./env";

/** Request-scoped variables */
export type AppVariables = {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
  requestId?: string;
};

/** Full environment type with Bindings */
export type AppEnv = {
  Bindings: Env & {
    // Cloudflare-specific bindings
    BUCKET?: R2Bucket;
  };
  Variables: AppVariables;
};

export const factory = createFactory<AppEnv>();

export const createRouter = (): OpenAPIHono<AppEnv> =>
  new OpenAPIHono<AppEnv>();
```

### Usage in Modules

```typescript
// src/modules/users/users.index.ts
import { createRouter } from "@/factory";

export const usersRouter = createRouter();

// Routes now have full type safety
usersRouter.get("/me", (c) => {
  const user = c.get("user"); // Typed as AppVariables["user"]
  // ...
});
```

---

## 3. Database Connection: Request-Scoped Instances

### Critical: No Global Caching

In Vercel (Node.js), you might cache database connections globally:

```typescript
// Works in Vercel - DON'T do this in Workers
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);
```

### The Cloudflare Workers Pattern

Database connections must be created **per-request**:

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import type { Env } from "../env";

/**
 * Creates a fresh database instance for each request.
 * IMPORTANT: Do NOT cache database instances globally in Cloudflare Workers.
 * Database connections created in one request context cannot be
 * accessed from another request's handler due to Cloudflare's isolation model.
 */
export const getDb = (env: Env) => {
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  return drizzle(pool, { schema });
};
```

### Using Hyperdrive for Connection Pooling

Cloudflare Hyperdrive provides connection pooling at the edge:

```typescript
// wrangler.jsonc
{
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      "id": "your-hyperdrive-id",
      "localConnectionString": "postgresql://user:pass@localhost/db"
    }
  ]
}
```

```typescript
// src/db/index.ts - Use Hyperdrive in production
export const getDb = (env: Env) => {
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  return drizzle(pool, { schema });
};
```

---

## 4. Authentication: Better Auth Configuration

### Vercel Setup

```typescript
// Vercel typically uses standard cookie sessions
export const auth = betterAuth({
  database: "postgresql",
  databaseUrl: process.env.DATABASE_URL,
  // ...
});
```

### Cloudflare Workers: Cache Auth Instance

```typescript
// src/auth.ts
import { betterAuth } from "better-auth";
import type { Env } from "./env";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = (env: Env) => {
  if (!authInstance) {
    authInstance = betterAuth({
      database: {
        provider: "postgresql",
        url: env.DATABASE_URL,
      },
      emailAndPassword: {
        enabled: false,
      },
      googleOAuth: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      trustedOrigins: env.FRONTEND_URLS,
    });
  }
  return authInstance;
};
```

### CORS Middleware

CORS must be handled properly for OAuth redirects:

```typescript
// src/middlewares/cors.ts
import { cors } from "hono/cors";

export const corsMiddleware = cors({
  origin: (origin, c) => {
    const allowed = c.env.FRONTEND_URLS;
    return allowed.includes(origin) ? origin : allowed[0];
  },
  credentials: true,
});
```

---

## 5. OpenAPI Documentation with @hono/zod-openapi

### Define Routes with createRoute

```typescript
// src/modules/quiz/quiz.routes.ts
import { createRoute, z } from "@hono/zod-openapi";

export const getQuizRoute = createRoute({
  method: "get",
  path: "/quiz/{id}",
  tags: ["Quiz"],
  summary: "Get quiz by ID",
  request: {
    params: z.object({
      id: z.string().cuid(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            title: z.string(),
            questions: z.array(z.object({
              id: z.string(),
              text: z.string(),
            })),
          }),
        },
      },
      description: "Quiz details",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Quiz not found",
    },
  },
});
```

### Important: Use z.string().datetime() Not z.date()

```typescript
// ✅ Correct - z.date() crashes in OpenAPI
schema: z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ❌ Wrong - will crash when generating OpenAPI spec
schema: z.object({
  createdAt: z.date(),
});
```

### Mount Routes

```typescript
// src/modules/quiz/quiz.handlers.ts
import { getDb } from "@/db";
import { getQuizRoute } from "./quiz.routes";

export const getQuizHandler = async (c: AppContext) => {
  const { id } = c.req.valid("params");
  const db = getDb(c.env);
  
  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, id),
  });
  
  if (!quiz) {
    return c.json({ message: "Quiz not found" }, 404);
  }
  
  return c.json(quiz, 200);
};

// src/modules/quiz/index.ts
import { createRouter } from "@/factory";
import { getQuizRoute } from "./quiz.routes";
import { getQuizHandler } from "./quiz.handlers";

export const quizRouter = createRouter();

quizRouter.openapi(getQuizRoute, getQuizHandler);
```

---

## 6. Module Architecture: Vertical Slices

### Directory Structure

```
src/
├── modules/
│   ├── auth/           # Better Auth handler
│   │   └── index.ts
│   ├── users/          # User domain
│   │   ├── users.routes.ts
│   │   ├── users.handlers.ts
│   │   ├── users.schema.ts
│   │   ├── users.service.ts
│   │   └── users.index.ts
│   ├── quiz/           # Quiz domain
│   │   ├── quiz.routes.ts
│   │   ├── quiz.handlers.ts
│   │   ├── quiz.schema.ts
│   │   ├── quiz.service.ts
│   │   └── quiz.index.ts
│   └── promo/         # Promo domain
│       └── ...
```

### Module Index Pattern

```typescript
// src/modules/users/users.index.ts
import { createRouter } from "@/factory";
import { usersRouter } from "./users.routes";
import { getMeHandler } from "./users.handlers";

export const usersRouter = createRouter();

usersRouter.openapi(getMeRoute, getMeHandler);
```

### Mount in app.ts

```typescript
// src/app.ts
import { usersRouter } from "./modules/users/users.index";
import { quizRouter } from "./modules/quiz";
import { promoRouter } from "./modules/promo";

const app = createRouter();

// Mount modules
app.route("/api/users", usersRouter);
app.route("/api/quiz", quizRouter);
app.route("/api/promo", promoRouter);
```

---

## 7. Service Layer: Pure Business Logic

### Don't Pass Hono Context to Services

```typescript
// ✅ Good - testable, pure functions
// src/services/quiz.service.ts
export const calculateScore = (answers: QuizAnswer[]): number => {
  return answers.reduce((total, answer) => {
    return total + (answer.isCorrect ? answer.points : 0);
  }, 0);
};

// ❌ Bad - couples to Hono
export const calculateScoreWithContext = async (c: Context) => {
  // Can't test without full Hono context
};
```

### Usage in Handlers

```typescript
// src/modules/quiz/quiz.handlers.ts
import { calculateScore } from "@/services/quiz.service";

export const submitQuizHandler = async (c: AppContext) => {
  const { answers } = c.req.valid("json");
  
  // Pure function - easy to test
  const score = calculateScore(answers);
  
  // ... save to database
};
```

---

## 8. Package.json: Dependency Changes

### Key Differences

```json
{
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/zod-openapi": "^1.0.0",
    "better-auth": "^1.0.0",
    "drizzle-orm": "^0.45.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "wrangler": "^4.0.0",
    "@cloudflare/workers-types": "^4.0.0"
  }
}
```

### Remove Node.js-Specific Packages

These typically don't work in Workers:
- `express` - Use Hono instead
- `pg` (driver only) - Use `drizzle-orm/node-postgres` with `pg`
- `dotenv` - Not needed, use `.dev.vars` in Wrangler
- `nodemon` - Use `wrangler dev` instead

---

## 9. Configuration Files

### wrangler.jsonc

```jsonc
{
  "name": "your-app",
  "main": "src/index.ts",
  "compatibility_date": "2026-01-31",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "NODE_ENV": "production",
    "BETTER_AUTH_URL": "https://api.yourdomain.com"
  },
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "your-bucket"
    }
  ],
  "observability": {
    "logs": { "enabled": true },
    "traces": { "enabled": true }
  }
}
```

### .dev.vars (Local Development)

```bash
DATABASE_URL=postgresql://user:pass@localhost/db
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
BETTER_AUTH_SECRET=your-32-char-secret-key-here
BETTER_AUTH_URL=http://localhost:8787
FRONTEND_URLS=http://localhost:3000
```

---

## 10. Deployment Commands

### Development

```bash
# Start local dev server
bun run dev
# or
wrangler dev
```

### Build & Deploy

```bash
# Type check
bun run check

# Format & lint
bun run fl

# Deploy to Cloudflare
bun run deploy
```

---

## 11. Common Migration Issues

### Issue 1: process.env is undefined

**Solution:** Always use `c.env` in handlers.

### Issue 2: Global variables not preserved

**Solution:** Create fresh instances per request. Don't cache database pools or other state globally.

### Issue 3: Date serialization

**Solution:** Use `z.string().datetime()` instead of `z.date()` in OpenAPI schemas.

### Issue 4: OAuth redirects failing

**Solution:** Ensure CORS middleware handles your frontend URLs in `FRONTEND_URLS`.

### Issue 5: TypeScript types not found

**Solution:** Generate types with `wrangler types` and use `AppEnv` properly in factory.

---

## Summary Checklist

| Task | Vercel Pattern | Cloudflare Workers Pattern |
|------|----------------|---------------------------|
| Env vars | `process.env` | `c.env` (with Zod validation) |
| App creation | `new Hono()` | `createRouter()` from factory |
| DB connection | Global pool | `getDb(c.env)` per request |
| Route definitions | `router.get()` | `createRoute()` + `router.openapi()` |
| Date in schema | `z.date()` | `z.string().datetime()` |
| Auth | Direct instance | Cached via `getAuth(env)` |
| Deployment | Vercel CLI | `wrangler deploy` |

---

## Resources

- [Hono Documentation](https://hono.dev)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Better Auth](https://www.better-auth.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
