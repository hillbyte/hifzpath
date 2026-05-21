<script>
  let { data } = $props();
  import { goto } from '$app/navigation';
  import { getToday, rateAyah, getAyah, getAudio } from '$lib/api.js';
  import { user, audioState, contentPrefs, todayData, reviewAyahContent } from '$lib/stores.js';
  import { playAudio, pauseAudio, toggleLoop, setSpeed, stopAudio } from '$lib/audio.js';
  import AyahRenderer from '../../components/AyahRenderer.svelte';

  // SWR: Initialize from store if navigating back
  let loading = $derived($todayData === null);
  let queue = $state($todayData?.reviewQueue || []);
  let currentIndex = $state(0);
  let currentAyahContent = $state($reviewAyahContent);
  let audioUrl = $state('');
  let isRating = $state(false);

  let currentItem = $derived(queue[currentIndex] || null);
  let progressPercent = $derived($audioState.duration > 0
    ? ($audioState.progress / $audioState.duration) * 100 : 0);

  $effect(() => {
    if (!$user) { goto('/login'); return; }
    
    data.streamed.todayPromise.then(async (result) => {
      todayData.set(result);
      queue = result.reviewQueue || [];
      if (queue.length === 0) { return; }
      
      if (currentIndex >= queue.length) currentIndex = 0;
      
      if (!currentAyahContent) {
        await loadCurrentAyah();
      }
    }).catch(err => console.error('Review load error:', err));
  });

  async function loadCurrentAyah() {
    if (!currentItem) return;
    stopAudio();
    currentAyahContent = null;
    reviewAyahContent.set(null);
    audioUrl = '';
    try {
      const [content, audio] = await Promise.all([
        getAyah(currentItem.ayahKey, $contentPrefs.translationId),
        getAudio(currentItem.ayahKey, $contentPrefs.reciterId)
      ]);
      currentAyahContent = content;
      reviewAyahContent.set(content);
      if (audio?.audio_files?.length) {
        const file = audio.audio_files[0];
        audioUrl = file.url.startsWith('http') ? file.url : `https://audio.qurancdn.com/${file.url}`;
      } else { audioUrl = ''; }
    } catch (err) { console.error('Ayah content error:', err); }
  }

  function handleRate(value) {
    if (!currentItem || isRating) return;
    isRating = true;
    const ayahKey = currentItem.ayahKey;
    
    // Optimistic UI updates
    stopAudio();
    if (currentIndex < queue.length - 1) { 
      currentIndex++; 
      loadCurrentAyah().finally(() => { isRating = false; });
    } else { 
      currentIndex = queue.length; // show complete state
      isRating = false; 
    }

    // Fire and forget the rating
    rateAyah(ayahKey, value).catch(err => {
      console.error('Rate error:', err);
    });
  }

  function handlePlay() {
    if (!audioUrl) return;
    if ($audioState.playing) pauseAudio(); else playAudio(audioUrl);
  }

  function skip() {
    currentIndex++;
    if (currentIndex >= queue.length) { /* stay on page — show complete state */ }
    else loadCurrentAyah();
  }
</script>

<svelte:head><title>Review Session — HifzPath</title></svelte:head>

