
import { TAFSEER_STORAGE_KEY } from '../constants';
import { LocalTafseer } from '../types';

export const getLocalTafseer = (verseKey: string): LocalTafseer | null => {
  const db = localStorage.getItem(TAFSEER_STORAGE_KEY);
  if (!db) return null;
  const tafseers: Record<string, LocalTafseer> = JSON.parse(db);
  return tafseers[verseKey] || null;
};

export const saveLocalTafseer = (verseKey: string, text: string, isLocked: boolean = false): LocalTafseer => {
  const dbStr = localStorage.getItem(TAFSEER_STORAGE_KEY);
  const tafseers: Record<string, LocalTafseer> = dbStr ? JSON.parse(dbStr) : {};
  
  const entry: LocalTafseer = {
    verse_key: verseKey,
    text,
    last_updated: Date.now(),
    isLocked
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

/**
 * EXPORT: Downloads the database as a JSON file
 */
export const exportTafseerToFile = () => {
  const data = localStorage.getItem(TAFSEER_STORAGE_KEY) || "{}";
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `tafseer_backup_${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * IMPORT: Reads a JSON file and restores it to localStorage
 * This handles the "one file for all surahs" requirement.
 */
export const importTafseerFromFile = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Validation: Ensure it's a map of objects
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error("Invalid format. Must be an object mapping verse keys to data.");
        }

        const currentDbStr = localStorage.getItem(TAFSEER_STORAGE_KEY);
        const currentDb = currentDbStr ? JSON.parse(currentDbStr) : {};
        
        // Merge. Imported data takes precedence.
        const merged = { ...currentDb, ...parsed };
        localStorage.setItem(TAFSEER_STORAGE_KEY, JSON.stringify(merged));
        resolve(true);
      } catch (err) {
        console.error("Import failed:", err);
        reject(false);
      }
    };
    reader.onerror = () => reject(false);
    reader.readAsText(file);
  });
};

/**
 * Generates a sample JSON to show user how to format their "one file db"
 */
export const downloadImportTemplate = () => {
  const template = {
    "1:1": { "verse_key": "1:1", "text": "تەفسیری سوورەتی فاتیحە ئایەتی یەکەم...", "last_updated": Date.now(), "isLocked": true },
    "1:2": { "verse_key": "1:2", "text": "تەفسیری سوورەتی فاتیحە ئایەتی دووەم...", "last_updated": Date.now(), "isLocked": true },
    "2:255": { "verse_key": "2:255", "text": "تەفسیری ئایەتی کورسی...", "last_updated": Date.now(), "isLocked": true }
  };
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tafseer_template.json`;
  link.click();
  URL.revokeObjectURL(url);
};
