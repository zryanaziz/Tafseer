
// This service handles the binary .db file and queries it using sql.js
// It also persists the database to IndexedDB so it survives page refreshes.

let databaseInstance: any = null;
const DB_STORE_NAME = 'tafseer_db_store';
const DB_KEY = 'current_sqlite_db';

/**
 * Initialize SQLite from a File object and save to IndexedDB
 */
export const initSQLite = async (file: File): Promise<{success: boolean, error?: string}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const uints = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // @ts-ignore
        if (!window.initSqlJs) {
          return resolve({success: false, error: "بەرنامەی SQLite بارنەکراوە. تکایە لاپەڕەکە نوێ بکەرەوە."});
        }

        // @ts-ignore
        const SQL = await window.initSqlJs({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
        });
        
        const db = new SQL.Database(uints);
        
        // Validate Schema
        try {
          const checkTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tafseer'");
          if (!checkTable.step()) {
            return resolve({success: false, error: "خشتەی 'tafseer' لەناو فایلەکەدا نییە."});
          }
          checkTable.free();

          const checkColumns = db.prepare("PRAGMA table_info(tafseer)");
          const cols = [];
          while(checkColumns.step()) cols.push(checkColumns.getAsObject().name);
          checkColumns.free();

          if (!cols.includes('surah_id') || !cols.includes('verse_id') || !cols.includes('text')) {
             return resolve({success: false, error: "فایلەکە ستوونەکانی (surah_id, verse_id, text) تێدا نییە."});
          }
        } catch (schemaErr) {
          return resolve({success: false, error: "هەڵەیەک لە خوێندنەوەی پێکهاتەی فایلەکەدا هەیە."});
        }

        databaseInstance = db;
        await saveToIndexedDB(uints);
        resolve({success: true});
      } catch (err) {
        console.error("SQLite Init Error:", err);
        resolve({success: false, error: "فایلەکە تێکچووە یان فایلی SQLite نییە."});
      }
    };
    reader.onerror = () => resolve({success: false, error: "ناتوانرێت فایلەکە بخوێندرێتەوە."});
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Load a default database file from the server (e.g., /tafseer.db)
 */
export const loadDefaultDB = async (): Promise<boolean> => {
  try {
    const response = await fetch('/tafseer.db');
    if (!response.ok) return false;
    
    const arrayBuffer = await response.arrayBuffer();
    const uints = new Uint8Array(arrayBuffer);

    // @ts-ignore
    const SQL = await window.initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });
    
    databaseInstance = new SQL.Database(uints);
    // Also save it to IndexedDB so it's faster next time
    await saveToIndexedDB(uints);
    return true;
  } catch (err) {
    console.error("Failed to load default DB:", err);
    return false;
  }
};

/**
 * Load the database from IndexedDB on app start
 */
export const loadPersistedDB = async (): Promise<boolean> => {
  try {
    const uints = await getFromIndexedDB();
    if (!uints) return false;

    // @ts-ignore
    const SQL = await window.initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });
    
    databaseInstance = new SQL.Database(uints);
    return true;
  } catch (err) {
    console.error("Failed to load persisted DB:", err);
    return false;
  }
};

/**
 * Queries the database using surah_id and verse_id
 */
export const getTafseerFromDB = (surahId: number, verseId: number): string | null => {
  if (!databaseInstance) return null;
  try {
    const stmt = databaseInstance.prepare("SELECT text FROM tafseer WHERE surah_id = :sid AND verse_id = :vid LIMIT 1");
    const result = stmt.getAsObject({ ":sid": surahId, ":vid": verseId });
    stmt.free();
    return result.text || null;
  } catch (err) {
    console.error("Query Error:", err);
    return null;
  }
};

export const isDBLoaded = () => !!databaseInstance;

function saveToIndexedDB(data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_STORE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('data');
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('data', 'readwrite');
      tx.objectStore('data').put(data, DB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}

function getFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_STORE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('data');
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('data', 'readonly');
      const getReq = tx.objectStore('data').get(DB_KEY);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
}
