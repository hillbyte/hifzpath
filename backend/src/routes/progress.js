import { Hono } from 'hono';
import { db } from '../db/index.js';
import { userAyahProgress, userActivity, userOnboarding, userSettings } from '../db/schema.js';
import { eq, and, lte, gte, asc, sql, count } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { sm2, nextReviewDate, deriveStatus } from '../lib/spaced-rep.js';
import { fetchAyah } from '../lib/qf-content.js';
import { createReadingSession } from '../lib/qf-user.js';

const progress = new Hono();
progress.use('*', authMiddleware);

// Helper: map of how many ayaat are in each surah (1-114)
const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
  49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30,
  20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5,
  4, 5, 6,
];

function getNextAyahKey(currentSurah, currentAyah) {
  const maxAyah = SURAH_AYAH_COUNTS[currentSurah - 1];
  if (currentAyah < maxAyah) {
    return { surah: currentSurah, ayah: currentAyah + 1 };
  }
  if (currentSurah < 114) {
    return { surah: currentSurah + 1, ayah: 1 };
  }
  return null; // Quran complete
}

function getPrevAyahKey(currentSurah, currentAyah) {
  if (currentAyah > 1) {
    return { surah: currentSurah, ayah: currentAyah - 1 };
  }
  if (currentSurah > 1) {
    const prevSurah = currentSurah - 1;
    return { surah: prevSurah, ayah: SURAH_AYAH_COUNTS[prevSurah - 1] };
  }
  return null; // Already at 1:1
}

// Get today's new ayah and the review queue
progress.get('/today', async (c) => {
  const userId = c.get('userId');
  const now = new Date();

  // Get review queue — ayaat due for review (nextReview <= now)
  const reviewQueue = await db
    .select()
    .from(userAyahProgress)
    .where(
      and(
        eq(userAyahProgress.userId, userId),
        lte(userAyahProgress.nextReview, now)
      )
    )
    .orderBy(asc(userAyahProgress.nextReview))
    .limit(10);

  // Find the next new ayah — the user's current position
  const [onboarding] = await db
    .select()
    .from(userOnboarding)
    .where(eq(userOnboarding.userId, userId))
    .limit(1);

  // Count total progress
  const allProgress = await db
    .select({ ayahKey: userAyahProgress.ayahKey, createdAt: userAyahProgress.createdAt })
    .from(userAyahProgress)
    .where(eq(userAyahProgress.userId, userId));

  const learnedKeys = new Set(allProgress.map((p) => p.ayahKey));

  // Count how many NEW ayaat were first learned TODAY
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const learnedToday = allProgress.filter(
    (p) => p.createdAt && new Date(p.createdAt) >= todayStart
  ).length;

  // Fetch settings for daily goal
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  const dailyGoal = settings?.dailyGoal || 1;
  const goalReached = learnedToday >= dailyGoal;

  // Determine next new ayah to learn
  let startSurah = onboarding?.startSurah || 1;
  let startAyah = onboarding?.startAyah || 1;
  let nextNew = { surah: startSurah, ayah: startAyah };

  // Walk forward until we find one not in progress
  let attempts = 0;
  while (nextNew && learnedKeys.has(`${nextNew.surah}:${nextNew.ayah}`)) {
    nextNew = getNextAyahKey(nextNew.surah, nextNew.ayah);
    attempts++;
    if (attempts > 6236) break; // safety valve — Quran complete
  }

  // Fetch the new ayah data from QF Content API
  let newAyahData = null;
  if (nextNew) {
    try {
      newAyahData = await fetchAyah(`${nextNew.surah}:${nextNew.ayah}`);
      newAyahData._key = `${nextNew.surah}:${nextNew.ayah}`;
      newAyahData._surah = nextNew.surah;
      newAyahData._ayah = nextNew.ayah;
    } catch (err) {
      console.error('Failed to fetch new ayah:', err.message);
    }
  }

  let scheduling = null;
  if (settings?.khatmDeadline) {
    const deadline = new Date(settings.khatmDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = Math.max(0, Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)));
    const ayaatRemaining = 6236 - learnedKeys.size;
    const requiredPace = daysRemaining > 0 ? Math.ceil(ayaatRemaining / daysRemaining) : ayaatRemaining;
    const onTrack = dailyGoal >= requiredPace;
    scheduling = {
      khatmDeadline: settings.khatmDeadline,
      daysRemaining,
      ayaatRemaining,
      requiredPace,
      currentPace: dailyGoal,
      onTrack,
    };
  }

  return c.json({
    newAyah: newAyahData,
    reviewQueue,
    reviewCount: reviewQueue.length,
    totalLearned: learnedKeys.size,
    quranComplete: nextNew === null,
    scheduling,
    reminderTime: settings?.reminderTime || null,
    learnedToday,
    dailyGoal,
    goalReached,
  });
});

