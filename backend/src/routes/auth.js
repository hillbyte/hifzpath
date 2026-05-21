import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users, userSessions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { setSessionCookie, clearSessionCookie } from '../lib/session.js';

const auth = new Hono();

const QF_OAUTH = process.env.QF_OAUTH_ENDPOINT;
const QF_CLIENT_ID = process.env.QF_CLIENT_ID;
const QF_CLIENT_SECRET = process.env.QF_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Generate the Quran Foundation OAuth2 login URL
auth.get('/login-url', (c) => {
  const redirectUri = c.req.query('redirect_uri') || `${FRONTEND_URL}/callback`;

  const params = new URLSearchParams({
    client_id: QF_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'offline_access bookmark note collection reading_session streak goal preference activity_day',
    code_challenge_method: 'S256',
  });

  return c.json({
    url: `${QF_OAUTH}/oauth2/auth?${params.toString()}`,
    redirect_uri: redirectUri,
  });
});

// Exchange the OAuth code for an access token and handle user creation
auth.post('/exchange', async (c) => {
  try {
    const { code, code_verifier, redirect_uri } = await c.req.json();

    if (!code || !code_verifier) {
      return c.json({ error: 'Missing code or code_verifier' }, 400);
    }

    // Exchange code for tokens at QF (uses client_secret_basic auth)
    const basicAuth = Buffer.from(`${QF_CLIENT_ID}:${QF_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch(`${QF_OAUTH}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier,
        redirect_uri: redirect_uri || `${FRONTEND_URL}/callback`,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Token exchange failed:', err);
      return c.json({ error: 'Token exchange failed', details: err }, 400);
    }

    const tokens = await tokenRes.json();
    const { access_token, refresh_token, id_token } = tokens;

    // Get user info — try id_token first, fall back to userinfo endpoint
    let userId, email, displayName, avatarUrl;

    if (id_token) {
      try {
        const parts = id_token.split('.');
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64url').toString()
        );
        userId = payload.sub;
        email = payload.email || null;
        displayName = payload.name || payload.preferred_username || (payload.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : null);
        avatarUrl = payload.picture || payload.avatar_url || null;
      } catch {
        // fallthrough to userinfo
      }
    }

    if (!userId) {
      // No id_token (openid scope not available) — use access token
      // to call QF userinfo or generate a stable ID from the token
      try {
        const userinfoRes = await fetch(`${QF_OAUTH}/userinfo`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (userinfoRes.ok) {
          const info = await userinfoRes.json();
          userId = info.sub || info.id;
          email = info.email || null;
          displayName = info.name || info.preferred_username || (info.first_name ? `${info.first_name} ${info.last_name || ''}`.trim() : null);
          avatarUrl = info.picture || info.avatar_url || null;
        }
      } catch (err) {
        console.error('Userinfo fetch failed:', err.message);
      }
    }

    // Final fallback — hash the access token for a stable user ID
    if (!userId) {
      const { createHash } = await import('crypto');
      userId = createHash('sha256').update(access_token).digest('hex').slice(0, 32);
      email = null;
      displayName = null;
      avatarUrl = null;
    }

    // Upsert user record
    await db
      .insert(users)
      .values({
        id: userId,
        email,
        displayName,
        avatarUrl,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { email, displayName, avatarUrl },
      });

    // Store session tokens in DB
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
    await db.insert(userSessions).values({
      userId,
      accessToken: access_token,
      refreshToken: refresh_token || null,
      idToken: id_token || null,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    });

    // Set httpOnly cookie with our JWT
    setSessionCookie(c, {
      userId,
      email,
      displayName,
      avatarUrl,
    });

    return c.json({
      user: { id: userId, email, displayName, avatarUrl },
    });
  } catch (err) {
    console.error('Exchange error:', err);
    return c.json({ error: 'Internal error during exchange' }, 500);
  }
});

// Handle QF access token refresh (placeholder)
auth.post('/refresh', async (c) => {
  // For now, return a simple implementation
  return c.json({ message: 'Token refresh not yet implemented' }, 501);
});

// Log the user out by clearing their session cookie
auth.post('/logout', (c) => {
  clearSessionCookie(c);
  return c.json({ success: true });
});

export default auth;
