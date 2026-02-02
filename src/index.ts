import { Hono } from 'hono';
import { corsMiddleware } from '@/middleware/cors';
import { loggingMiddleware } from '@/middleware/logging';
import { authRateLimit, apiRateLimit } from '@/middleware/rate-limit';
import { errorHandler } from '@/middleware/error-handler';
import { authHandler } from '@/modules/auth';
import transactionsRoutes from '@/modules/transactions/routes';
import categoriesRoutes from '@/modules/categories/routes';
import dashboardRoutes from '@/modules/dashboard/routes';

const app = new Hono();

// Global middleware
app.use('*', corsMiddleware);
app.use('*', loggingMiddleware);
app.use('*', errorHandler);

// Rate limiting
app.use('/api/auth/*', authRateLimit);
app.use('/api/*', apiRateLimit);

// Better Auth routes
app.all('/api/auth/*', authHandler);

// Module routes
app.route('/api/transactions', transactionsRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
