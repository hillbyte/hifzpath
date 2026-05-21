import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { fetchChapters, fetchAyah, fetchAudio, fetchTafsir, fetchReciters, fetchTranslations, fetchTafsirs } from '../lib/qf-content.js';

const content = new Hono();

// Fetch all 114 surahs. This is public so no auth is needed.
content.get('/chapters', async (c) => {
  try {
    const data = await fetchChapters();
    return c.json(data);
  } catch (err) {
    console.error('Chapters fetch error:', err.message);
    return c.json({ error: 'Failed to fetch chapters' }, 500);
  }
});

// Grab the complete ayah data including translation and transliteration
content.get('/ayah/:key', async (c) => {
  const key = c.req.param('key');
  const translationId = parseInt(c.req.query('translation_id') || '85');
  try {
    const data = await fetchAyah(key, { translationId });
    return c.json(data);
  } catch (err) {
    console.error('Ayah fetch error:', err.message);
    return c.json({ error: 'Failed to fetch ayah' }, 500);
  }
});

// Get the specific audio URL for an ayah
content.get('/audio/:key', async (c) => {
  const key = c.req.param('key');
  const reciterId = parseInt(c.req.query('reciter') || '9');
  try {
    const data = await fetchAudio(key, reciterId);
    return c.json(data);
  } catch (err) {
    console.error('Audio fetch error:', err.message);
    return c.json({ error: 'Failed to fetch audio' }, 500);
  }
});

// Fetch the tafsir explanation for a given ayah
content.get('/tafsir/:key', async (c) => {
  const key = c.req.param('key');
  const tafsirId = parseInt(c.req.query('tafsir_id') || '169');
  try {
    const data = await fetchTafsir(key, tafsirId);
    return c.json(data);
  } catch (err) {
    console.error('Tafsir fetch error:', err.message);
    return c.json({ error: 'Failed to fetch tafsir' }, 500);
  }
});

// Get the list of all supported reciters
content.get('/resources/reciters', async (c) => {
  try {
    const data = await fetchReciters();
    return c.json(data);
  } catch (err) {
    console.error('Reciters fetch error:', err.message);
    return c.json({ error: 'Failed to fetch reciters' }, 500);
  }
});

// Get the list of all available translations
content.get('/resources/translations', async (c) => {
  try {
    const data = await fetchTranslations();
    return c.json(data);
  } catch (err) {
    console.error('Translations fetch error:', err.message);
    return c.json({ error: 'Failed to fetch translations' }, 500);
  }
});

// Get the list of all available tafsirs
content.get('/resources/tafsirs', async (c) => {
  try {
    const data = await fetchTafsirs();
    return c.json(data);
  } catch (err) {
    console.error('Tafsirs fetch error:', err.message);
    return c.json({ error: 'Failed to fetch tafsirs' }, 500);
  }
});

export default content;