// Navigate to the next or previous ayah manually (user override)
progress.get('/today/navigate', async (c) => {
  const current = c.req.query('current');
  const direction = c.req.query('direction') || 'next';

  if (!current) return c.json({ error: 'Missing current ayah key' }, 400);

  const [surahStr, ayahStr] = current.split(':');
  const surah = parseInt(surahStr);
  const ayah = parseInt(ayahStr);

  const target = direction === 'prev'
    ? getPrevAyahKey(surah, ayah)
    : getNextAyahKey(surah, ayah);

  if (!target) {
    return c.json({ ayah: null, atBoundary: true });
  }

  try {
    const ayahData = await fetchAyah(`${target.surah}:${target.ayah}`);
    ayahData._key = `${target.surah}:${target.ayah}`;
    ayahData._surah = target.surah;
    ayahData._ayah = target.ayah;
    return c.json({ ayah: ayahData });
  } catch (err) {
    console.error('Navigate fetch error:', err.message);
    return c.json({ error: 'Failed to fetch ayah' }, 500);
  }
});
// Return all ayah progress records for the user (powers the lifetime heatmap)
progress.get('/all', async (c) => {
  const userId = c.get('userId');

  const allProgress = await db
    .select({
      ayahKey: userAyahProgress.ayahKey,
      surahNumber: userAyahProgress.surahNumber,
      ayahNumber: userAyahProgress.ayahNumber,
      status: userAyahProgress.status,
      interval: userAyahProgress.interval,
      memorisedAt: userAyahProgress.memorisedAt,
    })
    .from(userAyahProgress)
    .where(eq(userAyahProgress.userId, userId));

  return c.json({
    progress: allProgress,
    totalCount: allProgress.length,
    memorisedCount: allProgress.filter((p) => p.status === 'memorised').length,
    learningCount: allProgress.filter((p) => p.status === 'learning').length,
  });
});

// Fetch progress for a single specific ayah
progress.get('/:ayahKey', async (c) => {
  const userId = c.get('userId');
  const ayahKey = c.req.param('ayahKey');

  const [record] = await db
    .select()
    .from(userAyahProgress)
    .where(
      and(
        eq(userAyahProgress.userId, userId),
        eq(userAyahProgress.ayahKey, ayahKey)
      )
    )
    .limit(1);

  return c.json({ progress: record || null });
});

