<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores.js';

  onMount(() => {
    if ($user) goto('/today');
  });
</script>

<svelte:head>
  <title>HifzPath — Memorize the Quran</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Naskh+Arabic:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="landing">
  <nav class="navbar">
    <a href="/" class="navbar-brand" style="display: flex; align-items: center; gap: 6px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      <span>HifzPath</span>
      <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--gold-dark); background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.2); padding: 2px 6px; border-radius: var(--radius-full); margin-left: 6px; display: inline-flex; align-items: center; line-height: 1;">Early Beta</span>
    </a>
    <ul class="navbar-links">
      <li><a href="/login" class="btn btn-sm btn-primary">Start Memorizing →</a></li>
    </ul>
  </nav>

  <section class="hero container-narrow">
    <div style="margin-bottom: 24px; text-align: center; display: flex; flex-direction: column; gap: 6px; align-items: center;">
      <div class="arabic" style="font-size: 38px; color: var(--sage-dark); font-weight: 700; line-height: 1.3; margin-bottom: 4px;">ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِي خَلَقَ</div>
      <div style="font-size: 13px; font-style: italic; color: var(--text-muted); font-family: var(--font-display); font-weight: 600;">
        "Recite in the name of your Lord who created" — Surah Al-`Alaq [96:1]
      </div>
      <div class="label" style="margin-top: 12px; display: inline-block;">Quran Memorization · One Ayah at a Time</div>
    </div>
    <h1>Preserve the Quran.<br/>Read and Ascend.</h1>
    <p class="hero-sub">One new ayah every day. Spaced repetition keeps you from forgetting. Your streak becomes your story.</p>
    <div class="hero-actions">
      <a href="/login" class="btn btn-primary btn-lg">Start Memorizing →</a>
      <a href="#vision" class="btn btn-outline btn-lg">Our Vision for the Ummah</a>
    </div>
    <p class="hero-social text-muted">Join people memorizing the Quran daily</p>
  </section>

  <!-- Features section -->
  <section id="features" class="features container">
    <div class="section-title">
      <h2>How HifzPath Works</h2>
      <p class="text-muted">A modern, scientifically-backed approach to sacred memory</p>
    </div>
    <div class="bento-grid">
      <div class="card bento-4 card-sage">
        <div style="margin-bottom: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--sage-dark);"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </div>
        <h3>Bite-Sized Daily Goals</h3>
        <p class="text-muted" style="margin-top: 8px;">No overwhelm. Set a custom daily goal—even just one ayah a day. Listen, read, repeat, and mark it memorized when you're ready.</p>
      </div>
      <div class="card bento-4 card-sky">
        <div style="margin-bottom: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--sky-dark);"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/></svg>
        </div>
        <h3>Spaced Repetition</h3>
        <p class="text-muted" style="margin-top: 8px;">Powered by the SM-2 spaced repetition algorithm — a scientifically proven method that schedules reviews exactly when your brain is about to forget, ensuring permanent memorization, InshAllah.</p>
      </div>
      <div class="card bento-4 card-gold">
        <div style="margin-bottom: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--gold-dark);"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <h3>Track Everything</h3>
        <p class="text-muted" style="margin-top: 8px;">Visual activity heatmap, lifetime ayah grid, streaks, and projections. See your entire journey at a glance.</p>
      </div>
    </div>
  </section>

  <!-- High impact: Vision for the Ummah & Intention Section -->
  <section id="vision" class="vision-section container-narrow" style="padding: 60px 0 40px;">
    <div class="section-title">
      <h2>The Vision for the Ummah</h2>
      <p class="text-muted">Reviving the Quranic habit through the power of sincere intention</p>
    </div>

    <div class="card bento-12 card-emerald-trans" style="margin-bottom: 32px; padding: 40px; border-left: 5px solid var(--emerald); border-radius: var(--radius-md);">
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">✨</span>
          <h3 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--emerald-dark);">The Eternal Promise of Intention (Niyyah)</h3>
        </div>
        <p style="font-size: 15px; line-height: 1.7; color: var(--text); margin: 0;">
          The Prophet (ﷺ) taught us that <strong>"Actions are judged by intentions."</strong> When you sincerely make the intention to memorize the entire Quran and commit yourself to a daily habit, you set yourself on a path of continuous, lifelong worship.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: var(--text); margin: 0;">
          Islamic scholars convey a beautiful, hopeful promise: <strong>If a believer makes a sincere intention to memorize the Quran, and commits to daily effort but passes away before completing it, they will, by the mercy of Allah, be resurrected on the Day of Judgement among the Huffaz (memorizers of the Quran).</strong> Hifz is not about the speed of your completion; it is about the consistency of your devotion.
        </p>
      </div>
    </div>

    <!-- Why the Ummah Struggles Grid -->
    <div style="display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 40px;">
      <div class="card card-rose-trans" style="padding: 32px; border-left: 5px solid var(--rose); border-radius: var(--radius-md);">
        <h3 style="margin-bottom: 12px; color: var(--rose-dark); display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Why has the Ummah stopped memorizing?
        </h3>
        <p class="text-muted" style="line-height: 1.6; font-size: 14.5px;">
          Many Muslims today have stopped attempting to memorize the Quran because they believe it requires hours of free time every day or rare, specialized photographic memory. They delay starting, waiting for a "perfect time" that never comes.
        </p>
        <p class="text-muted" style="line-height: 1.6; font-size: 14.5px; margin-top: 12px;">
          The solution is simple: <strong>Commit to at least one single ayah daily.</strong> By keeping the daily requirement small, you build an unbreakable, lifelong habit. It is far better to learn one ayah a day consistently for years than to try learning pages at once, get overwhelmed, and give up entirely.
        </p>
      </div>
    </div>
  </section>

  <!-- Sacred Quran & Hadith Section -->
  <section class="scriptures-section" style="background: var(--bg-card); padding: 80px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);">
    <div class="container">
      <div class="section-title">
        <h2>Sacred Inspiration</h2>
        <p class="text-muted">The unmatched virtues of hosting the Words of Allah in your heart</p>
      </div>
      
      <div class="scriptures-grid">
        <!-- Card 1: Hadith on Consistency -->
        <div class="card scripture-card">
          <div class="scripture-badge">Hadith on Consistency</div>
          <p class="scripture-text">
            "The most beloved of deeds to Allah are those which are continuous, even if they are small."
          </p>
          <div class="scripture-source">— Sahih al-Bukhari & Sahih Muslim</div>
        </div>

        <!-- Card 2: Quran on Ease -->
        <div class="card scripture-card" style="border-color: rgba(212, 175, 55, 0.2); background: rgba(212, 175, 55, 0.01);">
          <div class="scripture-badge" style="color: var(--gold-dark); background: rgba(212, 175, 55, 0.1);">Quranic Promise</div>
          <div class="arabic" style="font-size: 24px; margin-top: 8px; margin-bottom: 16px; text-align: center; color: var(--gold-dark); line-height: 1.6;">
            وَلَقَدْ يَسَّرْنَا ٱلْقُرْءَانَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ
          </div>
          <p class="scripture-text" style="font-size: 14px; text-align: center;">
            "And We have certainly made the Quran easy for remembrance, so is there any who will remember?"
          </p>
          <div class="scripture-source">— Surah Al-Qamar, 54:17</div>
        </div>

        <!-- Card 3: Hadith on Rising Status -->
        <div class="card scripture-card">
          <div class="scripture-badge">Hadith on Honor</div>
          <p class="scripture-text">
            "It will be said to the companion of the Quran: 'Read and ascend, and recite as you used to recite in the world, for your status will be at the last verse you recite.'"
          </p>
          <div class="scripture-source">— Jami` at-Tirmidhi</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Final Call to Action -->
  <section class="container-narrow" style="text-align: center; padding: 80px 0 40px;">
    <h2>Make Your Intention Today</h2>
    <p class="text-muted" style="margin-top: 12px; margin-bottom: 32px; font-size: 16px;">
      Join thousands of Muslims committing to a lifelong journey with the Quran. One day. One ayah. For Life.
    </p>
    <a href="/login" class="btn btn-primary btn-lg">Start Memorizing Now →</a>
  </section>

  <!-- Beautiful simple footer -->
  <footer class="footer">
    <div class="container-narrow">
      <div style="font-family: var(--font-display); font-weight: 700; font-size: 18px; margin-bottom: 8px; color: var(--text);">HifzPath</div>
      <p class="text-muted" style="font-size: 13.5px; max-width: 440px; margin: 0 auto 24px; line-height: 1.6;">
        A sincere effort designed to help the global Ummah build an easy, consistent, and everlasting connection with the Holy Quran.
      </p>
      <div class="footer-divider" style="height: 1px; background: var(--border); margin-bottom: 24px; max-width: 200px; margin-left: auto; margin-right: auto;"></div>
      <div style="font-size: 12px; color: var(--text-muted);">
        © {new Date().getFullYear()} HifzPath · A project for the Muslim Ummah · Standardizing Hifz across the Ummah
      </div>
    </div>
  </footer>
