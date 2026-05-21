import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import progressRoutes from './routes/progress.js';
import heatmapRoutes from './routes/heatmap.js';
import contentRoutes from './routes/content.js';
import qfProxyRoutes from './routes/qf-proxy.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Register application routes
app.route('/api/auth', authRoutes);
app.route('/api/user', userRoutes);
app.route('/api/progress', progressRoutes);
app.route('/api/heatmap', heatmapRoutes);
app.route('/api/content', contentRoutes);
app.route('/api/qf', qfProxyRoutes);

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});


app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '3001');

console.log(`HifzPath API Server running on port ${port}`);

// Start the HTTP server
serve({ fetch: app.fetch, port });
