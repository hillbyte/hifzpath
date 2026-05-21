<script>
  import { onMount } from 'svelte';

  const QF_CLIENT_ID = import.meta.env.VITE_QF_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
  const QF_OAUTH = import.meta.env.VITE_QF_OAUTH;

  let loading = $state(false);

  function generateRandom(length) {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async function startLogin() {
    loading = true;
    const codeVerifier = generateRandom(32);
    const state = generateRandom(16);
    const nonce = generateRandom(16);
    const codeChallenge = await sha256(codeVerifier);

    // Store for callback verification
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: QF_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid offline_access streak goal activity_day reading_session preference bookmark collection note',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });

    window.location.href = `${QF_OAUTH}/oauth2/auth?${params.toString()}`;
  }
</script>

<svelte:head>
  <title>Login — HifzPath</title>
</svelte:head>

<div class="container-narrow" style="padding-top: 100px; padding-bottom: 60px; display: flex; justify-content: center; align-items: center; min-height: 70vh;">
  <div class="card" style="width: 100%; max-width: 420px; padding: 40px; text-align: center; display: flex; flex-direction: column; gap: 24px; box-shadow: var(--shadow-lg); border: 1px solid var(--border);">
    <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
      <div style="background: rgba(212, 175, 55, 0.1); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(212, 175, 55, 0.2); color: var(--gold-dark); margin-bottom: 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </div>
      <h2 style="font-size: 24px; font-weight: 700; margin: 0;">Welcome to HifzPath</h2>
      <p class="text-muted" style="font-size: 14.5px; line-height: 1.5; margin: 0; max-width: 320px;">
        Sync your streaks, bookmarks, and study notes perfectly across all devices using your Quran.com account.
      </p>
    </div>

    <div style="margin-top: 8px;">
      <button 
        class="btn btn-primary btn-lg" 
        style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600; padding: 14px; cursor: pointer;" 
        onclick={startLogin} 
        disabled={loading}
      >
        {#if loading}
          <span class="animate-pulse">Connecting to Quran.com...</span>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          <span>Login with Quran.com</span>
        {/if}
      </button>
    </div>

    <div style="border-top: 1px solid var(--border); padding-top: 16px; margin-top: 8px;">
      <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin: 0;">
        By logging in, you authorize HifzPath to securely synchronize your learning progress with the Quran Foundation (Quran.com) API.
      </p>
    </div>
  </div>
</div>