<div class="page container-narrow">
  {#if loading}
    <!-- Structural skeleton matching review layout -->
    <div class="page-header" style="text-align: center;">
      <div class="skeleton-text" style="width: 160px; margin: 0 auto 12px;"></div>
      <div class="skeleton-block" style="height: 6px; border-radius: 999px;"></div>
    </div>
    <div class="card" style="margin-bottom: 24px;">
      <div class="skeleton-text" style="width: 60px; margin-bottom: 12px;"></div>
      <div class="skeleton-block" style="height: 90px; margin-bottom: 16px;"></div>
      <div style="border-top: 1px solid var(--bg-variant); padding-top: 16px;">
        <div class="skeleton-text" style="width: 100%; margin-bottom: 8px;"></div>
        <div class="skeleton-text" style="width: 70%;"></div>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 16px; border-top: 2px solid var(--bg-variant); padding-top: 16px;">
        <div class="skeleton-circle" style="width: 40px; height: 40px;"></div>
        <div class="skeleton-circle" style="width: 40px; height: 40px;"></div>
        <div class="skeleton-block" style="flex: 1; height: 4px; align-self: center;"></div>
      </div>
    </div>
    <div class="skeleton-text lg" style="width: 220px; margin: 0 auto 12px;"></div>
    <div class="rating-row">
      {#each [1, 2, 3, 4] as _}
        <div class="skeleton-block" style="height: 60px;"></div>
      {/each}
    </div>
  {:else if currentItem}
    <div class="page-header" style="text-align: center;">
      <span class="label">Review Session · {currentIndex + 1} of {queue.length}</span>
      <div class="progress-bar" style="margin-top: 12px;"><div class="progress-fill" style="width: {((currentIndex + 1) / queue.length) * 100}%"></div></div>
    </div>
    <div class="card" style="margin-bottom: 24px;">
      <div class="label" style="margin-bottom: 12px;">{currentItem.ayahKey}</div>
      {#if currentAyahContent?.verse}
        <AyahRenderer ayah={currentAyahContent.verse} />
      {/if}
      {#if $contentPrefs.showTransliteration && currentAyahContent?.verse?.words}
        <p class="text-muted" style="text-align: center; font-style: italic; margin-bottom: 12px; font-size: 14px;">{currentAyahContent.verse.words.map(w => w.transliteration?.text).filter(Boolean).join(' ')}</p>
      {/if}
      {#if $contentPrefs.showTranslation && currentAyahContent?.verse?.translations?.length}
        <p style="text-align: center; color: var(--text-muted); font-size: 15px; line-height: 1.6; border-top: 1px solid var(--bg-variant); padding-top: 16px;">{currentAyahContent.verse.translations[0].text?.replace(/<[^>]*>/g, '') || ''}</p>
      {/if}
      {#if audioUrl}
        <div class="audio-controls" style="border-top: 2px solid var(--bg-variant); padding-top: 16px; margin-top: 16px;">
          <button class="btn btn-primary btn-icon" onclick={handlePlay} aria-label="Play/Pause">
            {#if $audioState.playing}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {/if}
          </button>
          <button class="btn btn-icon" class:btn-primary={$audioState.loop} class:btn-outline={!$audioState.loop} onclick={() => toggleLoop()} aria-label="Loop">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
          </button>
          <div class="audio-progress"><div class="audio-progress-fill" style="width: {progressPercent}%"></div></div>
        </div>
      {/if}
    </div>
    <h3 style="text-align: center; margin-bottom: 12px;">How well did you remember this?</h3>
    <div class="rating-row">
      <button class="rating-btn again" onclick={() => handleRate(0)} disabled={isRating}><span class="btn-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></span><span>Again</span></button>
      <button class="rating-btn hard" onclick={() => handleRate(1)} disabled={isRating}><span class="btn-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/></svg></span><span>Hard</span></button>
      <button class="rating-btn good" onclick={() => handleRate(2)} disabled={isRating}><span class="btn-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg></span><span>Good</span></button>
      <button class="rating-btn easy" onclick={() => handleRate(3)} disabled={isRating}><span class="btn-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span><span>Easy</span></button>
    </div>
    <div style="text-align: center; margin-top: 16px;"><button class="btn btn-sm btn-outline" onclick={skip}>Skip →</button></div>
    {#if queue.length > 1}
      <div class="card-flat" style="margin-top: 24px; padding: 16px;">
        <span class="label" style="margin-bottom: 8px; display: block;">Queue</span>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          {#each queue as item, i}
            <span class="chip" class:chip-memorised={i < currentIndex} class:chip-review={i === currentIndex} class:chip-new={i > currentIndex}>{item.ayahKey}</span>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <div class="card" style="text-align: center; padding: 60px;">
      <div class="complete-icon-wrapper" style="margin-bottom: 24px; color: var(--gold-dark); background: #fffdf5; border: 3px solid var(--border); box-shadow: 4px 4px 0 var(--border); display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; border-radius: 50%;">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/></svg>
      </div>
      <h2>All caught up!</h2>
      <p class="text-muted" style="margin-top: 8px;">No ayah to review right now. Come back later when your spaced repetition schedule surfaces more.</p>
      <a href="/today" class="btn btn-primary btn-lg" style="margin-top: 24px;">Learn New Ayah →</a>
    </div>
  {/if}
</div>

<style>
  .progress-bar { height: 6px; background: var(--bg-variant); border-radius: var(--radius-full); overflow: hidden; }
  .progress-fill { height: 100%; background: var(--sage); border-radius: var(--radius-full); transition: width 0.3s ease; }
</style>
