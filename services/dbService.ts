// This service handles the binary .db file and queries it using sql.js

let databaseInstance: any = null;
let quranDatabaseInstance: any = null;
let quranTableName: string = 'quran';

/**
 * Initialize SQLite from a File object
 */
export const initSQLite = async (file: File): Promise<{success: boolean, isQuranDb?: boolean, error?: string}> => {
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
        
        // Verify database by running a simple query
        try {
          db.prepare("SELECT name FROM sqlite_master WHERE type='table'").free();
        } catch (e) {
          db.close();
          return resolve({success: false, error: "فایلەکە تێکچووە یان فایلی SQLite نییە."});
        }

        // Check if it has any table with the column 'quran_arabic'
        let isQuranDb = false;
        let detectedTable = 'quran';
        try {
          const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
          while (stmt.step()) {
            const tblName = stmt.getAsObject().name;
            try {
              const colStmt = db.prepare(`PRAGMA table_info(${tblName})`);
              while (colStmt.step()) {
                const col = colStmt.getAsObject();
                if (col.name === 'quran_arabic') {
                  isQuranDb = true;
                  detectedTable = tblName;
                  break;
                }
              }
              colStmt.free();
              if (isQuranDb) break;
            } catch (e) {
              // ignore table info error
            }
          }
          stmt.free();
        } catch (e) {
          // ignore
        }

        if (isQuranDb) {
          if (quranDatabaseInstance) {
            quranDatabaseInstance.close();
          }
          quranDatabaseInstance = db;
          quranTableName = detectedTable;
          console.log(`Manually loaded Quran DB offline. Table: ${quranTableName}`);
        } else {
          if (databaseInstance) {
            databaseInstance.close();
          }
          databaseInstance = db;
          console.log("Manually loaded Tafseer DB offline.");
        }

        resolve({success: true, isQuranDb});
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
 * Load a specific database file from the public folder (for Tafseer)
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
    
    const db = new SQL.Database(uints);
    
    // Verify database by running a simple query
    try {
      db.prepare("SELECT name FROM sqlite_master WHERE type='table'").free();
    } catch (e) {
      db.close();
      console.error(`Failed to verify DB ${fileName}: file is not a database`);
      return false;
    }

    // Close existing database if any
    if (databaseInstance) {
      databaseInstance.close();
    }

    databaseInstance = db;
    return true;
  } catch (err) {
    console.error(`Failed to load DB ${fileName}:`, err);
    return false;
  }
};

/**
 * Load the SQLite Quran DB file from public folder if present
 */
