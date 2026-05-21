import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';

const COOKIE_NAME = 'hifzpath_session';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const IS_PROD = process.env.NODE_ENV === 'production';

// Generates a JWT and sets it securely in an httpOnly cookie
export function setSessionCookie(c, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  const cookieStr = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  c.header('Set-Cookie', cookieStr);
  return token;
}

// Grabs the session token from cookies and decodes it if valid
export function getSession(c) {
  const cookieHeader = c.req.header('cookie');
  if (!cookieHeader) return null;

  const cookies = parse(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Wipes the session cookie to log the user out
export function clearSessionCookie(c) {
  const cookieStr = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    path: '/',
    maxAge: 0,
  });
  c.header('Set-Cookie', cookieStr);
}
