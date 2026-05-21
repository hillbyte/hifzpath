<script>
  let { data } = $props();
  import { goto } from '$app/navigation';
  import { user, activeModal, yearHeatmap, lifetimeHeatmap, todayData, dashboardStreak, dashboardBookmarks } from '$lib/stores.js';

  let yearData = $state($yearHeatmap);
  let lifetimeData = $state($lifetimeHeatmap);
  // Stale-while-revalidate: only show skeleton when there's no data at all
  let loading = $derived(yearData === null && lifetimeData === null);
  let todayInfo = $state($todayData);
  let selectedYear = $state(new Date().getFullYear());
  let hoveredDay = $state(null);
  let streakData = $state($dashboardStreak);
  let bookmarksData = $state($dashboardBookmarks);

  let activityMap = $derived(yearData?.activity || {});
  let totalMemorised = $derived(lifetimeData?.totalMemorised || 0);
  let totalLearning = $derived(lifetimeData?.totalLearning || 0);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  $effect(() => {
    if (!$user) { goto('/login'); return; }
    
    // Await the pre-fetched promises and update stores
    data.streamed.yearPromise.then(year => {
      yearData = year;
      yearHeatmap.set(year);
    }).catch(console.error);

    data.streamed.lifetimePromise.then(lifetime => {
      lifetimeData = lifetime;
      lifetimeHeatmap.set(lifetime);
    }).catch(console.error);

    data.streamed.todayPromise.then(today => {
      todayInfo = today;
      todayData.set(today);
    }).catch(console.error);

    data.streamed.streakPromise.then(d => {
      if (!d?._error) { streakData = d; dashboardStreak.set(d); }
    }).catch(console.error);

    data.streamed.bookmarksPromise.then(d => {
      if (d?.data) { bookmarksData = d.data; dashboardBookmarks.set(d.data); }
    }).catch(console.error);
  });

  function getHeatLevel(activity) {
    if (!activity) return 0;
    const total = (activity.memorised || 0) + (activity.reviewed || 0) + (activity.listened || 0);
    if (total === 0) return 0;
    if (total <= 2) return 1;
    if (total <= 5) return 2;
    if (total <= 10) return 3;
    return 4;
  }

  function getWeeks(year) {
    const days = [];
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split('T')[0]);
    }
    const weeks = [];
    let currentWeek = [];
    const firstDay = new Date(days[0]).getDay();
    for (let i = 0; i < firstDay; i++) currentWeek.push(null);
    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }

  function openAyahModal(ayahKey) {
    activeModal.set({ key: ayahKey });
  }

  function changeYear(delta) {
    selectedYear += delta;
    loadAll();
  }

  const SURAH_NAMES = ['Al-Fatiha','Al-Baqarah','Aal-Imran','An-Nisa','Al-Ma\'idah','Al-An\'am','Al-A\'raf','Al-Anfal','At-Tawbah','Yunus','Hud','Yusuf','Ar-Ra\'d','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Mu\'minun','An-Nur','Al-Furqan','Ash-Shu\'ara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqi\'ah','Al-Hadid','Al-Mujadilah','Al-Hashr','Al-Mumtahanah','As-Saff','Al-Jumu\'ah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma\'arij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Nazi\'at','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A\'la','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qari\'ah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Ma\'un','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'];

  function getSurahName(num) {
    return SURAH_NAMES[(num || 1) - 1] || `Surah ${num}`;
  }
</script>

<svelte:head><title>Dashboard — HifzPath</title></svelte:head>

