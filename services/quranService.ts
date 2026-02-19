
import { QURAN_API_BASE, TRANSLATION_ID } from '../constants';
import { Surah, Verse, Tafseer } from '../types';

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
  const response = await fetch(`${QURAN_API_BASE}/chapters?language=en`);
  const data = await handleResponse(response);
  return data.chapters;
};

export const fetchSurahVerses = async (surahId: number, page: number = 1): Promise<Verse[]> => {
  // Added &audio=7 (Alafasy) to fetch recitation URLs
  const response = await fetch(
    `${QURAN_API_BASE}/verses/by_chapter/${surahId}?language=en&words=false&translations=${TRANSLATION_ID}&fields=text_uthmani&per_page=50&page=${page}&audio=7`
  );
  const data = await handleResponse(response);
  return data.verses;
};

export const fetchTafseer = async (verseKey: string, tafseerId: number): Promise<Tafseer> => {
  const response = await fetch(`${QURAN_API_BASE}/quran/tafsirs/${tafseerId}?verse_key=${verseKey}`);
  const data = await handleResponse(response);
  return data.tafsir;
};

export const searchVerses = async (query: string): Promise<Verse[]> => {
  const response = await fetch(`${QURAN_API_BASE}/search?query=${encodeURIComponent(query)}&language=en`);
  const data = await handleResponse(response);
  
  if (!data.search || !data.search.results) return [];
  
  return data.search.results.map((r: any) => ({
    id: r.verse_id,
    verse_key: r.verse_key,
    text_uthmani: r.text,
    translations: r.translations ? [{ text: r.translations[0].text, resource_name: 'Search' }] : []
  }));
};