</div>

<style>
  :root {
    --emerald: #10b981;
    --emerald-dark: #047857;
    --rose: #f43f5e;
    --rose-dark: #be123c;
  }

  .landing { min-height: 100vh; }
  
  .hero { text-align: center; padding: 80px 0 60px; }
  .hero h1 { margin-bottom: 20px; }
  .hero-sub { font-size: 18px; color: var(--text-muted); max-width: 500px; margin: 0 auto 32px; line-height: 1.6; }
  .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
  .hero-social { font-size: 14px; }
  
  .features { padding: 40px 0 60px; }
  .section-title { text-align: center; margin-bottom: 40px; }
  .section-title h2 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
  
  .arabic {
    font-family: 'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', serif;
    direction: rtl;
  }

  /* Visual theme cards */
  .card-emerald-trans { background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.15); }
  .card-rose-trans { background: rgba(244, 63, 94, 0.03); border: 1px solid rgba(244, 63, 94, 0.12); }
  
  /* Scriptures Section & Grid */
  .scriptures-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
  .scripture-card { padding: 32px; display: flex; flex-direction: column; justify-content: space-between; min-height: 220px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); border-radius: var(--radius-md); background: var(--bg-card); }
  .scripture-badge { align-self: flex-start; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); background: var(--bg-variant); padding: 4px 10px; border-radius: var(--radius-full); margin-bottom: 16px; }
  .scripture-text { font-size: 14.5px; font-style: italic; line-height: 1.6; color: var(--text); margin: 0; }
  .scripture-source { font-size: 12.5px; font-weight: 600; color: var(--text-muted); text-align: right; margin-top: auto; padding-top: 16px; }
  
  .footer { padding: 60px 0; background: var(--bg-card); border-top: 1px solid var(--border); text-align: center; }
</style>