export const loadQuranDB = async (fileName: string): Promise<boolean> => {
  try {
    const response = await fetch(`/${fileName}`);
    
    if (!response.ok) {
      console.info(`No local /${fileName} found or could not fetch it. Using live Quran APIs.`);
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
    
    const db = new SQL.Database(uints);
    
    // Verify database
    try {
      db.prepare("SELECT name FROM sqlite_master WHERE type='table'").free();
    } catch (e) {
      db.close();
      console.error(`Failed to verify Quran DB ${fileName}: file is not a database`);
      return false;
    }

    // Auto-detect table containing 'quran_arabic' column
    let detectedTable = 'quran';
    try {
      const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      while (stmt.step()) {
        const tblName = stmt.getAsObject().name;
        try {
          const colStmt = db.prepare(`PRAGMA table_info(${tblName})`);
          let hasQuranArabic = false;
          while (colStmt.step()) {
            const col = colStmt.getAsObject();
            if (col.name === 'quran_arabic') {
              hasQuranArabic = true;
              break;
            }
          }
          colStmt.free();
          if (hasQuranArabic) {
            detectedTable = tblName;
            break;
          }
        } catch (e) {
          // ignore
        }
      }
      stmt.free();
    } catch (e) {
      console.error("Auto detect table info error:", e);
    }

    if (quranDatabaseInstance) {
      quranDatabaseInstance.close();
    }

    quranDatabaseInstance = db;
    quranTableName = detectedTable;
    console.log(`Quran DB Loaded successfully offline. Table: ${quranTableName}`);
    return true;
  } catch (err) {
    console.error(`Failed to load Quran DB ${fileName}:`, err);
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
  if (!databaseInstance) {
    console.warn("getTafseerFromDB called but databaseInstance is null");
    return null;
  }
  
  // Basic validation for tableName to prevent SQL injection if tableName comes from user input
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    console.error("Invalid table name:", tableName);
    return null;
  }

  try {
    const stmt = databaseInstance.prepare(`SELECT text FROM ${tableName} WHERE surah_id = :sid AND verse_id = :vid LIMIT 1`);
    const result = stmt.getAsObject({ ":sid": surahId, ":vid": verseId });
    stmt.free();
    
    if (result && result.text) {
      return result.text;
    }
    
    console.info(`No tafseer found for Surah ${surahId}, Verse ${verseId} in table ${tableName}`);
    return null;
  } catch (err) {
    console.error(`Query Error (Table: ${tableName}, S:${surahId}, V:${verseId}):`, err);
    return null;
  }
};

/**
 * Fetches all verses for a Surah offline from the loaded quran.db
 */
export const getQuranVersesFromDB = (surahId: number): any[] | null => {
  if (!quranDatabaseInstance) return null;
  try {
    const stmt = quranDatabaseInstance.prepare(
      `SELECT verse_id, quran_arabic FROM ${quranTableName} WHERE surah_id = :sid ORDER BY verse_id ASC`
    );
    const verses = [];
    while (stmt.step()) {
      const row = stmt.getAsObject({ ":sid": surahId });
      verses.push({
        id: row.verse_id,
        verse_key: `${surahId}:${row.verse_id}`,
        text_uthmani: row.quran_arabic,
        translations: [] // Offline quran database uses local exegesis (Tafseer) for translations or we can have placeholder
      });
    }
    stmt.free();
    return verses;
  } catch (err) {
    console.error("Query Quran DB Error:", err);
    return null;
  }
};

export const isDBLoaded = () => !!databaseInstance;
export const isQuranDBLoaded = () => !!quranDatabaseInstance;

/**
 * Gets the list of available surah_ids from the custom loaded-in quran.db
 */
export const getAvailableSurahIds = (): number[] | null => {
  if (!quranDatabaseInstance) return null;
  try {
    const stmt = quranDatabaseInstance.prepare(`SELECT DISTINCT surah_id FROM ${quranTableName} ORDER BY surah_id ASC`);
    const ids: number[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.surah_id !== undefined && row.surah_id !== null) {
        ids.push(Number(row.surah_id));
      }
    }
    stmt.free();
    return ids;
  } catch (err) {
    console.error("Error getting available surah IDs from Quran DB:", err);
    return null;
  }
};

/**
 * Gets count of verses of a specific surah in the custom loaded quran.db
 */
export const getQuranVerseCount = (surahId: number): number | null => {
  if (!quranDatabaseInstance) return null;
  try {
    const stmt = quranDatabaseInstance.prepare(`SELECT COUNT(*) as count FROM ${quranTableName} WHERE surah_id = :sid`);
    const result = stmt.getAsObject({ ":sid": surahId });
    stmt.free();
    return result.count ? Number(result.count) : null;
  } catch (err) {
    console.error("Error getting verse count for surah:", surahId, err);
    return null;
  }
};

/**
 * Search the offline Quran database for matching verses
 */
export const searchQuranDB = (query: string): any[] | null => {
  if (!quranDatabaseInstance) return null;
  try {
    const stmt = quranDatabaseInstance.prepare(
      `SELECT surah_id, verse_id, quran_arabic FROM ${quranTableName} WHERE quran_arabic LIKE :pattern LIMIT 100`
    );
    const results = [];
    while (stmt.step()) {
      const row = stmt.getAsObject({ ":pattern": `%${query}%` });
      results.push({
        id: row.verse_id,
        verse_key: `${row.surah_id}:${row.verse_id}`,
        text_uthmani: row.quran_arabic,
        translations: []
      });
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error("Search Quran DB Error:", err);
    return null;
  }
};


