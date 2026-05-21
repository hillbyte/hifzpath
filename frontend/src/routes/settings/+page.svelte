<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getSettings, updateSettings, logout, getReciters, getTranslations, getTafsirsList } from '$lib/api.js';
  import { user, contentPrefs } from '$lib/stores.js';
  import { requestNotificationPermission, scheduleReminder, clearReminder } from '$lib/notifications.js';

  // Initialize from contentPrefs store immediately (already loaded in layout)
  let settings = $state({
    dailyGoal: 1, khatmDeadline: '', reminderTime: '',
    ...$contentPrefs,
  });
  let saving = $state(false);
  let saved = $state(false);
  let listsLoading = $state(true);

  let reciters = $state([]);
  let translations = $state([]);
  let tafsirs = $state([]);

  onMount(async () => {
    if (!$user) { goto('/login'); return; }

    // Fetch DB settings + dropdown lists in parallel (form is already usable)
    try {
      const [data, recitersData, translationsData, tafsirsData] = await Promise.all([
        getSettings(),
        getReciters(),
        getTranslations(),
        getTafsirsList()
      ]);
      
      reciters = recitersData.recitations || [];
      translations = translationsData.translations || [];
      tafsirs = tafsirsData.tafsirs || [];

      // Merge any DB-only fields (dailyGoal, deadlines) that aren't in contentPrefs
      if (data.settings) {
        settings = { ...settings, ...data.settings };
      }
    } catch (err) { console.error('Settings load error:', err); }
    listsLoading = false;
  });

  async function save() {
    saving = true; saved = false;
    try {
      await updateSettings(settings);
      contentPrefs.update(prefs => ({ ...prefs, ...settings }));

      // Reschedule browser notification
      if (settings.reminderTime) {
        const granted = await requestNotificationPermission();
        if (granted) scheduleReminder(settings.reminderTime);
      } else {
        clearReminder();
      }

      saved = true;
      setTimeout(() => saved = false, 2000);
    } catch (err) { console.error('Settings save error:', err); }
    saving = false;
  }

  async function handleLogout() {
    await logout();
    user.set(null);
    goto('/');
  }
</script>

<svelte:head><title>Settings — HifzPath</title></svelte:head>

