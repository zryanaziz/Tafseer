
import { Reciter } from './types';

export const QURAN_API_BASE = 'https://api.quran.com/api/v4';
export const TRANSLATION_ID = 131; // Clear Quran (English)
export const TAFSEER_STORAGE_KEY = 'my_custom_tafseer_db';
export const AUDIO_BASE_URL = 'https://everyayah.com/data/';
export const OFFLINE_AUDIO_BASE_URL = '/audio/';

export const RECITERS: Reciter[] = [
  { id: 'minshawy_mujawwad', name: 'مەنشاوی (موجەووەد)', path: 'Minshawy_Mujawwad_192kbps/' },
  { id: 'minshawy_murattal', name: 'مەنشاوی (مورەتتەل)', path: 'Minshawy_Murattal_128kbps/' },
  { id: 'alafasy', name: 'عەفاسی', path: 'Alafasy_128kbps/' },
  { id: 'abdul_basit_mujawwad', name: 'عەبدولباست (موجەووەد)', path: 'Abdul_Basit_Mujawwad_128kbps/' },
  { id: 'abdul_basit_murattal', name: 'عەبدولباست (مورەتتەل)', path: 'Abdul_Basit_Murattal_192kbps/' },
  { id: 'husary', name: 'حوسەری', path: 'Husary_128kbps/' },
  { id: 'husary_mujawwad', name: 'حوسەری (موجەووەد)', path: 'Husary_Mujawwad_128kbps/' },
  { id: 'ghamadi', name: 'غامیدی', path: 'Ghamadi_40kbps/' },
];
