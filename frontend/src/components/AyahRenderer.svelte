<script>
  import { contentPrefs } from '$lib/stores.js';
  let { ayah = {} } = $props();
  
  let playingWordId = $state(null);

  async function playWord(word) {
    if (!$contentPrefs.wordAudio || !word.audio_url) return;
    
    playingWordId = word.id;
    const audio = new Audio(`https://audio.qurancdn.com/${word.audio_url}`);
    
    audio.onended = () => {
      if (playingWordId === word.id) playingWordId = null;
    };
    audio.onerror = () => {
      if (playingWordId === word.id) playingWordId = null;
    };
    
    try {
      await audio.play();
    } catch (e) {
      console.error("Audio play failed:", e);
      playingWordId = null;
    }
  }
</script>

<div class="ayah-renderer" class:tajweed-enabled={$contentPrefs.showTajweed} dir="rtl">
  {#if $contentPrefs.wordByWord && ayah.words?.length > 0}
    <div class="word-by-word-container">
      {#each ayah.words as word}
        {#if word.char_type_name === 'word'}
          <div 
            class="word-group" 
            class:playing={playingWordId === word.id}
            onclick={() => playWord(word)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') playWord(word); }}
            role="button"
            tabindex="0"
          >
            <span class="arabic-word">
              {#if $contentPrefs.showTajweed && word.text_uthmani_tajweed}
                {@html word.text_uthmani_tajweed}
              {:else}
                {word.text_uthmani}
              {/if}
            </span>
            <div class="word-tooltip">
              {word.translation?.text || ''}
            </div>
          </div>
        {:else if word.char_type_name === 'end'}
          <div class="word-group end-marker">
            <span class="arabic-word">{word.text_uthmani || word.text}</span>
          </div>
        {/if}
      {/each}
    </div>
  {:else}
    <div class="arabic arabic-lg full-verse">
      {#if $contentPrefs.showTajweed && ayah.text_uthmani_tajweed}
        {@html ayah.text_uthmani_tajweed}
      {:else}
        {ayah.text_uthmani}
      {/if}
    </div>
  {/if}
</div>

<style>
  .word-by-word-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 8px;
    align-items: flex-start;
    justify-content: flex-start;
    line-height: 2.5;
  }
  
  .word-group {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
    transition: background 0.2s;
  }
  
  .word-group:hover, .word-group.playing {
    background: var(--bg-variant);
  }
  
  .word-group.playing .arabic-word {
    color: var(--sage);
  }
  
  .arabic-word {
    font-family: var(--font-arabic);
    font-size: 40px;
    line-height: 1.8;
    color: var(--text);
  }

  .end-marker .arabic-word {
    color: var(--gold);
    font-size: 28px;
  }
  
  .word-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background: var(--text);
    color: var(--bg);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-family: var(--font-body);
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    z-index: 10;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .word-group:hover .word-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-4px);
  }
  
  .word-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: var(--text) transparent transparent transparent;
  }

  .full-verse {
    line-height: 2.2;
  }
</style>