// Rate an ayah (0-3) and calculate the next review interval using SM-2
progress.post('/:ayahKey/rate', async (c) => {
  const userId = c.get('userId');
  const ayahKey = c.req.param('ayahKey');
  const { rating } = await c.req.json();

  if (rating < 0 || rating > 3) {
    return c.json({ error: 'Rating must be 0-3' }, 400);
  }

  const [surahStr, ayahStr] = ayahKey.split(':');
  const surahNumber = parseInt(surahStr);
  const ayahNumber = parseInt(ayahStr);

  // Get existing progress or create new
  const [existing] = await db
    .select()
    .from(userAyahProgress)
    .where(
      and(
        eq(userAyahProgress.userId, userId),
        eq(userAyahProgress.ayahKey, ayahKey)
      )
    )
    .limit(1);

  const currentInterval = existing?.interval || 1;
  const currentEase = existing?.easeFactor || 2.5;

  const { interval: newInterval, easeFactor: newEase } = sm2(
    rating,
    currentInterval,
    currentEase
  );
  const newNextReview = nextReviewDate(newInterval);
  const newStatus = deriveStatus(rating, newInterval);

  const ratingEntry = { rating, date: new Date().toISOString() };
  const ratingHistory = existing?.ratingHistory
    ? [...existing.ratingHistory, ratingEntry]
    : [ratingEntry];

  if (existing) {
    await db
      .update(userAyahProgress)
      .set({
        interval: newInterval,
        easeFactor: newEase,
        nextReview: newNextReview,
        lastRating: rating,
        ratingHistory,
        status: newStatus,
        memorisedAt:
          newStatus === 'memorised' && !existing.memorisedAt
            ? new Date()
            : existing.memorisedAt,
        updatedAt: new Date(),
      })
      .where(eq(userAyahProgress.id, existing.id));
  } else {
    await db.insert(userAyahProgress).values({
      userId,
      ayahKey,
      surahNumber,
      ayahNumber,
      interval: newInterval,
      easeFactor: newEase,
      nextReview: newNextReview,
      lastRating: rating,
      ratingHistory,
      status: newStatus,
      memorisedAt: newStatus === 'memorised' ? new Date() : null,
    });
  }

  // Update daily activity
  const today = new Date().toISOString().split('T')[0];
  const isNew = !existing;

  await db
    .insert(userActivity)
    .values({
      userId,
      activityDate: today,
      memorisedCount: isNew ? 1 : 0,
      reviewedCount: isNew ? 0 : 1,
    })
    .onConflictDoUpdate({
      target: [userActivity.userId, userActivity.activityDate],
      set: {
        memorisedCount: isNew
          ? sql`${userActivity.memorisedCount} + 1`
          : userActivity.memorisedCount,
        reviewedCount: !isNew
          ? sql`${userActivity.reviewedCount} + 1`
          : userActivity.reviewedCount,
        updatedAt: new Date(),
      },
    });
  // Sync to QF: log a reading session in the background
  createReadingSession(userId, {
    chapterId: surahNumber,
    verseNumber: ayahNumber,
    pagesRead: 0.05,
    secondsRead: 30,
  }).catch(err => console.error('[QF Sync] Reading session error:', err.message));

  return c.json({
    success: true,
    progress: {
      ayahKey,
      interval: newInterval,
      easeFactor: newEase,
      nextReview: newNextReview,
      status: newStatus,
    },
  });
});

// Directly mark an ayah as memorised from the modal
progress.post('/:ayahKey/mark', async (c) => {
  const userId = c.get('userId');
  const ayahKey = c.req.param('ayahKey');
  const [surahStr, ayahStr] = ayahKey.split(':');

  await db
    .insert(userAyahProgress)
    .values({
      userId,
      ayahKey,
      surahNumber: parseInt(surahStr),
      ayahNumber: parseInt(ayahStr),
      status: 'memorised',
      interval: 30,
      easeFactor: 2.5,
      nextReview: nextReviewDate(30),
      memorisedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userAyahProgress.userId, userAyahProgress.ayahKey],
      set: {
        status: 'memorised',
        memorisedAt: new Date(),
        interval: 30,
        nextReview: nextReviewDate(30),
        updatedAt: new Date(),
      },
    });

  // Update daily activity
  const today = new Date().toISOString().split('T')[0];
  await db
    .insert(userActivity)
    .values({ userId, activityDate: today, memorisedCount: 1 })
    .onConflictDoUpdate({
      target: [userActivity.userId, userActivity.activityDate],
      set: {
        memorisedCount: sql`${userActivity.memorisedCount} + 1`,
        updatedAt: new Date(),
      },
    });

  return c.json({ success: true });
});

// Bulk mark multiple ayaat as memorised at once (used during onboarding)
progress.post('/bulk-mark', async (c) => {
  const userId = c.get('userId');
  const { ayahKeys } = await c.req.json();

  if (!Array.isArray(ayahKeys) || ayahKeys.length === 0) {
    return c.json({ error: 'ayahKeys must be a non-empty array' }, 400);
  }

  const now = new Date();
  const values = ayahKeys.map((key) => {
    const [s, a] = key.split(':');
    return {
      userId,
      ayahKey: key,
      surahNumber: parseInt(s),
      ayahNumber: parseInt(a),
      status: 'memorised',
      interval: 30,
      easeFactor: 2.5,
      nextReview: nextReviewDate(30),
      memorisedAt: now,
    };
  });

  // Insert in batches of 100
  for (let i = 0; i < values.length; i += 100) {
    const batch = values.slice(i, i + 100);
    await db
      .insert(userAyahProgress)
      .values(batch)
      .onConflictDoNothing();
  }

  return c.json({ success: true, marked: ayahKeys.length });
});

export default progress;
