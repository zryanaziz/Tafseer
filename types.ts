
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
  text_indopak?: string;
  translations?: Array<{
    text: string;
    resource_name: string;
  }>;
}

export interface Tafseer {
  resource_id: number;
  text: string;
  id?: number;
  resource_name?: string;
}

export interface LocalTafseer {
  verse_key: string;
  text: string;
  last_updated: number;
  author?: string;
}

export interface Bookmark {
  surahId: number;
  verseNumber: number;
  surahName: string;
}

export enum AppScreen {
  HOME = 'home',
  SURAH_DETAIL = 'surah_detail',
  TAFSEER_VIEW = 'tafseer_view',
  BOOKMARKS = 'bookmarks',
  SEARCH = 'search',
  AI_CHAT = 'ai_chat'
}

export enum AppTheme {
  EMERALD = 'emerald',
  DARK = 'dark',
  LIGHT = 'light',
  SEPIA = 'sepia'
}

export enum DisplayFocus {
  BOTH = 'both',
  QURAN_ONLY = 'quran_only',
  TAFSEER_ONLY = 'tafseer_only'
}
