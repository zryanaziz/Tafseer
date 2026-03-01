
// This service handles the binary .db file and queries it using sql.js

let databaseInstance: any = null;

/**
 * Initialize SQLite from a File object
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
        databaseInstance = db;
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
 * Load a specific database file from the public folder
 */
export const loadTafseerDB = async (fileName: string): Promise<boolean> => {
  try {
    const response = await fetch(`/${fileName}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch /${fileName}`);
      return false;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const uints = new Uint8Array(arrayBuffer);

    // @ts-ignore
    if (!window.initSqlJs) {
      console.error("sql.js not initialized");
      return false;
    }

    // @ts-ignore
    const SQL = await window.initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });
    
    // Close existing database if any
    if (databaseInstance) {
      databaseInstance.close();
    }

    databaseInstance = new SQL.Database(uints);
    return true;
  } catch (err) {
    console.error(`Failed to load DB ${fileName}:`, err);
    return false;
  }
};

/**
 * Get available tafseer tables from the database
 */
export const getAvailableTafseers = (): string[] => {
  if (!databaseInstance) return [];
  try {
    const stmt = databaseInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const tables = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      tables.push(row.name);
    }
    stmt.free();
    return tables;
  } catch (err) {
    console.error("Error getting tables:", err);
    return [];
  }
};

/**
 * Queries the database using surah_id and verse_id from a specific table
 */
export const getTafseerFromDB = (surahId: number, verseId: number, tableName: string = 'tafseer'): string | null => {
  if (!databaseInstance) return null;
  try {
    const stmt = databaseInstance.prepare(`SELECT text FROM ${tableName} WHERE surah_id = :sid AND verse_id = :vid LIMIT 1`);
    const result = stmt.getAsObject({ ":sid": surahId, ":vid": verseId });
    stmt.free();
    return result.text || null;
  } catch (err) {
    console.error("Query Error:", err);
    return null;
  }
};

export const isDBLoaded = () => !!databaseInstance;
