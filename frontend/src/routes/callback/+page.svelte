<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { exchangeCode } from '$lib/api.js';
  import { user, isOnboarded } from '$lib/stores.js';

  let status = $state('Processing login...');
  let errorMsg = $state('');

  onMount(async () => {
    const params = $page.url.searchParams;
    const code = params.get('code');
    const state = params.get('state');

    const savedState = sessionStorage.getItem('oauth_state');
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

    if (!code) {
      errorMsg = 'No authorization code received.';
      return;
    }

    if (state && savedState && state !== savedState) {
      errorMsg = 'State mismatch — possible CSRF attack.';
      return;
    }

    try {
      status = 'Exchanging code for session...';
      const redirectUri = import.meta.env.VITE_REDIRECT_URI;
      const data = await exchangeCode(code, codeVerifier || '', redirectUri);

      user.set(data.user);

      // Clean up session storage
      sessionStorage.removeItem('pkce_code_verifier');
      sessionStorage.removeItem('oauth_state');

      // Check if onboarded
      status = 'Login successful! Redirecting...';

      // Quick check — if not onboarded, go to onboarding
      try {
        const { getMe } = await import('$lib/api.js');
        const meData = await getMe();
        isOnboarded.set(meData.isOnboarded);
        if (!meData.isOnboarded) {
          goto('/onboarding');
        } else {
          goto('/today');
        }
      } catch {
        goto('/onboarding');
      }
    } catch (err) {
      errorMsg = err.message || 'Failed to exchange code.';
    }
  });
</script>

<div class="container-narrow" style="padding-top: 100px; padding-bottom: 60px; display: flex; justify-content: center; align-items: center; min-height: 70vh;">
  {#if errorMsg}
    <div class="card" style="border-color: var(--rose); width: 100%; max-width: 420px; text-align: center; padding: 40px; box-shadow: var(--shadow-md);">
      <div style="background: rgba(186, 26, 26, 0.1); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(186, 26, 26, 0.2); color: var(--rose); margin: 0 auto 16px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h3 style="color: var(--rose); margin-bottom: 12px; font-size: 20px;">Login Failed</h3>
      <p class="text-muted" style="margin-bottom: 24px; line-height: 1.5;">{errorMsg}</p>
      <a href="/login" class="btn btn-primary" style="width: 100%; display: inline-block;">Return to Login</a>
    </div>
  {:else}
    <div class="card" style="width: 100%; max-width: 420px; padding: 48px 40px; text-align: center; display: flex; flex-direction: column; gap: 24px; box-shadow: var(--shadow-lg); border: 1px solid var(--border); align-items: center;">
      
      <div style="position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
        <!-- Pulsing background rings -->
        <div class="animate-ping" style="position: absolute; inset: 0; border-radius: 50%; background: rgba(212, 175, 55, 0.2);"></div>
        <div class="animate-pulse" style="position: absolute; inset: 8px; border-radius: 50%; background: rgba(212, 175, 55, 0.3);"></div>
        
        <!-- Center Icon -->
        <div style="position: relative; z-index: 10; background: var(--bg); width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--gold); color: var(--gold-dark); box-shadow: 0 4px 12px rgba(212, 175, 55, 0.15);">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </div>
      </div>
      
      <div>
        <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 8px 0; color: var(--text);">Authenticating</h2>
        <p class="text-muted animate-pulse" style="font-size: 15px; margin: 0; color: var(--gold-dark); font-weight: 500;">
          {status}
        </p>
      </div>
      
      <!-- Progress Bar -->
      <div style="width: 100%; height: 4px; background: var(--surface-hover); border-radius: 2px; overflow: hidden; margin-top: 8px;">
        <div style="height: 100%; background: var(--gold); border-radius: 2px; transition: width 0.3s ease; width: {status.includes('successful') ? '100%' : status.includes('Exchanging') ? '66%' : '33%'};"></div>
      </div>

    </div>
  {/if}
</div>
