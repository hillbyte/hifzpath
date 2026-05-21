<script>
  let { data } = $props();
  import { goto } from '$app/navigation';
  import { getToday, rateAyah, getAyah, getAudio, getTafsir, addBookmark, removeBookmark, addNote, getAyahState, navigateAyah } from '$lib/api.js';
  import { todayData, user, isOnboarded, audioState, contentPrefs, todayAyahContent } from '$lib/stores.js';
  import { playAudio, pauseAudio, toggleLoop, setSpeed } from '$lib/audio.js';
  import { triggerConfetti, showToast } from '$lib/effects.js';
  import AyahRenderer from '../../components/AyahRenderer.svelte';

  // SWR: Initialize from store if navigating back
  let loading = $derived($todayData === null);
  let newAyah = $state($todayData?.newAyah || null);
  let ayahContent = $state($todayAyahContent);
  let audioUrl = $state('');
  let reviewQueue = $state($todayData?.reviewQueue || []);
  let totalLearned = $state($todayData?.totalLearned || 0);
  let isRating = $state(false);
  let rateSuccess = $state(false);
  let showTafsir = $state(false);
  let tafsirText = $state('');
  let tafsirLoading = $state(false);
  let bookmarking = $state(false);
  let bookmarked = $state(false);
  let bookmarkId = $state(null);
  let showReflectBox = $state(false);
  let noteText = $state('');
  let submittingNote = $state(false);
  let scheduling = $state($todayData?.scheduling || null);

  // Daily goal tracking
  let goalReached = $state($todayData?.goalReached || false);
  let learnedToday = $state($todayData?.learnedToday || 0);
  let dailyGoal = $state($todayData?.dailyGoal || 1);
  let goalOverride = $state(false); // user chose to keep going past goal
  let navigating = $state(false);

  let progressPercent = $derived($audioState.duration > 0
    ? ($audioState.progress / $audioState.duration) * 100 : 0);

  const SURAH_NAMES = ['Al-Fatiha','Al-Baqarah','Aal-Imran','An-Nisa','Al-Ma\'idah','Al-An\'am','Al-A\'raf','Al-Anfal','At-Tawbah','Yunus','Hud','Yusuf','Ar-Ra\'d','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Mu\'minun','An-Nur','Al-Furqan','Ash-Shu\'ara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqi\'ah','Al-Hadid','Al-Mujadilah','Al-Hashr','Al-Mumtahanah','As-Saff','Al-Jumu\'ah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma\'arij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Nazi\'at','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A\'la','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qari\'ah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Ma\'un','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'];

  let showDailyTip = $state(false);

  const TIPS = [
    {
      type: 'Hadith Inspiration',
      source: 'Sahih al-Bukhari',
      arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
      translation: '"The best among you are those who learn the Quran and teach it."',
      tip: 'Start your memorization session by reminding yourself of your intention. Sincerity (Ikhlas) is the spiritual foundation of retention.'
    },
    {
      type: 'Quranic Promise',
      source: 'Surah Al-Qamar, 17',
      arabic: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ',
      translation: '"And We have certainly made the Quran easy for remembrance, so is there any who will remember?"',
      tip: 'Trust in Allah\'s promise. The Quran is designed for human memory. Approach each new ayah with absolute confidence and positivity.'
    },
    {
      type: 'Technique: Spaced Repetition',
      source: 'Hifz Science',
      arabic: '',
      translation: '',
      tip: 'Review older ayaat at expanding intervals (1 day, 3 days, 7 days, 15 days). Spaced Repetition prevents memory decay and solidifies permanent recall.'
    },
    {
      type: 'Hadith Inspiration',
      source: 'Sahih Muslim',
      arabic: 'تَعَاهَدُوا الْقُرْآنَ فَوَالَّذِي نَفْسِي بِيَدِهِ لَهُوَ أَشَدُّ تَفَصِّيًا مِنَ الإِبِلِ فِي عُقُلِهَا',
      translation: '"Keep refreshing your knowledge of the Quran, for by Him in Whose Hand is my soul, it is more liable to escape than camels which are bound."',
      tip: 'Never skip your daily review queue! A consistent, small review session is infinitely more effective than a massive weekly catch-up.'
    },
    {
      type: 'Technique: Active Recall',
      source: 'Cognitive Science',
      arabic: '',
      translation: '',
      tip: 'Instead of just reading the page over and over, cover the text and actively force your brain to retrieve the next word. Active recall strengthens neural connections.'
    },
    {
      type: 'Hadith Inspiration',
      source: 'Sunan al-Tirmidhi',
      arabic: 'يُقَالُ لِصَاحِبِ الْقُرْآنِ اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا',
      translation: '"It will be said to the companion of the Quran: Read, ascend, and recite slowly and melodiously as you recited in the world..."',
      tip: 'Recite with a slow, melodious pace (Tarteel). The rhythm and auditory feedback engage different parts of your brain, making the ayah stick faster.'
    },
    {
      type: 'Technique: Connection Mapping',
      source: 'Hifz Science',
      arabic: '',
      translation: '',
      tip: 'Before memorizing a new ayah, read the translation and understand how it connects logically to the preceding ayah. Contextual flow is the ultimate memory hook.'
    }
  ];

  const todayIndex = new Date().getDate() % TIPS.length;
  const dailyTip = TIPS[todayIndex];

  $effect(() => {
    if (!$user) { goto('/login'); return; }
    if (!$isOnboarded) { goto('/onboarding'); return; }
    
    rateSuccess = false;
    showTafsir = false;
    tafsirText = '';
    
    data.streamed.todayPromise.then(async (result) => {
      todayData.set(result);
      newAyah = result.newAyah;
      reviewQueue = result.reviewQueue || [];
      totalLearned = result.totalLearned || 0;
      scheduling = result.scheduling || null;
      learnedToday = result.learnedToday || 0;
      dailyGoal = result.dailyGoal || 1;
      goalReached = result.goalReached || false;
      if (newAyah?._key) {
        await loadAyahContent(newAyah._key);
      }
    }).catch(err => console.error('Today load error:', err));
  });

  async function loadAyahContent(key) {
    try {
      ayahContent = await getAyah(key, $contentPrefs.translationId);
      todayAyahContent.set(ayahContent);
      const audioRes = await getAudio(key, $contentPrefs.reciterId);
      if (audioRes?.audio_files?.length) {
        const file = audioRes.audio_files[0];
        audioUrl = file.url.startsWith('http') ? file.url : `https://audio.qurancdn.com/${file.url}`;
      } else {
        audioUrl = '';
      }

      const state = await getAyahState(key);
      bookmarked = state.bookmarked;
      bookmarkId = state.bookmarkId;
      noteText = state.note || '';
    } catch (err) { console.error('Content fetch error:', err); }
  }

  function handleRate(value) {
    if (!newAyah?._key || isRating) return;
    isRating = true;
    
    // 1. Optimistic UI: Instant feedback!
    rateSuccess = true;
    if (value === 3) triggerConfetti();
    const ayahKey = newAyah._key;

    // 2. Fire rating, but we MUST wait for it to finish before fetching the next ayah
    const ratePromise = rateAyah(ayahKey, value);
    // 3. Guarantee the user sees the success animation for at least 800ms
    const animPromise = new Promise(resolve => setTimeout(resolve, 800));

    // 4. Run both in parallel. The animation hides the network latency!
    Promise.all([ratePromise, animPromise]).then(async () => {
      rateSuccess = false;
      try {
        const data = await getToday();
        todayData.set(data);
        learnedToday = data.learnedToday || 0;
        dailyGoal = data.dailyGoal || 1;
        goalReached = data.goalReached || false;
        totalLearned = data.totalLearned || 0;
        reviewQueue = data.reviewQueue || [];
        scheduling = data.scheduling || null;

        if (goalReached && !goalOverride) {
          newAyah = data.newAyah;
        } else {
          newAyah = data.newAyah;
          if (newAyah?._key) {
            ayahContent = null;
            todayAyahContent.set(null);
            audioUrl = '';
            await loadAyahContent(newAyah._key);
          }
        }
      } catch (err) { console.error(err); }
      isRating = false;
    }).catch(err => {
      console.error(err);
      isRating = false;
    });
  }

  async function handleNavigate(direction) {
    if (!newAyah?._key || navigating) return;
    navigating = true;
    try {
      const res = await navigateAyah(newAyah._key, direction);
      if (res.ayah) {
        newAyah = res.ayah;
        showTafsir = false;
        tafsirText = '';
        showReflectBox = false;
        await loadAyahContent(newAyah._key);
        // If user navigates past goal, they chose to override
        if (goalReached && direction === 'next') {
          goalOverride = true;
        }
      } else {
        showToast(direction === 'prev' ? 'Already at the first ayah' : 'You\'ve reached the end!');
      }
    } catch (err) { console.error('Navigate error:', err); }
    navigating = false;
  }

  function handleKeepGoing() {
    goalOverride = true;
    // Load the content for the next ayah that's already set
    if (newAyah?._key) {
      loadAyahContent(newAyah._key);
    }
  }

  function handlePlay() {
    if (!audioUrl) return;
    if ($audioState.playing) pauseAudio(); else playAudio(audioUrl);
  }

  async function handleTafsirToggle() {
    showTafsir = !showTafsir;
    if (showTafsir && !tafsirText && newAyah?._key) {
      tafsirLoading = true;
      try {
        const data = await getTafsir(newAyah._key, $contentPrefs.tafsirId);
        if (data?.tafsir?.text) {
          tafsirText = data.tafsir.text;
        } else if (data?.tafsirs?.length) {
          tafsirText = data.tafsirs[0].text || 'No tafsir available.';
        } else {
          tafsirText = 'No tafsir available for this ayah.';
        }
      } catch (err) {
        console.error('Tafsir fetch error:', err);
        tafsirText = 'Could not load tafsir.';
      }
      tafsirLoading = false;
    }
  }

  async function handleBookmark() {
    if (!newAyah?._key) return;
    bookmarking = true;
    try {
      if (bookmarked && bookmarkId) {
        await removeBookmark(bookmarkId);
        bookmarked = false;
        bookmarkId = null;
        showToast('Bookmark removed', 'success');
      } else {
        const res = await addBookmark(newAyah._key);
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
    if (!noteText.trim() || !newAyah?._key) return;
    submittingNote = true;
    try {
      await addNote(newAyah._key, noteText.trim());
      showReflectBox = false;
      showToast('Note saved to Quran.com! ✍️', 'success');
    } catch (err) {
      console.error('Note error:', err);
      showToast('Could not save note', 'error');
    }
    submittingNote = false;
  }
</script>

<svelte:head><title>Today's Ayah — HifzPath</title></svelte:head>

<div class="page container-narrow">
  {#if loading}
    <!-- Granular skeleton matching page layout -->
    <div class="page-header" style="display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div class="skeleton-text" style="width: 180px; margin-bottom: 8px;"></div>
        <div class="skeleton-text xl" style="width: 140px;"></div>
      </div>
      <div class="skeleton-block" style="width: 100px; height: 28px; border-radius: 999px;"></div>
    </div>
    <!-- Nav skeleton -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div class="skeleton-block" style="width: 70px; height: 32px;"></div>
      <div class="skeleton-text" style="width: 90px;"></div>
      <div class="skeleton-block" style="width: 70px; height: 32px;"></div>
    </div>
    <!-- Main card skeleton -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="skeleton-block" style="height: 100px; margin-bottom: 16px;"></div>
      <div style="border-top: 1px solid var(--bg-variant); padding-top: 16px;">
        <div class="skeleton-text" style="width: 100%; margin-bottom: 8px;"></div>
        <div class="skeleton-text" style="width: 80%;"></div>
      </div>
      <div style="display: flex; gap: 12px; margin-top: 16px; border-top: 2px solid var(--bg-variant); padding-top: 16px;">
        <div class="skeleton-circle" style="width: 40px; height: 40px;"></div>
        <div class="skeleton-circle" style="width: 40px; height: 40px;"></div>
        <div class="skeleton-block" style="flex: 1; height: 4px; align-self: center;"></div>
      </div>
    </div>
    <!-- Rating skeleton -->
    <div class="skeleton-text lg" style="width: 200px; margin: 0 auto 12px;"></div>
    <div class="rating-row">
      {#each [1, 2, 3, 4] as _}
        <div class="skeleton-block" style="height: 60px;"></div>
      {/each}
    </div>

  {:else if goalReached && !goalOverride && newAyah}
    <!-- ✅ Daily goal complete screen -->
    <div class="page-header" style="text-align: center;">
      <h2>Today's Goal Complete!</h2>
    </div>

    <div class="card" style="text-align: center; padding: 48px 32px;">
      <div style="margin-bottom: 24px; display: flex; justify-content: center;">
        <div style="background: var(--sage-light); color: var(--sage-dark); width: 80px; height: 80px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; border: 2px solid var(--sage);">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </div>
      </div>
      <h2 style="margin-bottom: 8px;">MashaAllah!</h2>
      <p class="text-muted" style="font-size: 16px; margin-bottom: 24px;">
        You've learned <strong>{learnedToday} ayah</strong> today — your daily goal of <strong>{dailyGoal}</strong> is complete.
      </p>
      <div style="display: flex; align-items: center; gap: 8px; justify-content: center; margin-bottom: 24px;">
        <div style="flex: 1; max-width: 200px; height: 8px; background: var(--bg-variant); border-radius: var(--radius-full); overflow: hidden;">
          <div style="height: 100%; background: var(--sage); width: 100%; border-radius: var(--radius-full);"></div>
        </div>
        <span style="font-size: 13px; font-weight: 600; color: var(--sage-dark);">{learnedToday}/{dailyGoal}</span>
      </div>
      <p class="text-muted" style="font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
        Take a moment to reflect on what you've memorized. Revisit the ayah, listen to the recitation, or write a note. 
        When you're ready, come back tomorrow — or keep going if you'd like.
      </p>

      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="/dashboard" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          <span>Dashboard</span>
        </a>
        <button class="btn btn-primary" onclick={handleKeepGoing}>Keep Going →</button>
      </div>
    </div>

    <!-- Prev / Next nav on goal screen -->
    <div style="display: flex; justify-content: center; gap: 12px; margin-top: 16px;">
      <button class="btn btn-sm btn-outline" onclick={() => handleNavigate('prev')} disabled={navigating}>← Previous Ayah</button>
      <button class="btn btn-sm btn-outline" onclick={() => handleNavigate('next')} disabled={navigating}>Next Ayah →</button>
    </div>

  {:else if newAyah}
    <!-- Success flash overlay -->
    {#if rateSuccess}
      <div class="success-flash">
        <span class="success-icon">✓</span>
        <span>Saved! {learnedToday}/{dailyGoal} today</span>
      </div>
    {/if}

    <div class="page-header" style="display: flex; align-items: center; justify-content: space-between;">
      <div>
        <span class="label">Today · {SURAH_NAMES[(newAyah._surah || 1) - 1]} · Ayah {newAyah._ayah}</span>
        <h2 style="margin-top: 4px;">Today's Ayah</h2>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="chip chip-memorised" style="font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span>{learnedToday}/{dailyGoal} today</span>
        </div>
      </div>
    </div>

    <!-- Prev / Next navigation -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <button class="btn btn-sm btn-outline" onclick={() => handleNavigate('prev')} disabled={navigating}>
        ← Prev
      </button>
      <span class="text-muted" style="font-size: 13px;">{totalLearned} learned total</span>
      <button class="btn btn-sm btn-outline" onclick={() => handleNavigate('next')} disabled={navigating}>
        Next →
      </button>
    </div>

    <!-- Scheduling Pace -->
    {#if scheduling}
      <div class="card" style="margin-bottom: 16px; padding: 16px 20px; border-top: 3px solid {scheduling.onTrack ? 'var(--sage)' : 'var(--rose)'};">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">{scheduling.onTrack ? '✅' : '⚡'}</span>
            <div>
              <strong style="font-size: 14px;">{scheduling.onTrack ? 'On track!' : 'Pick up the pace!'}</strong>
              <p class="text-muted" style="font-size: 12px; margin-top: 2px;">
                {scheduling.ayaatRemaining} ayah left · {scheduling.daysRemaining} days to deadline
              </p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: var(--font-display); font-size: 24px; font-weight: 700; color: {scheduling.onTrack ? 'var(--sage-dark)' : '#c44'};">{scheduling.requiredPace}</div>
            <span class="text-muted" style="font-size: 11px;">ayah/day needed</span>
          </div>
        </div>
      </div>
    {/if}

    {#if reviewQueue.length > 0}
      <div class="card card-sky" style="margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <strong style="display: inline-flex; align-items: center; gap: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            {reviewQueue.length} ayah to review
          </strong>
          <p class="text-muted" style="font-size: 13px; margin-top: 2px;">Review before learning new ones</p>
        </div>
        <a href="/review" class="btn btn-secondary btn-sm">Start Review →</a>
      </div>
    {/if}
    <div class="card" style="margin-bottom: 24px;">
      <!-- Arabic text (always shown) -->
      {#if ayahContent?.verse}
        <AyahRenderer ayah={ayahContent.verse} />
      {/if}

      <!-- Transliteration (controlled by settings) -->
      {#if $contentPrefs.showTransliteration && ayahContent?.verse?.words}
        <p class="text-muted" style="text-align: center; font-style: italic; margin-bottom: 12px; font-size: 14px;">{ayahContent.verse.words.map(w => w.transliteration?.text).filter(Boolean).join(' ')}</p>
      {/if}

      <!-- Translation (controlled by settings) -->
      {#if $contentPrefs.showTranslation && ayahContent?.verse?.translations?.length}
        <p style="text-align: center; color: var(--text-muted); font-size: 16px; line-height: 1.6; margin-bottom: 20px; border-top: 1px solid var(--bg-variant); padding-top: 16px;">{ayahContent.verse.translations[0].text?.replace(/<[^>]*>/g, '') || ''}</p>
      {/if}

      <!-- Expanded Tafsir Box (controlled by settings & toggled via toolbar) -->
      {#if $contentPrefs.showTafsir && showTafsir}
        <div class="tafsir-box" style="line-height: 1.6; margin-top: 16px; border-top: 1px dashed var(--border); padding-top: 16px; font-size: 15px;">
          {#if tafsirLoading}
            <div class="skeleton" style="height: 60px;"></div>
          {:else}
            <div class="tafsir-content">{@html tafsirText}</div>
          {/if}
        </div>
      {/if}

      {#if audioUrl}
        <div class="audio-controls" style="border-top: 2px solid var(--bg-variant); padding-top: 16px; margin-top: 12px;">
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
          {#each [0.75, 1, 1.25] as s}
            <button class="btn btn-sm" class:btn-primary={$audioState.speed === s} class:btn-outline={$audioState.speed !== s} style="padding: 4px 8px; font-size: 11px;" onclick={() => setSpeed(s)}>{s}x</button>
          {/each}
        </div>
      {/if}
      <!-- QF Sync Actions (Icons Only) -->
      <div style="display: flex; gap: 8px; margin-top: 16px; border-top: 1px solid var(--bg-variant); padding-top: 12px; justify-content: flex-end;">
        <!-- Tafsir Toggle -->
        {#if $contentPrefs.showTafsir}
          <button class="btn btn-icon btn-sm" class:btn-primary={showTafsir} class:btn-outline={!showTafsir} onclick={handleTafsirToggle} title={showTafsir ? 'Hide Tafsir' : 'Show Tafsir'} aria-label="Tafsir">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </button>
        {/if}
        <!-- Sync Bookmark -->
        <button class="btn btn-icon btn-sm" class:btn-primary={bookmarked} class:btn-outline={!bookmarked} onclick={handleBookmark} disabled={bookmarking} title={bookmarked ? 'Remove Bookmark (Syncs with Quran.com)' : 'Add Bookmark (Syncs with Quran.com)'} aria-label="Bookmark">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
        </button>
        <!-- Sync Note -->
        <button class="btn btn-icon btn-sm" class:btn-primary={noteText !== ''} class:btn-outline={noteText === ''} onclick={() => showReflectBox = !showReflectBox} title={noteText ? 'Edit Study Note (Syncs with Quran.com)' : 'Add Study Note (Syncs with Quran.com)'} aria-label="Add Note">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
      </div>
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
    </div>
    <div style="margin-bottom: 16px;">
      <h3 style="margin-bottom: 12px; text-align: center;">How well did you know this?</h3>
      <div class="rating-row">
        <button class="rating-btn again" onclick={() => handleRate(0)} disabled={isRating}><span class="btn-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></span><span>Again</span></button>
        <button class="rating-btn hard" onclick={() => handleRate(1)} disabled={isRating}><span class="btn-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/></svg></span><span>Hard</span></button>
        <button class="rating-btn good" onclick={() => handleRate(2)} disabled={isRating}><span class="btn-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg></span><span>Good</span></button>
        <button class="rating-btn easy" onclick={() => handleRate(3)} disabled={isRating}><span class="btn-icon-svg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span><span>Easy</span></button>
      </div>
    </div>

    <!-- Toggleable Daily Memorization Tips -->
    <div style="margin-top: 24px; margin-bottom: 24px;">
      <button 
        class="btn btn-outline" 
        style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px dashed rgba(212, 175, 55, 0.4); background: rgba(212, 175, 55, 0.02); border-radius: {showDailyTip ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)'}; transition: all 0.2s ease; cursor: pointer;"
        onclick={() => showDailyTip = !showDailyTip}
      >
        <span style="display: inline-flex; align-items: center; gap: 8px; color: var(--gold-dark); font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.51 0-2.85-1.04-3.08-2.54-.25-1.61.9-3.14 2.54-3.38l6.08-1.02"/><path d="m5 19 3-3"/><path d="m19 5-3 3"/><path d="M3 21h18"/></svg>
          Daily Memorization Tip
        </span>
        <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">
          {showDailyTip ? 'Collapse ▴' : 'Expand ▾'}
        </span>
      </button>

      {#if showDailyTip}
        <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 100%); border-left: 4px solid var(--gold); border-right: 1px solid rgba(212, 175, 55, 0.15); border-bottom: 1px solid rgba(212, 175, 55, 0.15); border-top: none; border-radius: 0 0 var(--radius) var(--radius); padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid rgba(212, 175, 55, 0.15); padding-bottom: 12px;">
            <span class="label" style="color: var(--gold-dark); font-size: 12px; font-weight: 600; text-transform: uppercase;">
              {dailyTip.type}
            </span>
            {#if dailyTip.source}
              <span class="chip chip-new" style="font-size: 10px; background: rgba(212, 175, 55, 0.15); color: var(--gold-dark); border: 1px solid rgba(212, 175, 55, 0.25);">
                {dailyTip.source}
              </span>
            {/if}
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            {#if dailyTip.arabic}
              <div style="font-family: 'Scheherazade New', 'Amiri', serif; font-size: 24px; direction: rtl; text-align: right; line-height: 1.8; color: var(--text-color); margin: 4px 0; font-weight: 500;">
                {dailyTip.arabic}
              </div>
            {/if}
            {#if dailyTip.translation}
              <div style="font-style: italic; font-size: 13px; line-height: 1.6; color: var(--text-muted); opacity: 0.9;">
                {dailyTip.translation}
              </div>
            {/if}
            <div style="font-size: 13.5px; line-height: 1.6; color: var(--text-color); font-weight: 450; display: flex; gap: 8px; align-items: flex-start;">
              <span style="font-size: 16px; line-height: 1;">💡</span>
              <span>{dailyTip.tip}</span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="card" style="text-align: center; padding: 60px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--gold-dark); margin: 0 auto 16px; display: block;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a6 6 0 0 1 6 6v3.5c0 1.63-1.03 3.01-2.47 3.52a6 6 0 0 1-7.06 0C7.03 14.51 6 13.13 6 11.5V8a6 6 0 0 1 6-6Z"/></svg>
      <h2 style="margin-bottom: 12px;">Quran Complete!</h2>
      <p class="text-muted">You've gone through all 6,236 ayah. MashaAllah!</p>
      <a href="/dashboard" class="btn btn-primary btn-lg" style="margin-top: 24px;">View Dashboard</a>
    </div>
  {/if}
</div>

<style>
  .success-flash {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--sage);
    color: var(--text-on-sage);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow);
    padding: 12px 24px;
    font-weight: 700;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: successSlide 0.3s ease;
  }
  .success-icon {
    font-size: 20px;
    animation: successBounce 0.4s ease;
  }
  .tafsir-box {
    background: var(--bg-container-low);
    border: 1px solid var(--bg-variant);
    border-radius: var(--radius);
    padding: 16px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-muted);
    margin-bottom: 12px;
    max-height: 200px;
    overflow-y: auto;
  }
  @keyframes successSlide {
    from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
  @keyframes successBounce {
    0% { transform: scale(0); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
</style>
