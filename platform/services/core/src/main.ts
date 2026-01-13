/**
 * Core API Service - HTTP Server Entry Point
 *
 * Starts the Express server with all API routes
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import route handlers (to be implemented)
// import { authRouter } from './modules/auth/auth.controller';
// import { orgsRouter } from './modules/orgs/orgs.controller';
// import { syncRouter } from './modules/sync/sync.controller';
// import { jobsRouter } from './modules/jobs/jobs.controller';
// import { policiesRouter } from './modules/masking/masking.controller';
// import { auditRouter } from './modules/audit/audit.controller';
// import { portfolioRouter } from './modules/portfolio/portfolio.controller';

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  // TODO: Check database and Redis connectivity
  res.json({
    status: 'ready',
    checks: {
      database: 'ok',
      redis: 'ok',
      storage: 'ok',
    },
  });
});

// =============================================================================
// API ROUTES (v1)
// =============================================================================

const apiV1 = express.Router();

// Placeholder routes - to be implemented with actual controllers
apiV1.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Salesforce DevOps Platform API',
    version: 'v1',
    endpoints: [
      '/auth',
      '/workspaces',
      '/orgs',
      '/sync/plans',
      '/sync/templates',
      '/jobs',
      '/policies',
      '/audit',
      '/portfolio',
    ],
  });
});

// Mount routers (uncomment when implemented)
// apiV1.use('/auth', authRouter);
// apiV1.use('/orgs', orgsRouter);
// apiV1.use('/sync', syncRouter);
// apiV1.use('/jobs', jobsRouter);
// apiV1.use('/policies', policiesRouter);
// apiV1.use('/audit', auditRouter);
// apiV1.use('/portfolio', portfolioRouter);

// Stub endpoints for testing
apiV1.get('/workspaces', (_req: Request, res: Response) => {
  res.json({ data: [], total: 0 });
});

apiV1.get('/orgs', (_req: Request, res: Response) => {
  res.json({ data: [], total: 0 });
});

apiV1.get('/sync/plans', (_req: Request, res: Response) => {
  res.json({ data: [], total: 0 });
});

apiV1.get('/sync/templates', (_req: Request, res: Response) => {
  res.json({
    data: [
      { id: 'sales-cloud', name: 'Sales Cloud', category: 'SALES_CLOUD', isCurated: true },
      { id: 'service-cloud', name: 'Service Cloud', category: 'SERVICE_CLOUD', isCurated: true },
      { id: 'platform-core', name: 'Platform Core', category: 'PLATFORM', isCurated: true },
    ],
    total: 3,
  });
});

apiV1.get('/jobs', (_req: Request, res: Response) => {
  res.json({ data: [], total: 0 });
});

apiV1.get('/policies', (_req: Request, res: Response) => {
  res.json({ data: [], total: 0 });
});

apiV1.get('/policies/templates', (_req: Request, res: Response) => {
  res.json({
    templates: [
      { id: 'pii-standard', name: 'PII Standard', category: 'pii', ruleCount: 5 },
      { id: 'pci-dss', name: 'PCI-DSS', category: 'pci', ruleCount: 3 },
      { id: 'hipaa', name: 'HIPAA', category: 'hipaa', ruleCount: 4 },
    ],
  });
});

app.use('/api/v1', apiV1);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An internal error occurred'
        : err.message,
    },
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api/v1`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

export default app;
