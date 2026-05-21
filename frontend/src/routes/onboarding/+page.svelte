<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getChapters, saveOnboarding, bulkMark, updateSettings } from '$lib/api.js';
  import { chapters, isOnboarded } from '$lib/stores.js';

  let step = $state(1);
  let startMode = $state('beginning');
  let selectedAyahs = $state(new Set());
  let expandedSurah = $state(null);
  let dailyGoal = $state(1);
  let chaptersList = $state([]);
  let loading = $state(true);
  let saving = $state(false);

  const SURAH_AYAH_COUNTS = [
    7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
    112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
    59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
    52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
    21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6
  ];

  onMount(async () => {
    try {
      const data = await getChapters();
      chaptersList = data.chapters || [];
      chapters.set(chaptersList);
    } catch (err) {
      console.error('Failed to load chapters:', err);
      chaptersList = SURAH_AYAH_COUNTS.map((count, i) => ({
        id: i + 1, name_simple: `Surah ${i + 1}`, verses_count: count,
      }));
    }
    loading = false;
  });

  function toggleSurah(surahNum) {
    expandedSurah = expandedSurah === surahNum ? null : surahNum;
  }

  function toggleAyah(key) {
    const next = new Set(selectedAyahs);
    if (next.has(key)) next.delete(key); else next.add(key);
    selectedAyahs = next;
  }

  function markWholeSurah(surahNum) {
    const count = SURAH_AYAH_COUNTS[surahNum - 1];
    const next = new Set(selectedAyahs);
    let allSelected = true;
    for (let a = 1; a <= count; a++) { if (!next.has(`${surahNum}:${a}`)) { allSelected = false; break; } }
    for (let a = 1; a <= count; a++) {
      const key = `${surahNum}:${a}`;
      if (allSelected) next.delete(key); else next.add(key);
    }
    selectedAyahs = next;
  }

  function isSurahComplete(surahNum) {
    const count = SURAH_AYAH_COUNTS[surahNum - 1];
    for (let a = 1; a <= count; a++) { if (!selectedAyahs.has(`${surahNum}:${a}`)) return false; }
    return true;
  }

  function nextStep() {
    if (step === 1 && startMode === 'beginning') step = 3;
    else step++;
  }

  async function finish() {
    saving = true;
    try {
      await saveOnboarding({ startMode, startSurah: 1, startAyah: 1 });
      if (selectedAyahs.size > 0) await bulkMark(Array.from(selectedAyahs));
      await updateSettings({ dailyGoal });
      isOnboarded.set(true);
      goto('/today');
    } catch (err) { console.error('Onboarding save error:', err); }
    saving = false;
  }
</script>

<svelte:head><title>Onboarding — HifzPath</title></svelte:head>

