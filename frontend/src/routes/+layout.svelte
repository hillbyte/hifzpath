<script>
  import '../app.css';
  import { onMount, onDestroy } from 'svelte';
  import { user, isOnboarded, activeModal, contentPrefs } from '$lib/stores.js';
  import { getMe } from '$lib/api.js';
  import { page } from '$app/stores';
  import { requestNotificationPermission, scheduleReminder, clearReminder } from '$lib/notifications.js';
  import AyahModal from '../components/AyahModal.svelte';

  let { children } = $props();

  let authLoaded = $state(false);

  let currentPath = $derived($page.url.pathname);
  let isPublicPage = $derived(currentPath === '/' || currentPath === '/login' || currentPath === '/callback');
  let showNav = $derived($user && !isPublicPage);

  // Public pages render immediately, no auth check needed
  let shouldShowContent = $derived(isPublicPage || authLoaded);

  onMount(async () => {
    // Fire auth check (non-blocking for public pages)
    try {
      const data = await getMe();
      user.set(data.user);
      isOnboarded.set(data.isOnboarded);
      if (data.settings) {
        contentPrefs.update(prefs => ({
          ...prefs,
          reciterId: data.settings.reciterId ?? prefs.reciterId,
          translationId: data.settings.translationId ?? prefs.translationId,
          tafsirId: data.settings.tafsirId ?? prefs.tafsirId,
          showTransliteration: data.settings.showTransliteration ?? prefs.showTransliteration,
          showTranslation: data.settings.showTranslation ?? prefs.showTranslation,
          showTafsir: data.settings.showTafsir ?? prefs.showTafsir,
          showTajweed: data.settings.showTajweed ?? prefs.showTajweed,
          wordByWord: data.settings.wordByWord ?? prefs.wordByWord,
          wordAudio: data.settings.wordAudio ?? prefs.wordAudio,
        }));

        // Schedule browser notification if reminder time is set
        if (data.settings.reminderTime) {
          const granted = await requestNotificationPermission();
          if (granted) {
            scheduleReminder(data.settings.reminderTime);
          }
        }
      }
    } catch {
      user.set(null);
    }
    authLoaded = true;
  });

  onDestroy(() => {
    clearReminder();
  });

  function handleCloseModal() {
    activeModal.set(null);
  }
</script>

{#if showNav}
  <nav class="navbar">
    <a href="/dashboard" class="navbar-brand" style="display: flex; align-items: center; gap: 6px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      <span>HifzPath</span>
      <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gold-dark); background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.2); padding: 2px 6px; border-radius: var(--radius-full); margin-left: 2px; display: inline-flex; align-items: center; line-height: 1;">Early Beta</span>
    </a>
    <ul class="navbar-links">
      <li>
        <a href="/today" class:active={currentPath === '/today'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          <span class="nav-label">Today</span>
        </a>
      </li>
      <li>
        <a href="/review" class:active={currentPath === '/review'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
          <span class="nav-label">Review</span>
        </a>
      </li>
      <li>
        <a href="/dashboard" class:active={currentPath === '/dashboard'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          <span class="nav-label">Dashboard</span>
        </a>
      </li>
      <li>
        <a href="/settings" class:active={currentPath === '/settings'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span class="nav-label">Settings</span>
        </a>
      </li>
    </ul>
  </nav>
{/if}

{#if shouldShowContent}
  {@render children()}
{:else}
  <div class="loading-screen">
    <div class="loading-logo">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--gold-dark);">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </div>
    <p style="font-family: var(--font-display); font-weight: 600; font-size: 18px; color: var(--text);">HifzPath</p>
    <p class="text-muted" style="font-size: 13px;">Preparing your journey...</p>
  </div>
{/if}

{#if $activeModal}
  <AyahModal ayahKey={$activeModal.key} onclose={handleCloseModal} />
{/if}

<style>
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 12px;
    color: var(--text-muted);
    font-family: var(--font-body);
  }
  .loading-logo {
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
