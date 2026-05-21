import { getSession } from '../lib/session.js';
import { db } from '../db/index.js';
import { users, userSessions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Require authentication for protected routes
export async function authMiddleware(c, next) {
  const session = getSession(c);
  if (!session || !session.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('userId', session.userId);
  c.set('session', session);
  await next();
}

// Check for user session without blocking the request
export async function optionalAuth(c, next) {
  const session = getSession(c);
  if (session && session.userId) {
    c.set('userId', session.userId);
    c.set('session', session);
  }
  await next();
}