<div class="onboarding container-narrow">
  <div class="steps-indicator" style="display: flex; gap: 8px; justify-content: center; margin-bottom: 32px; padding-top: 40px;">
    {#each [1, 2, 3] as s}
      <div class="step-dot" class:active={step >= s}></div>
    {/each}
  </div>

  {#if step === 1}
    <div class="card" style="text-align: center; padding: 48px;">
      <h2 style="margin-bottom: 12px;">Where are you in your hifz?</h2>
      <p class="text-muted" style="margin-bottom: 32px;">Choose your starting point. You can always change this later.</p>
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px; margin: 0 auto;">
        <button class="btn btn-lg" class:btn-primary={startMode === 'beginning'} class:btn-outline={startMode !== 'beginning'} style="width: 100%; text-align: left; display: inline-flex; align-items: center; gap: 8px;" onclick={() => startMode = 'beginning'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 0 9.5a7 7 0 0 1-8 8.5Z"/><path d="M19 2 9.5 11.5"/></svg>
          <span>Start from the beginning</span>
        </button>
        <button class="btn btn-lg" class:btn-primary={startMode === 'custom'} class:btn-outline={startMode !== 'custom'} style="width: 100%; text-align: left; display: inline-flex; align-items: center; gap: 8px;" onclick={() => startMode = 'custom'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          <span>I've already memorized some</span>
        </button>
      </div>
      <button class="btn btn-primary btn-lg" style="margin-top: 32px;" onclick={nextStep}>Continue →</button>
    </div>

  {:else if step === 2}
    <div style="margin-bottom: 24px; text-align: center;">
      <h2>Mark what you've already memorized</h2>
      <p class="text-muted" style="margin-top: 8px;">Click any ayah box to mark it. Click a surah name to mark the whole surah.</p>
      <div class="chip chip-memorised" style="margin-top: 12px;">{selectedAyahs.size} ayaat marked</div>
    </div>
    {#if loading}
      <div class="surah-grid">
        {#each Array(12) as _}
          <div class="card-flat surah-card" style="padding: 12px 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="skeleton-block" style="width: 28px; height: 28px; border-radius: 6px;"></div>
              <div class="skeleton-text" style="width: 100px;"></div>
              <div class="skeleton-text" style="width: 50px; margin-left: auto;"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="surah-grid">
        {#each chaptersList as chapter, i}
          {@const surahNum = chapter.id || i + 1}
          {@const ayahCount = SURAH_AYAH_COUNTS[surahNum - 1]}
          {@const isComplete = isSurahComplete(surahNum)}
          <div class="card-flat surah-card" class:complete={isComplete}>
            <button class="surah-header" onclick={() => toggleSurah(surahNum)}>
              <span class="surah-num">{surahNum}</span>
              <span class="surah-name">{chapter.name_simple || `Surah ${surahNum}`}</span>
              <span class="surah-count text-muted">{ayahCount} ayaat</span>
              {#if isComplete}<span class="chip chip-memorised" style="font-size: 10px;">✓</span>{/if}
            </button>
            {#if expandedSurah === surahNum}
              <div class="ayah-grid" style="margin-top: 12px;">
                <button class="btn btn-sm" class:btn-primary={isComplete} class:btn-outline={!isComplete} onclick={() => markWholeSurah(surahNum)} style="margin-bottom: 8px; font-size: 11px;">{isComplete ? 'Unmark All' : 'Mark All'}</button>
                <div class="ayah-boxes">
                  {#each Array(ayahCount) as _, a}
                    {@const key = `${surahNum}:${a + 1}`}
                    <button class="ayah-box" class:memorised={selectedAyahs.has(key)} class:new={!selectedAyahs.has(key)} title="Ayah {a + 1}" onclick={() => toggleAyah(key)}></button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    <div class="sticky-bar">
      <span>{selectedAyahs.size} ayaat marked</span>
      <button class="btn btn-primary" onclick={nextStep}>Continue →</button>
    </div>

  {:else if step === 3}
    <div class="card" style="text-align: center; padding: 48px;">
      <h2 style="margin-bottom: 12px;">Set Your Daily Goal</h2>
      <p class="text-muted" style="margin-bottom: 32px;">How many new ayah do you want to learn each day?</p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; align-items: center; margin-bottom: 32px;">
        {#each [1, 2, 3] as g}
          <button class="btn btn-lg" class:btn-primary={dailyGoal === g} class:btn-outline={dailyGoal !== g} onclick={() => dailyGoal = g}>{g} ayah/day</button>
        {/each}
        <div style="display: flex; align-items: center; gap: 6px;">
          <input
            type="number"
            min="1"
            max="100"
            placeholder="Custom"
            value={![1, 2, 3].includes(dailyGoal) ? dailyGoal : ''}
            oninput={(e) => { const v = parseInt(e.target.value); if (v > 0) dailyGoal = v; }}
            class="btn btn-lg"
            class:btn-primary={![1, 2, 3].includes(dailyGoal)}
            class:btn-outline={[1, 2, 3].includes(dailyGoal)}
            style="width: 140px; text-align: center; -moz-appearance: textfield;"
          />
          {#if ![1, 2, 3].includes(dailyGoal)}
            <span style="font-size: 14px; font-weight: 600;">ayah/day</span>
          {:else}
            <span class="text-muted" style="font-size: 14px; font-weight: 600;">ayah/day</span>
          {/if}
        </div>
      </div>
      <p class="text-muted" style="font-size: 14px; margin-bottom: 32px;">At {dailyGoal} ayah/day, you'll complete the Quran in ~{Math.ceil(6236 / dailyGoal / 365)} years</p>
      <button class="btn btn-primary btn-lg" onclick={finish} disabled={saving}>{saving ? 'Saving...' : 'Start My Journey →'}</button>
    </div>
  {/if}
</div>

<style>
  .onboarding { padding-bottom: 100px; }
  .step-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--bg-variant); border: 2px solid var(--border); transition: background 0.2s; }
  .step-dot.active { background: var(--sage); }
  .surah-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-bottom: 80px; }
  .surah-card { padding: 12px 16px; }
  .surah-card.complete { border-color: var(--sage-dark); background: #f8fcf7; }
  .surah-header { display: flex; align-items: center; gap: 8px; width: 100%; background: none; border: none; cursor: pointer; font-family: var(--font-body); font-size: 14px; text-align: left; padding: 4px 0; color: var(--text); }
  .surah-num { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: var(--bg-variant); border-radius: var(--radius-sm); font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .surah-name { font-weight: 600; flex: 1; }
  .surah-count { font-size: 11px; }
  .ayah-boxes { display: flex; flex-wrap: wrap; gap: 3px; }
  .sticky-bar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg-card); border-top: 2px solid var(--border); padding: 16px var(--page-margin); display: flex; align-items: center; justify-content: space-between; z-index: 50; font-weight: 600; }
</style>
