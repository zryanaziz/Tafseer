
import { TAFSEER_STORAGE_KEY } from '../constants';
import { LocalTafseer } from '../types';

export const getLocalTafseer = (verseKey: string): LocalTafseer | null => {
  const db = localStorage.getItem(TAFSEER_STORAGE_KEY);
  if (!db) return null;
  const tafseers: Record<string, LocalTafseer> = JSON.parse(db);
  return tafseers[verseKey] || null;
};

export const saveLocalTafseer = (verseKey: string, text: string): LocalTafseer => {
  const dbStr = localStorage.getItem(TAFSEER_STORAGE_KEY);
  const tafseers: Record<string, LocalTafseer> = dbStr ? JSON.parse(dbStr) : {};
  
  const entry: LocalTafseer = {
    verse_key: verseKey,
    text,
    last_updated: Date.now()
  };
  
  tafseers[verseKey] = entry;
  localStorage.setItem(TAFSEER_STORAGE_KEY, JSON.stringify(tafseers));
  return entry;
};

export const getInterpretationStats = () => {
  const dbStr = localStorage.getItem(TAFSEER_STORAGE_KEY);
  if (!dbStr) return 0;
  const tafseers = JSON.parse(dbStr);
  return Object.keys(tafseers).length;
};
