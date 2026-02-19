
export interface Surah {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
  translated_name: {
    name: string;
  };
}

export interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{
    text: string;
  }>;
  audio?: {
    url: string;
  };
}

export interface LastRead {
  surahId: number;
  surahName: string;
  verseKey: string;
  timestamp: number;
}

/**
 * Interface representing a Tafseer entry from the Quran API
 */
export interface Tafseer {
  id?: number;
  text: string;
  resource_id?: number;
  resource_name?: string;
}

/**
 * Interface representing a local user interpretation or saved tafseer entry
 */
export interface LocalTafseer {
  verse_key: string;
  text: string;
  last_updated: number;
  isLocked: boolean;
}

/**
 * Navigation screen identifiers for the application
 */
export enum AppScreen {
  HOME = 'home',
  SURAH_DETAIL = 'surah_detail',
  SETTINGS = 'settings',
  SEARCH = 'search',
  BOOKMARKS = 'bookmarks',
  AI_CHAT = 'ai_chat'
}

export enum AppTheme {
  EMERALD = 'emerald',
  DARK = 'dark',
  SEPIA = 'sepia',
  LIGHT = 'light'
}
