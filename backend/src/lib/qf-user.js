import { db } from '../db/index.js';
import { userSessions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const QF_API_BASE = process.env.QF_USER_API_BASE;
const QF_CLIENT_ID = process.env.QF_CLIENT_ID;

// Retrieve the user's active access token from the database
async function getAccessToken(userId) {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.userId, userId))
    .orderBy(desc(userSessions.createdAt))
    .limit(1);

  if (!session || !session.accessToken) {
    throw new Error('No active QF session for user');
  }
  return session.accessToken;
}

// A wrapper around fetch for authenticated QF User API requests
async function qfUserFetch(userId, path, options = {}) {
  const token = await getAccessToken(userId);

  const headers = {
    'x-auth-token': token,
    'x-client-id': QF_CLIENT_ID,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  const url = `${QF_API_BASE}${path}`;
  console.log(`[QF User API] ${options.method || 'GET'} ${url}`);

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`[QF User API Error] ${res.status}: ${errText}`);
    // Don't throw for sync failures — they're non-critical
    return { _error: true, status: res.status, message: errText };
  }

  if (res.status === 204) return { success: true };
  return res.json();
}

// User Bookmarks

// Get all user bookmarks (paginated)
export async function getQfBookmarks(userId, first = 20) {
  const limit = Math.min(first, 20);
  return qfUserFetch(userId, `/bookmarks?first=${limit}&mushafId=1`);
}

// Add a bookmark for an ayah
export async function addQfBookmark(userId, { mushafId = 1, chapterId, verseNumber }) {
  return qfUserFetch(userId, '/bookmarks', {
    method: 'POST',
    body: JSON.stringify({
      key: chapterId,
      type: 'ayah',
      verseNumber: verseNumber,
      isReading: false,
      mushafId,
      mushaf: mushafId,
    }),
  });
}

// Delete a bookmark by its ID
export async function deleteQfBookmark(userId, bookmarkId) {
  return qfUserFetch(userId, `/bookmarks/${bookmarkId}`, {
    method: 'DELETE',
  });
}

// Get bookmarks within a specific verse range
export async function getQfBookmarksInRange(userId, chapterId, from, to) {
  return qfUserFetch(userId, `/bookmarks/ayah-range?chapterId=${chapterId}&from=${from}&to=${to}`);
}

// Reading Sessions (Used to track reading activity and power streaks)

// Create a reading session. This tells QF to track the streak.
export async function createReadingSession(userId, { chapterId, verseNumber, pagesRead = 0.1, secondsRead = 60 }) {
  return qfUserFetch(userId, '/reading-sessions', {
    method: 'POST',
    body: JSON.stringify({
      chapterNumber: chapterId,
      verseNumber: verseNumber,
      pagesRead,
      secondsRead,
    }),
  });
}

// Activity Days

// Get activity days for a date range
export async function getQfActivityDays(userId, from, to) {
  return qfUserFetch(userId, `/activity-days?from=${from}&to=${to}`);
}

// Streaks

// Get the user's current streak info
export async function getQfStreak(userId) {
  return qfUserFetch(userId, '/streaks?first=10');
}

// Goals

// Get user goals
export async function getQfGoals(userId) {
  return qfUserFetch(userId, '/goals?first=10');
}

// Create or update a goal
export async function createQfGoal(userId, { targetPages = 1, periodType = 'daily' }) {
  return qfUserFetch(userId, '/goals', {
    method: 'POST',
    body: JSON.stringify({ targetPages, periodType }),
  });
}

// Posts and Reflections

// Get user's posts or reflections
export async function getQfPosts(userId, first = 20) {
  return qfUserFetch(userId, `/posts?first=${first}`);
}

// Create a reflection/post on a verse
export async function createQfPost(userId, { body, chapterId, verseNumber, isPublic = false }) {
  return qfUserFetch(userId, '/posts', {
    method: 'POST',
    body: JSON.stringify({
      body,
      ranges: [{ chapterId, verseFrom: verseNumber, verseTo: verseNumber }],
      visibility: isPublic ? 'public' : 'private',
    }),
  });
}

// Delete a post by ID
export async function deleteQfPost(userId, postId) {
  return qfUserFetch(userId, `/posts/${postId}`, {
    method: 'DELETE',
  });
}

// Notes (private verse annotations)

// Get notes for a specific verse
export async function getQfNotes(userId, limit = 20) {
  const limitVal = Math.min(limit, 50);
  return qfUserFetch(userId, `/notes?limit=${limitVal}`);
}

// Create a private note on a verse
export async function createQfNote(userId, { body, chapterId, verseNumber }) {
  return qfUserFetch(userId, '/notes', {
    method: 'POST',
    body: JSON.stringify({
      body,
      ranges: [`${chapterId}:${verseNumber}-${chapterId}:${verseNumber}`],
      saveToQR: false,
    }),
  });
}
