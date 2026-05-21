const API_BASE = import.meta.env.VITE_API_URL || '';

// Core fetch wrapper that sends cookies with every request and redirects to login on 401
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  let res;

  try {
    res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  } catch (err) {
    // Network error — offline or backend down
    throw new Error('Network error — check your connection.');
  }

  // Handle expired/invalid session → redirect to login
  if (res.status === 401) {
    // Only redirect if we're not already on auth pages
    const path = window.location.pathname;
    if (path !== '/' && path !== '/login' && path !== '/callback') {
      window.location.href = '/login';
    }
    throw new Error('Session expired — please log in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API Error ${res.status}`);
  }

  return res.json();
}

// Authentication Endpoints
export async function getLoginUrl() {
  return request('/api/auth/login-url');
}

export async function exchangeCode(code, codeVerifier, redirectUri) {
  return request('/api/auth/exchange', {
    method: 'POST',
    body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri: redirectUri }),
  });
}

export async function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

// User Profile and Settings Endpoints
export async function getMe() {
  return request('/api/user/me');
}

export async function saveOnboarding(data) {
  return request('/api/user/onboarding', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSettings() {
  return request('/api/user/settings');
}

export async function updateSettings(data) {
  return request('/api/user/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Spaced Repetition and Progress Endpoints
export async function getToday() {
  return request('/api/progress/today');
}

export async function navigateAyah(currentKey, direction) {
  return request(`/api/progress/today/navigate?current=${currentKey}&direction=${direction}`);
}

export async function getAllProgress() {
  return request('/api/progress/all');
}

export async function getAyahProgress(ayahKey) {
  return request(`/api/progress/${ayahKey}`);
}

export async function rateAyah(ayahKey, rating) {
  return request(`/api/progress/${ayahKey}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating }),
  });
}

export async function markMemorised(ayahKey) {
  return request(`/api/progress/${ayahKey}/mark`, {
    method: 'POST',
  });
}

export async function bulkMark(ayahKeys) {
  return request('/api/progress/bulk-mark', {
    method: 'POST',
    body: JSON.stringify({ ayahKeys }),
  });
}

// Activity Heatmap Endpoints
export async function getYearHeatmap(year) {
  return request(`/api/heatmap/year?year=${year}`);
}

export async function getLifetimeHeatmap() {
  return request('/api/heatmap/lifetime');
}

// Quran Content API Proxy
// In-memory session cache for static resources (never change during a session)
const _cache = {};
function cached(key, fetcher) {
  if (_cache[key]) return Promise.resolve(_cache[key]);
  return fetcher().then(data => { _cache[key] = data; return data; });
}

export function getChapters() {
  return cached('chapters', () => request('/api/content/chapters'));
}

export async function getAyah(key, translationId = 85) {
  return request(`/api/content/ayah/${key}?translation_id=${translationId}`);
}

export async function getAudio(key, reciter = 9) {
  return request(`/api/content/audio/${key}?reciter=${reciter}`);
}

export async function getTafsir(key, tafsirId = 169) {
  return request(`/api/content/tafsir/${key}?tafsir_id=${tafsirId}`);
}

export function getReciters() {
  return cached('reciters', () => request('/api/content/resources/reciters'));
}

export function getTranslations() {
  return cached('translations', () => request('/api/content/resources/translations'));
}

export function getTafsirsList() {
  return cached('tafsirs', () => request('/api/content/resources/tafsirs'));
}

// Quran Foundation API Proxy (Bookmarks, Streaks, etc.)
export async function getAyahState(ayahKey) {
  return request(`/api/qf/ayah-state/${ayahKey}`);
}

// Bookmarks
export async function getBookmarks() {
  return request('/api/qf/bookmarks');
}

export async function addBookmark(ayahKey) {
  return request('/api/qf/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ ayahKey }),
  });
}

export async function removeBookmark(bookmarkId) {
  return request(`/api/qf/bookmarks/${bookmarkId}`, { method: 'DELETE' });
}

// Streak
export async function getStreak() {
  return request('/api/qf/streak');
}

// Activity
export async function getActivityDays(from, to) {
  return request(`/api/qf/activity?from=${from}&to=${to}`);
}

// Goals
export async function getGoals() {
  return request('/api/qf/goals');
}

export async function createGoal(targetPages, periodType = 'daily') {
  return request('/api/qf/goals', {
    method: 'POST',
    body: JSON.stringify({ targetPages, periodType }),
  });
}

// Reflections
export async function getReflections() {
  return request('/api/qf/reflections');
}

export async function addReflection(ayahKey, text, isPublic = false) {
  return request('/api/qf/reflections', {
    method: 'POST',
    body: JSON.stringify({ ayahKey, text, isPublic }),
  });
}

export async function removeReflection(id) {
  return request(`/api/qf/reflections/${id}`, { method: 'DELETE' });
}

// Notes
export async function getNotes() {
  return request('/api/qf/notes');
}

export async function addNote(ayahKey, text) {
  return request('/api/qf/notes', {
    method: 'POST',
    body: JSON.stringify({ ayahKey, text }),
  });
}
