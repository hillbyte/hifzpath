import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import {
  getQfBookmarks, addQfBookmark, deleteQfBookmark,
  getQfStreak, getQfActivityDays,
  getQfGoals, createQfGoal,
  getQfPosts, createQfPost, deleteQfPost,
  getQfNotes, createQfNote,
  createReadingSession,
} from '../lib/qf-user.js';

const qf = new Hono();
qf.use('*', authMiddleware);

// Quran Foundation Bookmarks Integration

qf.get('/bookmarks', async (c) => {
  const userId = c.get('userId');
  const first = parseInt(c.req.query('first') || '50');
  const data = await getQfBookmarks(userId, first);
  return c.json(data);
});

qf.post('/bookmarks', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  // body: { ayahKey: "2:255" }
  const [ch, v] = (body.ayahKey || '').split(':');
  const data = await addQfBookmark(userId, {
    chapterId: parseInt(ch),
    verseNumber: parseInt(v),
  });
  return c.json(data);
});

qf.delete('/bookmarks/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const data = await deleteQfBookmark(userId, id);
  return c.json(data);
});

// Aggregate bookmark and note state for a specific ayah

qf.get('/ayah-state/:ayahKey', async (c) => {
  const userId = c.get('userId');
  const ayahKey = c.req.param('ayahKey');
  const [ch, v] = ayahKey.split(':');
  
  // Try to find if bookmarked in this range
  let bookmarked = false;
  let bookmarkId = null;
  let noteText = '';
  
  try {
    const { getQfBookmarks, getQfNotes } = await import('../lib/qf-user.js');
    
    const bookmarksReq = await getQfBookmarks(userId, 50);
    if (bookmarksReq && !bookmarksReq._error && bookmarksReq.data) {
      const foundBookmark = bookmarksReq.data.find(b => (b.chapterId === parseInt(ch) || b.key === parseInt(ch)) && b.verseNumber === parseInt(v));
      if (foundBookmark) {
        bookmarked = true;
        bookmarkId = foundBookmark.id;
      }
    }
    
    const notesReq = await getQfNotes(userId, 50);
    if (notesReq && !notesReq._error && notesReq.data) {
      const foundNote = notesReq.data.find(n => n.ranges && n.ranges.includes(`${ch}:${v}-${ch}:${v}`));
      if (foundNote) {
        noteText = foundNote.body || '';
      }
    }
  } catch (err) {
    console.error('Ayah state fetch error:', err);
  }

  return c.json({ bookmarked, bookmarkId, note: noteText });
});

// Fetch current reading streaks

qf.get('/streak', async (c) => {
  const userId = c.get('userId');
  const data = await getQfStreak(userId);
  return c.json(data);
});

// Fetch past reading activity days

qf.get('/activity', async (c) => {
  const userId = c.get('userId');
  const from = c.req.query('from') || new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
  const to = c.req.query('to') || new Date().toISOString().split('T')[0];
  const data = await getQfActivityDays(userId, from, to);
  return c.json(data);
});

// Log reading sessions to update QF streaks

qf.post('/reading-session', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const [ch, v] = (body.ayahKey || '1:1').split(':');
  const data = await createReadingSession(userId, {
    chapterId: parseInt(ch),
    verseNumber: parseInt(v),
    pagesRead: body.pagesRead || 0.1,
    secondsRead: body.secondsRead || 60,
  });
  return c.json(data);
});

// Manage user reading goals on QF

qf.get('/goals', async (c) => {
  const userId = c.get('userId');
  const data = await getQfGoals(userId);
  return c.json(data);
});

qf.post('/goals', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const data = await createQfGoal(userId, {
    targetPages: body.targetPages || 1,
    periodType: body.periodType || 'daily',
  });
  return c.json(data);
});

// Manage public or private reflections/posts

qf.get('/reflections', async (c) => {
  const userId = c.get('userId');
  const first = parseInt(c.req.query('first') || '20');
  const data = await getQfPosts(userId, first);
  return c.json(data);
});

qf.post('/reflections', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const [ch, v] = (body.ayahKey || '1:1').split(':');
  const data = await createQfPost(userId, {
    body: body.text,
    chapterId: parseInt(ch),
    verseNumber: parseInt(v),
    isPublic: body.isPublic || false,
  });
  return c.json(data);
});

qf.delete('/reflections/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const data = await deleteQfPost(userId, id);
  return c.json(data);
});

// Manage private notes for specific ayahs

qf.get('/notes', async (c) => {
  const userId = c.get('userId');
  const data = await getQfNotes(userId);
  return c.json(data);
});

qf.post('/notes', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const [ch, v] = (body.ayahKey || '1:1').split(':');
  const data = await createQfNote(userId, {
    body: body.text,
    chapterId: parseInt(ch),
    verseNumber: parseInt(v),
  });
  return c.json(data);
});

export default qf;