<div class="page container-narrow">
  <div class="page-header"><h1>Settings</h1></div>

    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin-bottom: 20px;">Daily Goal</h3>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        {#each [1, 2, 3] as g}
          <button class="btn" class:btn-primary={settings.dailyGoal === g} class:btn-outline={settings.dailyGoal !== g} onclick={() => settings.dailyGoal = g}>{g} ayah/day</button>
        {/each}
        <div style="display: flex; align-items: center; gap: 6px;">
          <input
            type="number"
            min="1"
            max="100"
            placeholder="Custom"
            value={![1, 2, 3].includes(settings.dailyGoal) ? settings.dailyGoal : ''}
            oninput={(e) => { const v = parseInt(e.target.value); if (v > 0) settings.dailyGoal = v; }}
            class="btn"
            class:btn-primary={![1, 2, 3].includes(settings.dailyGoal)}
            class:btn-outline={[1, 2, 3].includes(settings.dailyGoal)}
            style="width: 140px; text-align: center; -moz-appearance: textfield;"
          />
          {#if ![1, 2, 3].includes(settings.dailyGoal)}
            <span style="font-size: 14px; font-weight: 600;">ayah/day</span>
          {:else}
            <span class="text-muted" style="font-size: 14px; font-weight: 600;">ayah/day</span>
          {/if}
        </div>
      </div>
      <p class="text-muted" style="margin-top: 12px; font-size: 14px;">At {settings.dailyGoal} ayah/day, complete Quran in ~{Math.ceil(6236 / settings.dailyGoal / 365)} years</p>
    </div>
    
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin-bottom: 20px;">Content Preferences</h3>
      
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" bind:checked={settings.showTajweed} />
          <span>Show Tajweed Colors (Arabic script)</span>
        </label>
        
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" bind:checked={settings.wordByWord} />
          <span>Word-by-word Meaning (Hover/Tap)</span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" bind:checked={settings.wordAudio} />
          <span>Word-by-word Audio (Play word on click/tap)</span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" bind:checked={settings.showTransliteration} />
          <span>Show Transliteration (Pronunciation guide)</span>
        </label>
        
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" bind:checked={settings.showTranslation} />
          <span>Show Translation</span>
        </label>

        {#if settings.showTranslation}
        <div style="padding-left: 24px;">
          <label class="input-label">
            Translation Source
            <select class="input" bind:value={settings.translationId} style="margin-top: 4px;">
              {#if listsLoading && translations.length === 0}
                <option>Loading translations...</option>
              {:else}
                {#each translations as t}
                  <option value={t.id}>{t.name} ({t.language_name})</option>
                {/each}
              {/if}
            </select>
          </label>
        </div>
        {/if}

        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" bind:checked={settings.showTafsir} />
          <span>Enable Tafsir (Explanation) Toggle</span>
        </label>

        {#if settings.showTafsir}
        <div style="padding-left: 24px;">
          <label class="input-label">
            Tafsir Source
            <select class="input" bind:value={settings.tafsirId} style="margin-top: 4px;">
              {#if listsLoading && tafsirs.length === 0}
                <option>Loading tafsirs...</option>
              {:else}
                {#each tafsirs as t}
                  <option value={t.id}>{t.name} ({t.language_name})</option>
                {/each}
              {/if}
            </select>
          </label>
        </div>
        {/if}

        <div style="margin-top: 8px;">
          <label class="input-label">
            Audio Reciter
            <select class="input" bind:value={settings.reciterId} style="margin-top: 4px;">
              {#if listsLoading && reciters.length === 0}
                <option>Loading reciters...</option>
              {:else}
                {#each reciters as r}
                  <option value={r.id}>{r.reciter_name}{r.style ? ` (${r.style})` : ''}</option>
                {/each}
              {/if}
            </select>
          </label>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 24px;">
      <h3 style="margin-bottom: 20px;">Scheduling</h3>
      <label class="input-label">
        Target completion date (Khatm deadline)
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; margin-top: 4px;">
          <input type="date" class="input" bind:value={settings.khatmDeadline} style="max-width: 300px;" />
          {#if settings.khatmDeadline}
            <button type="button" class="btn btn-sm btn-outline" onclick={() => settings.khatmDeadline = ''} title="Clear deadline">✕</button>
          {/if}
        </div>
      </label>
      {#if settings.khatmDeadline}
        {@const deadline = new Date(settings.khatmDeadline)}
        {@const today = new Date()}
        {@const daysLeft = Math.max(0, Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)))}
        {@const ayaatLeft = 6236}
        {@const pace = daysLeft > 0 ? Math.ceil(ayaatLeft / daysLeft) : ayaatLeft}
        <p class="text-muted" style="font-size: 13px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px;">
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{daysLeft} days left — you'll need ~<strong>{pace} ayah/day</strong> to finish on time.</span>
          </span>
          {#if settings.dailyGoal >= pace}
            <span style="color: var(--sage-dark); display: inline-flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Your current goal ({settings.dailyGoal}/day) is on track!</span>
            </span>
          {:else}
            <span style="color: #c44; display: inline-flex; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>Your current goal ({settings.dailyGoal}/day) is below the required pace.</span>
            </span>
          {/if}
        </p>
      {:else}
        <p class="text-muted" style="font-size: 13px; margin-bottom: 16px;">Set a target date and we'll calculate the daily pace you need.</p>
      {/if}
      
      <label class="input-label">
        Daily reminder time
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; margin-top: 4px;">
          <input type="time" class="input" bind:value={settings.reminderTime} style="max-width: 200px;" />
          {#if settings.reminderTime}
            <button type="button" class="btn btn-sm btn-outline" onclick={() => settings.reminderTime = ''} title="Clear reminder">✕</button>
          {/if}
        </div>
      </label>
      <p class="text-muted" style="font-size: 13px;">
        {settings.reminderTime ? `🔔 You'll receive a browser notification at ${settings.reminderTime} to remind you to study (tab must be open).` : 'Set a time and we\'ll send you a browser notification to study each day.'}
      </p>
    </div>

    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 40px;">
      <button class="btn btn-primary btn-lg" onclick={save} disabled={saving}>{saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}</button>
      {#if saved}<span class="chip chip-memorised">Settings saved</span>{/if}
    </div>
    
    <div class="card" style="border-color: var(--rose); margin-bottom: 40px;">
      <h3 style="margin-bottom: 16px; color: var(--rose);">Account</h3>
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; background: var(--bg); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border);">
        {#if $user?.avatarUrl}
          <img src={$user.avatarUrl} alt="Avatar" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gold);" />
        {:else}
          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--surface-hover); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: var(--gold-dark); border: 2px solid var(--gold);">
            {($user?.displayName || $user?.email || 'U').charAt(0).toUpperCase()}
          </div>
        {/if}
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <strong style="font-size: 16px;">{$user?.displayName || 'Quran.com User'}</strong>
          {#if $user?.email}
            <span class="text-muted" style="font-size: 14px;">{$user.email}</span>
          {/if}
        </div>
      </div>
      <button class="btn btn-danger btn-sm" onclick={handleLogout} style="display: inline-flex; align-items: center; gap: 6px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Log Out
      </button>
    </div>
</div>
