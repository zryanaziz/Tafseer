
import { QURAN_API_BASE, TRANSLATION_ID } from '../constants';
import { Surah, Verse, Tafseer } from '../types';
import { getQuranVersesFromDB, isQuranDBLoaded, getAvailableSurahIds, getQuranVerseCount, searchQuranDB } from './dbService';
import { STATIC_SURAHS } from '../src/data/surahList';

/**
 * Common helper to handle fetch responses and prevent "Unexpected token <" errors
 */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error ${response.status}: ${errorBody.substring(0, 100)}`);
  }
  return response.json();
};

export const fetchSurahs = async (): Promise<Surah[]> => {
  // If Quran DB is loaded offline, build list from SQLite!
  if (isQuranDBLoaded()) {
    const availableIds = getAvailableSurahIds();
    if (availableIds && availableIds.length > 0) {
      const filtered = STATIC_SURAHS.filter(s => availableIds.includes(s.id));
      if (filtered.length > 0) {
        return filtered.map(s => {
          const count = getQuranVerseCount(s.id) || s.verses_count;
          return {
            ...s,
            verses_count: count
          };
        });
      }
    }
  }

  const cacheKey = 'quran_surahs_cache';
  
  try {
    const response = await fetch(`${QURAN_API_BASE}/chapters?language=en`);
    const data = await handleResponse(response);
    localStorage.setItem(cacheKey, JSON.stringify(data.chapters));
    return data.chapters;
  } catch (err) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    // Ultimate offline fallback when API fails and no cache exists: Return full 114 Surahs!
    return STATIC_SURAHS;
  }
};


export const fetchSurahVerses = async (surahId: number, page: number = 1): Promise<Verse[]> => {
  const cacheKey = `quran_verses_cache_${surahId}_${page}`;
  
  // Try querying from the local SQLite quran.db first if loaded!
  if (isQuranDBLoaded()) {
    const localVerses = getQuranVersesFromDB(surahId);
    if (localVerses && localVerses.length > 0) {
      console.log(`Loaded ${localVerses.length} verses offline from quran.db`);
      return localVerses;
    }
  }

  try {
    const response = await fetch(
      `${QURAN_API_BASE}/verses/by_chapter/${surahId}?language=en&words=false&translations=${TRANSLATION_ID}&fields=text_uthmani&per_page=300&page=${page}`
    );
    const data = await handleResponse(response);
    localStorage.setItem(cacheKey, JSON.stringify(data.verses));
    return data.verses;
  } catch (err) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    throw err;
  }
};

export const fetchTafseer = async (verseKey: string, tafseerId: number): Promise<Tafseer> => {
  const response = await fetch(`${QURAN_API_BASE}/quran/tafsirs/${tafseerId}?verse_key=${verseKey}`);
  const data = await handleResponse(response);
  return data.tafsir;
};

export const searchVerses = async (query: string): Promise<Verse[]> => {
  if (isQuranDBLoaded()) {
    const results = searchQuranDB(query);
    if (results) {
      return results;
    }
  }

  try {
    const response = await fetch(`${QURAN_API_BASE}/search?query=${encodeURIComponent(query)}&language=en`);
    const data = await handleResponse(response);
    
    if (!data.search || !data.search.results) return [];
    
    return data.search.results.map((r: any) => ({
      id: r.verse_id,
      verse_key: r.verse_key,
      text_uthmani: r.text,
      translations: r.translations ? [{ text: r.translations[0].text, resource_name: 'Search' }] : []
    }));
  } catch (err) {
    console.error("Online search failed, fallback to offline DB search:", err);
    if (isQuranDBLoaded()) {
      const results = searchQuranDB(query);
      if (results) return results;
    }
    return [];
  }
};
