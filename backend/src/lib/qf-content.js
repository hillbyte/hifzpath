const QF_API_BASE = process.env.QF_API_BASE || 'https://api.quran.com/api/v4';

// Grab a single ayah by its key (like "2:255") along with its translation and transliteration
export async function fetchAyah(ayahKey, options = {}) {
  const { translationId = 85, language = 'en' } = options;

  const params = new URLSearchParams({
    translations: String(translationId),
    language,
    fields: 'text_uthmani,text_imlaei,text_uthmani_tajweed',
    translation_fields: 'text',
    word_fields: 'text_uthmani,text_uthmani_tajweed,transliteration,translation,audio_url',
    word_translation_language: language,
    words: 'true',
  });

  const res = await fetch(
    `${QF_API_BASE}/verses/by_key/${ayahKey}?${params}`
  );

  if (!res.ok) {
    throw new Error(`QF API error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// Fetch the audio URL for a specific ayah. Defaults to Mishary Rashid Alafasy if no reciter is provided.
export async function fetchAudio(ayahKey, reciterId = 9) {
  const [chapter, verse] = ayahKey.split(':');
  const res = await fetch(
    `${QF_API_BASE}/recitations/${reciterId}/by_ayah/${ayahKey}`
  );
  if (!res.ok) {
    throw new Error(`QF Audio API error ${res.status}`);
  }
  return res.json();
}

// Fetch the tafsir explanation for a specific ayah. Defaults to Ibn Kathir in English.
export async function fetchTafsir(ayahKey, tafsirId = 169) {
  const res = await fetch(
    `${QF_API_BASE}/tafsirs/${tafsirId}/by_ayah/${ayahKey}`
  );
  if (!res.ok) {
    throw new Error(`QF Tafsir API error ${res.status}`);
  }
  return res.json();
}

// Fetch a list of all 114 surahs with their names and ayah counts
export async function fetchChapters(language = 'en') {
  const res = await fetch(
    `${QF_API_BASE}/chapters?language=${language}`
  );
  if (!res.ok) {
    throw new Error(`QF Chapters API error ${res.status}`);
  }
  return res.json();
}

// Fetch the list of verses for a specific chapter without the full Arabic text
export async function fetchChapterVerses(chapterNumber, page = 1, perPage = 300) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    fields: 'text_uthmani',
  });

  const res = await fetch(
    `${QF_API_BASE}/verses/by_chapter/${chapterNumber}?${params}`
  );
  if (!res.ok) {
    throw new Error(`QF Chapter Verses API error ${res.status}`);
  }
  return res.json();
}

// Fetch the list of all available reciters from the API
export async function fetchReciters(language = 'en') {
  const res = await fetch(`${QF_API_BASE}/resources/recitations?language=${language}`);
  if (!res.ok) throw new Error(`QF Reciters API error ${res.status}`);
  return res.json();
}

// Fetch the list of all available translations from the API
export async function fetchTranslations(language = 'en') {
  const res = await fetch(`${QF_API_BASE}/resources/translations?language=${language}`);
  if (!res.ok) throw new Error(`QF Translations API error ${res.status}`);
  return res.json();
}

// Fetch the list of all available tafsirs from the API
export async function fetchTafsirs(language = 'en') {
  const res = await fetch(`${QF_API_BASE}/resources/tafsirs?language=${language}`);
  if (!res.ok) throw new Error(`QF Tafsirs API error ${res.status}`);
  return res.json();
}
