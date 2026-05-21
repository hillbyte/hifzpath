import {
  pgTable,
  text,
  serial,
  integer,
  real,
  timestamp,
  date,
  jsonb,
  unique,
  index,
  boolean,
} from 'drizzle-orm/pg-core';

// Core user details
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tracks where the user starts their memorization
export const userOnboarding = pgTable('user_onboarding', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  startMode: text('start_mode').notNull(),
  startSurah: integer('start_surah').default(1),
  startAyah: integer('start_ayah').default(1),
  completedAt: timestamp('completed_at'),
});

// Spaced repetition data for each ayah
export const userAyahProgress = pgTable(
  'user_ayah_progress',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ayahKey: text('ayah_key').notNull(),
    surahNumber: integer('surah_number').notNull(),
    ayahNumber: integer('ayah_number').notNull(),
    status: text('status').default('new'),
    interval: integer('interval').default(1),
    easeFactor: real('ease_factor').default(2.5),
    nextReview: timestamp('next_review'),
    lastRating: integer('last_rating'),
    ratingHistory: jsonb('rating_history').default([]),
    memorisedAt: timestamp('memorised_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    unique('uap_user_ayah_uniq').on(t.userId, t.ayahKey),
    index('uap_user_idx').on(t.userId),
    index('uap_next_review_idx').on(t.userId, t.nextReview),
  ]
);

// Daily activity logs to build the heatmap
export const userActivity = pgTable(
  'user_activity',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activityDate: date('activity_date').notNull(),
    memorisedCount: integer('memorised_count').default(0),
    reviewedCount: integer('reviewed_count').default(0),
    listenedCount: integer('listened_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [
    unique('ua_user_date_uniq').on(t.userId, t.activityDate),
    index('ua_user_idx').on(t.userId),
  ]
);

// App settings and personal goals
export const userSettings = pgTable('user_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  khatmDeadline: date('khatm_deadline'),
  dailyGoal: integer('daily_goal').default(1),
  reminderTime: text('reminder_time'),
  reciterId: integer('reciter_id').default(9),
  translationId: integer('translation_id').default(85),
  tafsirId: integer('tafsir_id').default(169),
  showTransliteration: boolean('show_transliteration').default(false),
  showTranslation: boolean('show_translation').default(true),
  showTafsir: boolean('show_tafsir').default(true),
  showTajweed: boolean('show_tajweed').default(true),
  wordByWord: boolean('word_by_word').default(true),
  wordAudio: boolean('word_audio').default(true),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Store auth tokens
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
