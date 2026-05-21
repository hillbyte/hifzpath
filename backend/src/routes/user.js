import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users, userOnboarding, userSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const user = new Hono();

// All routes require auth
user.use('*', authMiddleware);

// Get the current user's profile and their onboarding status
user.get('/me', async (c) => {
  const userId = c.get('userId');

  const [userData] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userData) {
    return c.json({ error: 'User not found' }, 404);
  }

  const [onboarding] = await db
    .select()
    .from(userOnboarding)
    .where(eq(userOnboarding.userId, userId))
    .limit(1);

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return c.json({
    user: userData,
    onboarding: onboarding || null,
    settings: settings || null,
    isOnboarded: !!onboarding?.completedAt,
  });
});

// Save where the user wants to start memorizing
user.post('/onboarding', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { startMode, startSurah, startAyah } = body;

  await db
    .insert(userOnboarding)
    .values({
      userId,
      startMode: startMode || 'beginning',
      startSurah: startSurah || 1,
      startAyah: startAyah || 1,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userOnboarding.userId,
      set: {
        startMode: startMode || 'beginning',
        startSurah: startSurah || 1,
        startAyah: startAyah || 1,
        completedAt: new Date(),
      },
    });

  return c.json({ success: true });
});

// Fetch user preferences and goals
user.get('/settings', async (c) => {
  const userId = c.get('userId');

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return c.json({ settings: settings || null });
});

// Update user settings, preferences, and deadlines
user.put('/settings', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const updateFields = {};
  if (body.dailyGoal !== undefined) updateFields.dailyGoal = body.dailyGoal;
  if (body.khatmDeadline !== undefined) updateFields.khatmDeadline = body.khatmDeadline || null;
  if (body.reminderTime !== undefined) updateFields.reminderTime = body.reminderTime || null;
  if (body.reciterId !== undefined) updateFields.reciterId = body.reciterId;
  if (body.translationId !== undefined) updateFields.translationId = body.translationId;
  if (body.tafsirId !== undefined) updateFields.tafsirId = body.tafsirId;
  if (body.showTransliteration !== undefined) updateFields.showTransliteration = body.showTransliteration;
  if (body.showTranslation !== undefined) updateFields.showTranslation = body.showTranslation;
  if (body.showTafsir !== undefined) updateFields.showTafsir = body.showTafsir;
  if (body.showTajweed !== undefined) updateFields.showTajweed = body.showTajweed;
  if (body.wordByWord !== undefined) updateFields.wordByWord = body.wordByWord;
  if (body.wordAudio !== undefined) updateFields.wordAudio = body.wordAudio;
  updateFields.updatedAt = new Date();

  await db
    .insert(userSettings)
    .values({
      userId,
      dailyGoal: body.dailyGoal || 1,
      khatmDeadline: body.khatmDeadline || null,
      reminderTime: body.reminderTime || null,
      reciterId: body.reciterId ?? 9,
      translationId: body.translationId ?? 85,
      tafsirId: body.tafsirId ?? 169,
      showTransliteration: body.showTransliteration ?? false,
      showTranslation: body.showTranslation ?? true,
      showTafsir: body.showTafsir ?? true,
      showTajweed: body.showTajweed ?? true,
      wordByWord: body.wordByWord ?? true,
      wordAudio: body.wordAudio ?? true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: updateFields,
    });

  return c.json({ success: true });
});

export default user;