<div class="page container">
  <div class="page-header"><h1>My Hifz Journey</h1></div>

  {#if loading}
    <div class="bento-grid">
      <!-- Stat card skeletons -->
      {#each [1, 2, 3] as _}
        <div class="card bento-4" style="padding: 20px;">
          <div class="skeleton-text" style="width: 60px; margin-bottom: 12px;"></div>
          <div class="skeleton-text xl" style="width: 50px; margin-bottom: 8px;"></div>
          <div class="skeleton-text" style="width: 120px;"></div>
        </div>
      {/each}
      <!-- Heatmap skeleton -->
      <div class="card bento-12" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div class="skeleton-text lg" style="width: 120px;"></div>
          <div style="display: flex; gap: 8px;">
            <div class="skeleton-block" style="width: 32px; height: 32px;"></div>
            <div class="skeleton-block" style="width: 32px; height: 32px;"></div>
          </div>
        </div>
        <div class="skeleton-block" style="height: 120px;"></div>
      </div>
      <!-- Lifetime grid skeleton -->
      <div class="card bento-8" style="padding: 20px;">
        <div class="skeleton-text lg" style="width: 180px; margin-bottom: 12px;"></div>
        <div class="skeleton-block" style="height: 200px;"></div>
      </div>
      <!-- Queue skeleton -->
      <div class="card bento-4" style="padding: 20px;">
        <div class="skeleton-text lg" style="width: 100px; margin-bottom: 16px;"></div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between;"><div class="skeleton-text" style="width: 70px;"></div><div class="skeleton-text" style="width: 20px;"></div></div>
          <div style="display: flex; justify-content: space-between;"><div class="skeleton-text" style="width: 60px;"></div><div class="skeleton-text" style="width: 20px;"></div></div>
        </div>
        <div class="skeleton-block" style="height: 40px; margin-top: 16px;"></div>
      </div>
      <!-- Juz progress skeleton -->
      <div class="card bento-12" style="padding: 20px;">
        <div class="skeleton-text lg" style="width: 100px; margin-bottom: 12px;"></div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          {#each Array(15) as _}
            <div class="skeleton-circle" style="width: 40px; height: 40px;"></div>
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <div class="bento-grid">
      <div class="card bento-4 card-gold">
        <span class="label" style="display: inline-flex; align-items: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          Streak
        </span>
        <div class="stat-value" style="color: var(--gold-dark); margin-top: 8px;">{streakData?.currentStreak ?? Object.keys(activityMap).length}</div>
        <span class="stat-label">
          {#if streakData}
            days on <a href="https://quran.com" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; cursor: pointer;">quran.com</a>
          {:else}
            active days this year
          {/if}
        </span>
      </div>
      <div class="card bento-4 card-sage">
        <span class="label" style="display: inline-flex; align-items: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Total Memorized
        </span>
        <div class="stat-value" style="color: var(--sage-dark); margin-top: 8px;">{totalMemorised}</div>
        <span class="stat-label">of 6,236 ayaat ({(totalMemorised / 6236 * 100).toFixed(1)}%)</span>
      </div>
      <div class="card bento-4 card-sky">
        <span class="label" style="display: inline-flex; align-items: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          In Review
        </span>
        <div class="stat-value" style="color: var(--sky-dark); margin-top: 8px;">{totalLearning}</div>
        <span class="stat-label">{todayInfo?.reviewCount || 0} due today</span>
      </div>

      <!-- Scheduling Pace Card -->
      {#if todayInfo?.scheduling}
        {@const s = todayInfo.scheduling}
        <div class="card bento-12" style="border-top: 3px solid {s.onTrack ? 'var(--sage)' : 'var(--rose)'};">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div>
              <span class="label" style="display: inline-flex; align-items: center; gap: 6px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Khatm Target
              </span>
              <div style="margin-top: 8px; display: flex; align-items: baseline; gap: 12px;">
                <span style="font-family: var(--font-display); font-size: 28px; font-weight: 700; color: {s.onTrack ? 'var(--sage-dark)' : '#c44'};">{s.daysRemaining}</span>
                <span class="stat-label">days remaining</span>
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-family: var(--font-display); font-size: 28px; font-weight: 700;">{s.requiredPace}</div>
              <span class="stat-label">ayah/day needed</span>
            </div>
            <div style="text-align: right;">
              <div class="chip {s.onTrack ? 'chip-memorised' : 'chip-danger'}" style="font-size: 13px;">
                {s.onTrack ? '✅ On Track' : '⚡ Behind Pace'}
              </div>
              <p class="text-muted" style="font-size: 12px; margin-top: 6px;">
                Current: {s.currentPace}/day · Need: {s.requiredPace}/day
              </p>
            </div>
          </div>
          <!-- Progress bar -->
          <div style="margin-top: 16px; background: var(--bg-variant); border-radius: var(--radius-full); height: 8px; overflow: hidden;">
            <div style="height: 100%; background: var(--sage); border-radius: var(--radius-full); width: {((6236 - s.ayaatRemaining) / 6236 * 100).toFixed(1)}%; transition: width 0.3s ease;"></div>
          </div>
          <p class="text-muted" style="font-size: 11px; margin-top: 6px; text-align: center;">{6236 - s.ayaatRemaining} / 6,236 memorized · {s.ayaatRemaining} remaining</p>
        </div>
      {/if}

      <!-- Year Heatmap -->
      <div class="card bento-12">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span class="label">{selectedYear} Activity</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-outline" onclick={() => changeYear(-1)}>←</button>
            <button class="btn btn-sm btn-outline" onclick={() => changeYear(1)}>→</button>
          </div>
        </div>
        <div class="heatmap-wrapper">
          <div class="heatmap-inner">
            <div class="heatmap-months">
              {#each MONTHS as month}<span>{month}</span>{/each}
            </div>
            <div class="heatmap-grid">
              {#each getWeeks(selectedYear) as week}
                <div class="heatmap-week">
                  {#each week as day}
                    {#if day}
                      <div
                        class="heatmap-cell heat-{getHeatLevel(activityMap[day])}"
                        onmouseenter={() => hoveredDay = day}
                        onmouseleave={() => hoveredDay = null}
                        role="presentation"
                      >
                        {#if hoveredDay === day && activityMap[day]}
                          <div class="tooltip" style="bottom: 20px; left: 50%; transform: translateX(-50%);">
                            {day}: {activityMap[day].memorised} memorized, {activityMap[day].reviewed} reviewed
                          </div>
                        {/if}
                      </div>
                    {:else}
                      <div class="heatmap-cell empty"></div>
                    {/if}
                  {/each}
                </div>
              {/each}
            </div>
          </div>
          <div class="heatmap-legend">
            <span class="text-muted" style="font-size: 11px;">Less</span>
            {#each [0,1,2,3,4] as level}<div class="heatmap-cell heat-{level}" style="width: 12px; height: 12px;"></div>{/each}
            <span class="text-muted" style="font-size: 11px;">More</span>
          </div>
        </div>
      </div>
      <!-- Lifetime Grid -->
      <div class="card bento-8">
        <span class="label" style="margin-bottom: 12px; display: block;">All 6,236 Ayaat — Lifetime</span>
        {#if lifetimeData?.surahs}
          <div class="lifetime-grid">
            {#each lifetimeData.surahs as surah}
              <div class="lifetime-surah">
                <span class="surah-label" title="Surah {surah.surah}">{surah.surah}</span>
                <div class="surah-ayahs">
                  {#each surah.ayahs as ayah}
                    <button class="ayah-box {ayah.status}" title="{ayah.key}" onclick={() => openAyahModal(ayah.key)}></button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Today Queue & Bookmarks Card -->
      <div class="card bento-4" style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <span class="label" style="margin-bottom: 12px; display: block;">Today's Queue</span>
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>To review</span><strong>{todayInfo?.reviewCount || 0}</strong></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;"><span>New ayah</span><strong>{todayInfo?.quranComplete ? 'Done!' : '1'}</strong></div>
          </div>
          <a href="/review" class="btn btn-primary" style="width: 100%;">Start Session →</a>
        </div>

        {#if bookmarksData.length > 0}
          <div style="border-top: 1px solid var(--bg-variant); padding-top: 16px;">
            <span class="label" style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-size: 11px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              Recent Bookmarks <a href="https://quran.com" target="_blank" rel="noopener noreferrer" class="chip chip-new" style="font-size: 9px; padding: 2px 6px; text-decoration: none; cursor: pointer;">quran.com</a>
            </span>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 120px; overflow-y: auto;">
              {#each bookmarksData.slice(0, 10) as bm}
                <button class="btn btn-xs btn-outline" style="font-size: 11px; padding: 4px 8px; border-radius: var(--radius-sm);" title="Surah {getSurahName(bm.chapterId || bm.chapter_id || bm.key)}, Ayah {bm.verseNumber || bm.verse_number}" onclick={() => openAyahModal(`${bm.chapterId || bm.chapter_id || bm.key}:${bm.verseNumber || bm.verse_number}`)}>
                  {bm.chapterId || bm.chapter_id || bm.key}:{bm.verseNumber || bm.verse_number}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Juz Progress -->
      <div class="card bento-12">
        <span class="label" style="margin-bottom: 12px; display: block;">Juz Progress</span>
        <div class="juz-grid">
          {#each Array(30) as _, j}
            {@const juzNum = j + 1}
            {@const pct = totalMemorised > 0 ? Math.min(100, (totalMemorised / 6236 * 100)) : 0}
            <div class="juz-item">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="17" fill="none" stroke="var(--bg-variant)" stroke-width="3"/>
                <circle cx="20" cy="20" r="17" fill="none" stroke="var(--sage)" stroke-width="3"
                  stroke-dasharray="106.8" stroke-dashoffset="{106.8 - (106.8 * pct / 100)}"
                  transform="rotate(-90 20 20)" stroke-linecap="round"/>
              </svg>
              <span style="font-size: 11px; font-weight: 600;">{juzNum}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .heatmap-wrapper { overflow-x: auto; padding-bottom: 8px; }
  .heatmap-inner { display: inline-flex; flex-direction: column; }
  .heatmap-months { display: flex; gap: 0; margin-bottom: 4px; font-size: 11px; color: var(--text-muted); }
  .heatmap-months span { flex: 1; min-width: 0; }
  .heatmap-grid { display: flex; gap: 2px; }
  .heatmap-week { display: flex; flex-direction: column; gap: 2px; }
  .heatmap-cell { width: 14px; height: 14px; border-radius: 3px; position: relative; }
  .heatmap-cell.empty { background: transparent; }
  .heatmap-legend { display: flex; align-items: center; gap: 4px; margin-top: 8px; justify-content: flex-end; }
  .lifetime-grid { max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
  .lifetime-surah { display: flex; align-items: flex-start; gap: 8px; }
  .surah-label { width: 28px; font-size: 10px; font-weight: 700; color: var(--text-muted); text-align: right; flex-shrink: 0; padding-top: 1px; }
  .surah-ayahs { display: flex; flex-wrap: wrap; gap: 2px; }
  .juz-grid { display: flex; flex-wrap: wrap; gap: 12px; }
  .juz-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
</style>
