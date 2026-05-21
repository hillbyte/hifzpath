import { Hono } from 'hono';
import { db } from '../db/index.js';
import { userActivity, userAyahProgress } from '../db/schema.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const heatmap = new Hono();
heatmap.use('*', authMiddleware);

// Fetch daily activity for the entire year (used for the github-style heatmap)
heatmap.get('/year', async (c) => {
  const userId = c.get('userId');
  const year = parseInt(c.req.query('year') || new Date().getFullYear());

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const activity = await db
    .select()
    .from(userActivity)
    .where(
      and(
        eq(userActivity.userId, userId),
        gte(userActivity.activityDate, startDate),
        lte(userActivity.activityDate, endDate)
      )
    );

  // Build a map of date → activity for easy lookup
  const activityMap = {};
  activity.forEach((row) => {
    activityMap[row.activityDate] = {
      memorised: row.memorisedCount || 0,
      reviewed: row.reviewedCount || 0,
      listened: row.listenedCount || 0,
      total:
        (row.memorisedCount || 0) +
        (row.reviewedCount || 0) +
        (row.listenedCount || 0),
    };
  });

  return c.json({ year, activity: activityMap });
});

// Return the overall memorization status for every ayah in the Quran
heatmap.get('/lifetime', async (c) => {
  const userId = c.get('userId');

  // Ayah counts per surah (1-indexed)
  const SURAH_AYAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
    111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
    54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60,
    49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
    44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19,
    26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3,
    6, 3, 5, 4, 5, 6,
  ];

  // Fetch all user progress
  const userProgress = await db
    .select({
      ayahKey: userAyahProgress.ayahKey,
      status: userAyahProgress.status,
    })
    .from(userAyahProgress)
    .where(eq(userAyahProgress.userId, userId));

  // Build progress map
  const progressMap = {};
  userProgress.forEach((p) => {
    progressMap[p.ayahKey] = p.status;
  });

  // Build surah grid
  const surahs = SURAH_AYAH_COUNTS.map((ayahCount, i) => {
    const surahNumber = i + 1;
    const ayahs = [];
    let memorised = 0;
    let learning = 0;

    for (let a = 1; a <= ayahCount; a++) {
      const key = `${surahNumber}:${a}`;
      const status = progressMap[key] || 'new';
      if (status === 'memorised') memorised++;
      if (status === 'learning') learning++;
      ayahs.push({ key, ayah: a, status });
    }

    return {
      surah: surahNumber,
      totalAyahs: ayahCount,
      memorised,
      learning,
      ayahs,
    };
  });

  const totalMemorise = userProgress.filter(
    (p) => p.status === 'memorised'
  ).length;
  const totalLearning = userProgress.filter(
    (p) => p.status === 'learning'
  ).length;

  return c.json({
    surahs,
    totalAyahs: 6236,
    totalMemorised: totalMemorise,
    totalLearning: totalLearning,
  });
});

export default heatmap;
