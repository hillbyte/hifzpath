<script>
  import { onMount, onDestroy } from 'svelte';
  import { getAyah, getAudio, markMemorised, getAyahProgress, addBookmark, removeBookmark, addNote, getAyahState } from '$lib/api.js';
  import { playAudio, pauseAudio, toggleLoop, setSpeed, stopAudio } from '$lib/audio.js';
  import { audioState, contentPrefs } from '$lib/stores.js';
  import { showToast } from '$lib/effects.js';
  import AyahRenderer from './AyahRenderer.svelte';

  let { ayahKey = '', onclose } = $props();

  let ayahData = $state(null);
  let audioUrl = $state('');
  let progressData = $state(null);
  let loading = $state(true);
  let marking = $state(false);
  let bookmarking = $state(false);
  let bookmarked = $state(false);
  let bookmarkId = $state(null);
  let showReflectBox = $state(false);
  let noteText = $state('');
  let submittingNote = $state(false);

  let progressPercent = $derived($audioState.duration > 0
    ? ($audioState.progress / $audioState.duration) * 100
    : 0);

  const SURAH_NAMES = ['Al-Fatiha','Al-Baqarah','Aal-Imran','An-Nisa','Al-Ma\'idah','Al-An\'am','Al-A\'raf','Al-Anfal','At-Tawbah','Yunus','Hud','Yusuf','Ar-Ra\'d','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Mu\'minun','An-Nur','Al-Furqan','Ash-Shu\'ara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqi\'ah','Al-Hadid','Al-Mujadilah','Al-Hashr','Al-Mumtahanah','As-Saff','Al-Jumu\'ah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma\'arij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Nazi\'at','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A\'la','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qari\'ah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Ma\'un','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'];

  function getSurahName(num) {
    return SURAH_NAMES[(num || 1) - 1] || `Surah ${num}`;
  }

  onMount(async () => {
    try {
      const [verseRes, audioRes] = await Promise.all([
        getAyah(ayahKey, $contentPrefs.translationId),
        getAudio(ayahKey, $contentPrefs.reciterId),
      ]);
      ayahData = verseRes;
      if (audioRes?.audio_files?.length) {
        const file = audioRes.audio_files[0];
        audioUrl = file.url.startsWith('http') ? file.url : `https://audio.qurancdn.com/${file.url}`;
      }
      try {
        const prog = await getAyahProgress(ayahKey);
        progressData = prog.progress;
      } catch {}
      try {
        const state = await getAyahState(ayahKey);
        bookmarked = state.bookmarked;
        bookmarkId = state.bookmarkId;
        if (state.note) {
          noteText = state.note;
        }
      } catch (err) { console.error('State load error:', err); }
    } catch (err) {
      console.error('Modal load error:', err);
    }
    loading = false;
  });

  onDestroy(() => { stopAudio(); });

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget && onclose) onclose();
  }

  async function handleMark() {
    marking = true;
    try {
      await markMemorised(ayahKey);
      progressData = { ...(progressData || {}), status: 'memorised' };
    } catch (err) { console.error('Mark error:', err); }
    marking = false;
  }

  function handlePlay() {
    if (audioUrl) {
      if ($audioState.playing) pauseAudio();
      else playAudio(audioUrl);
    }
  }

  async function handleBookmark() {
    bookmarking = true;
    try {
      if (bookmarked && bookmarkId) {
        await removeBookmark(bookmarkId);
        bookmarked = false;
        bookmarkId = null;
        showToast('Bookmark removed', 'success');
      } else {
        const res = await addBookmark(ayahKey);
        bookmarked = true;
        if (res.data && res.data.id) bookmarkId = res.data.id;
        showToast('Bookmarked on Quran.com! 🔖', 'success');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      showToast('Could not sync bookmark', 'error');
    }
    bookmarking = false;
  }

  async function handleNote() {
    if (!noteText.trim()) return;
    submittingNote = true;
    try {
      await addNote(ayahKey, noteText.trim());
      showReflectBox = false;
      showToast('Note saved to Quran.com! ✍️', 'success');
    } catch (err) {
      console.error('Note error:', err);
      showToast('Could not save note', 'error');
    }
    submittingNote = false;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={handleOverlayClick} role="presentation">
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
      <span class="label" style="display: flex; align-items: center; gap: 8px;">
        {getSurahName(parseInt(ayahKey.split(':')[0]))} · Ayah {ayahKey.split(':')[1]}
        {#if progressData?.status}
          <span class="chip" style="margin: 0; padding: 2px 8px; font-size: 11px;" class:chip-memorised={progressData.status === 'memorised'} class:chip-review={progressData.status === 'learning'} class:chip-new={progressData.status === 'new'}>
            {progressData.status === 'memorised' ? 'Memorized' : progressData.status === 'learning' ? 'In Review' : 'New'}
          </span>
        {/if}
      </span>
      <div style="display: flex; align-items: center; gap: 8px;">
        <!-- Sync Bookmark with QF -->
        <button class="btn btn-icon btn-sm" class:btn-primary={bookmarked} class:btn-outline={!bookmarked} onclick={handleBookmark} disabled={bookmarking} title={bookmarked ? 'Remove Bookmark (Syncs with Quran.com)' : 'Add Bookmark (Syncs with Quran.com)'} aria-label="Bookmark">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
        </button>
        <!-- Sync Note with QF -->
        <button class="btn btn-icon btn-sm" class:btn-primary={noteText !== ''} class:btn-outline={noteText === ''} onclick={() => showReflectBox = !showReflectBox} title={noteText ? 'Edit Study Note (Syncs with Quran.com)' : 'Add Study Note (Syncs with Quran.com)'} aria-label="Add Note">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
        <!-- Close Modal -->
        <button class="btn btn-icon btn-sm btn-outline" onclick={() => onclose?.()}>✕</button>
      </div>
    </div>
    <div class="modal-body">
      {#if loading}
        <div style="border-left: 4px solid var(--sage); padding-left: 16px; margin-bottom: 16px;">
          <div class="skeleton-block" style="height: 70px;"></div>
        </div>
        <div class="skeleton-text" style="width: 100%; margin-bottom: 8px;"></div>
        <div class="skeleton-text" style="width: 75%; margin-bottom: 20px;"></div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <div class="skeleton-circle" style="width: 36px; height: 36px;"></div>
          <div class="skeleton-circle" style="width: 36px; height: 36px;"></div>
          <div class="skeleton-block" style="flex: 1; height: 4px;"></div>
        </div>
      {:else if ayahData}
        <div style="border-left: 4px solid var(--sage); padding-left: 16px; margin-bottom: 16px;">
          <AyahRenderer ayah={ayahData.verse} />
        </div>
        
        {#if $contentPrefs.showTransliteration && ayahData.verse?.words}
          <p class="text-muted" style="text-align: left; font-style: italic; margin-bottom: 12px; font-size: 14px;">{ayahData.verse.words.map(w => w.transliteration?.text).filter(Boolean).join(' ')}</p>
        {/if}
 
        {#if $contentPrefs.showTranslation && ayahData.verse?.translations?.length}
          <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 15px; line-height: 1.6;">
            {ayahData.verse.translations[0].text?.replace(/<[^>]*>/g, '') || ''}
          </p>
        {/if}
 
        {#if audioUrl}
          <div class="audio-controls">
            <button class="btn btn-sm btn-primary btn-icon" onclick={handlePlay} aria-label="Play/Pause">
              {#if $audioState.playing}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {/if}
            </button>
            <button class="btn btn-sm btn-icon" class:btn-primary={$audioState.loop} class:btn-outline={!$audioState.loop} onclick={() => toggleLoop()} aria-label="Loop">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
            </button>
            <div class="audio-progress"><div class="audio-progress-fill" style="width: {progressPercent}%"></div></div>
            <div style="display: flex; gap: 4px;">
              {#each [0.75, 1, 1.25] as s}
                <button class="btn btn-sm" class:btn-primary={$audioState.speed === s} class:btn-outline={$audioState.speed !== s} style="padding: 4px 8px; font-size: 11px;" onclick={() => setSpeed(s)}>{s}x</button>
              {/each}
            </div>
          </div>
        {/if}
 
        {#if showReflectBox}
          <div style="margin-top: 16px; border-top: 1px solid var(--bg-variant); padding-top: 16px;">
            <textarea class="input" rows="3" placeholder="Write your private note on this ayah..." bind:value={noteText} style="width: 100%; resize: vertical; font-size: 14px; background: var(--bg-variant); border-color: var(--border);"></textarea>
            <div style="display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end;">
              <button class="btn btn-sm btn-outline" onclick={() => { showReflectBox = false; }}>Close</button>
              <button class="btn btn-sm btn-primary" onclick={handleNote} disabled={submittingNote || !noteText.trim()}>
                {submittingNote ? 'Saving...' : 'Save Note to Quran.com'}
              </button>
            </div>
          </div>
        {/if}
      {:else}
        <p class="text-muted">Could not load ayah data.</p>
      {/if}
    </div>
    <div class="modal-footer" style="display: flex; gap: 12px;">
      <button class="btn btn-primary btn-lg" style="flex: 1;" onclick={handleMark} disabled={marking || progressData?.status === 'memorised'}>
        {progressData?.status === 'memorised' ? '✓ Already Memorized' : marking ? 'Marking...' : '✓ Mark as Memorized'}
      </button>
    </div>
  </div>
</div>
