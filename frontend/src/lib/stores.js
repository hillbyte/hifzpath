import { writable, derived } from 'svelte/store';

// User State
export const user = writable(null);
export const isLoggedIn = derived(user, ($user) => !!$user);
export const isOnboarded = writable(false);

// Global Loading and Error States
export const loading = writable(false);
export const error = writable(null);

// Today's Learning and Review Data
export const todayData = writable(null);
export const todayAyahContent = writable(null);
export const reviewAyahContent = writable(null);

// Progress Tracking and Heatmaps
export const allProgress = writable(null);
export const yearHeatmap = writable(null);
export const lifetimeHeatmap = writable(null);
export const dashboardStreak = writable(null);
export const dashboardBookmarks = writable([]);

// Cached List of Chapters
export const chapters = writable([]);

// Global Audio Player State
export const audioState = writable({
  playing: false,
  loop: false,
  speed: 1,
  progress: 0,
  duration: 0,
});

// Currently Active Modal Window
export const activeModal = writable(null); // { type: 'ayah', key: '2:255' }

// User Settings and Preferences
export const contentPrefs = writable({
  reciterId: 9,       // Minshawi Murattal
  translationId: 85,  // Abdel Haleem
  tafsirId: 169,      // Ibn Kathir
  showTransliteration: false,
  showTranslation: true,
  showTafsir: true,
  showTajweed: true,
  wordByWord: true,
  wordAudio: true,
});
