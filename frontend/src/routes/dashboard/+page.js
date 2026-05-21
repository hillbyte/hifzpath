import { getYearHeatmap, getLifetimeHeatmap, getToday, getStreak, getBookmarks } from '$lib/api.js';

export function load() {
  const selectedYear = new Date().getFullYear();
  
  // Return promises instead of awaiting them.
  // This allows SvelteKit to instantly navigate (or pre-fetch on hover)
  // without blocking the UI while waiting for the network.
  return {
    streamed: {
      yearPromise: getYearHeatmap(selectedYear),
      lifetimePromise: getLifetimeHeatmap(),
      todayPromise: getToday(),
      streakPromise: getStreak(),
      bookmarksPromise: getBookmarks()
    }
  };
}
