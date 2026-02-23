
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import SurahCard from './components/SurahCard';
import TafseerOverlay from './components/TafseerOverlay';
import { fetchSurahs, fetchSurahVerses } from './services/quranService';
import { initSQLite, loadPersistedDB, loadDefaultDB, getTafseerFromDB } from './services/dbService';
import { Surah, Verse, AppScreen, AppTheme, LastRead, AccentColor } from './types';
import { Database, Loader2, FileBox, CheckCircle2, Layout as LayoutIcon, AlignRight, BookOpen, ChevronDown, Hash, ArrowRight, ArrowLeft, Type, Clock, Plus, Minus, Palette } from 'lucide-react';

type ViewMode = 'quran' | 'tafseer' | 'both';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.HOME);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [isDefaultDb, setIsDefaultDb] = useState(false);
  
  const [theme, setTheme] = useState<AppTheme>(() => (localStorage.getItem('app_theme') as AppTheme) || AppTheme.EMERALD);
  const [accentColor, setAccentColor] = useState<AccentColor>(() => (localStorage.getItem('app_accent_color') as AccentColor) || AccentColor.EMERALD);
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('app_view_mode') as ViewMode) || 'both');
  const [fontSize, setFontSize] = useState<number>(() => Number(localStorage.getItem('app_font_size')) || 1);
  const [showInSurahFontSettings, setShowInSurahFontSettings] = useState(false);
  const [lastRead, setLastRead] = useState<LastRead | null>(() => {
    const saved = localStorage.getItem('app_last_read');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [jumpToAyah, setJumpToAyah] = useState<string>("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      let persisted = await loadPersistedDB();
      
      // If no persisted DB, try to load the default permanent one
      if (!persisted) {
        persisted = await loadDefaultDB();
        if (persisted) setIsDefaultDb(true);
      }
      
      setDbReady(persisted);
      
      const data = await fetchSurahs();
      setSurahs(data);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => { localStorage.setItem('app_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('app_accent_color', accentColor); }, [accentColor]);
  useEffect(() => { localStorage.setItem('app_view_mode', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('app_font_size', fontSize.toString()); }, [fontSize]);
  useEffect(() => { 
    if (lastRead) localStorage.setItem('app_last_read', JSON.stringify(lastRead)); 
  }, [lastRead]);

  // Update CSS variables based on theme and accent color
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', accentColor);
    
    let bg1 = 'rgba(0, 108, 76, 0.08)';
    let bg2 = 'rgba(16, 185, 129, 0.05)';
    let gradient = 'linear-gradient(135deg, #f0f4f2 0%, #e6efeb 100%)';
    let bodyBg = '#f0f4f2';
    let onSurface = '#191c1a';

    switch(theme) {
      case AppTheme.DARK:
        bg1 = 'rgba(0, 255, 150, 0.05)';
        bg2 = 'rgba(0, 100, 255, 0.03)';
        gradient = 'linear-gradient(135deg, #0a0c0b 0%, #141a17 100%)';
        bodyBg = '#0a0c0b';
        onSurface = '#e1e3df';
        break;
      case AppTheme.SEPIA:
        bg1 = 'rgba(114, 92, 0, 0.08)';
        bg2 = 'rgba(186, 26, 26, 0.03)';
        gradient = 'linear-gradient(135deg, #fdf3e7 0%, #f5e8d9 100%)';
        bodyBg = '#fdf3e7';
        onSurface = '#504538';
        break;
      case AppTheme.OCEAN:
        bg1 = 'rgba(0, 97, 164, 0.1)';
        bg2 = 'rgba(0, 108, 76, 0.05)';
        gradient = 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)';
        bodyBg = '#e1f5fe';
        onSurface = '#001d33';
        break;
      case AppTheme.NIGHT:
        bg1 = 'rgba(103, 80, 164, 0.1)';
        bg2 = 'rgba(0, 0, 0, 0.2)';
        gradient = 'linear-gradient(135deg, #1c1b1f 0%, #121212 100%)';
        bodyBg = '#1c1b1f';
        onSurface = '#e6e1e5';
        break;
      case AppTheme.ROSE:
        bg1 = 'rgba(186, 26, 26, 0.08)';
        bg2 = 'rgba(103, 80, 164, 0.05)';
        gradient = 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)';
        bodyBg = '#fff1f2';
        onSurface = '#270001';
        break;
    }

    root.style.setProperty('--liquid-color-1', bg1);
    root.style.setProperty('--liquid-color-2', bg2);
    root.style.setProperty('--bg-gradient', gradient);
    root.style.setProperty('--md-sys-color-on-surface', onSurface);
    document.body.style.backgroundColor = bodyBg;
  }, [theme, accentColor]);

  // Simple Automatic Tracking
  useEffect(() => {
    if (screen !== AppScreen.SURAH_DETAIL || verses.length === 0 || !selectedSurah) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the entry that is most visible
        const visibleEntry = entries.find(entry => entry.isIntersecting);
        if (visibleEntry) {
          const verseKey = visibleEntry.target.getAttribute('data-verse-key');
          if (verseKey && lastRead?.verseKey !== verseKey) {
            saveLastRead(selectedSurah, verseKey);
          }
        }
      },
      { threshold: 0.2, rootMargin: '-10% 0px -80% 0px' } // Focus on the top part of the screen
    );

    const timer = setTimeout(() => {
      Object.values(verseRefs.current).forEach(el => {
        if (el) observerRef.current?.observe(el);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [screen, verses, selectedSurah]);

  const saveLastRead = (surah: Surah, verseKey: string) => {
    setLastRead({
      surahId: surah.id,
      surahName: surah.name_arabic,
      verseKey: verseKey,
      timestamp: Date.now()
    });
  };

  const loadVerses = async (surahId: number) => {
    setLoading(true);
    try {
      const data = await fetchSurahVerses(surahId);
      setVerses(data);
    } catch (err) {
      console.error("Failed to load verses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSurahClick = async (surah: Surah) => {
    setSelectedSurah(surah);
    setScreen(AppScreen.SURAH_DETAIL);
    setJumpToAyah("");
    setIsHeaderVisible(true);
    await loadVerses(surah.id);
    saveLastRead(surah, `${surah.id}:1`);
    
    // Scroll to top of the main content area
    setTimeout(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    }, 100);
  };

  const goHome = () => {
    setScreen(AppScreen.HOME);
    setTimeout(() => {
      const element = document.getElementById('surah-list-start');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
      }
    }, 100);
  };

  const scrollToAyah = (ayahNum: string) => {
    setJumpToAyah(ayahNum);
    const key = `${selectedSurah?.id}:${ayahNum}`;
    const element = verseRefs.current[key];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (selectedSurah) saveLastRead(selectedSurah, key);
    }
  };

  const navigateVerse = (offset: number) => {
    if (!selectedVerse) return;
    const idx = verses.findIndex(v => v.id === selectedVerse.id);
    const nextIdx = idx + offset;
    if (nextIdx >= 0 && nextIdx < verses.length) {
      const nextV = verses[nextIdx];
      setSelectedVerse(nextV);
      if (selectedSurah) saveLastRead(selectedSurah, nextV.verse_key);
    }
  };

  const handleSurahNavigate = async (offset: number) => {
    if (!selectedSurah) return;
    const currentIdx = surahs.findIndex(s => s.id === selectedSurah.id);
    const nextIdx = currentIdx + offset;
    if (nextIdx >= 0 && nextIdx < surahs.length) {
      const nextSurah = surahs[nextIdx];
      await handleSurahClick(nextSurah);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const result = await initSQLite(file);
    if (result.success) {
      setDbReady(true);
    } else {
      alert(result.error || "هەڵەیەک ڕوویدا لە کاتی بارکردنی فایلەکە.");
    }
    setLoading(false);
  };

  const renderHome = () => (
    <div className="page-enter py-4 px-4 space-y-6">
      {/* Last Read Section - Small size front page */}
      {lastRead && (
        <div 
          onClick={() => {
            const s = surahs.find(sur => sur.id === lastRead.surahId);
            if (s) {
              handleSurahClick(s).then(() => {
                const ayah = lastRead.verseKey.split(':')[1];
                setTimeout(() => scrollToAyah(ayah), 500);
              });
            }
          }}
          className={`p-3 rounded-[20px] shadow-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer border backdrop-blur-md ${
            theme === AppTheme.DARK ? 'bg-[#212622]/40 border-gray-800/50' : 'bg-emerald-50/60 border-emerald-100/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-black/5" style={{ color: accentColor }}>
              <Clock size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest">کۆتا خوێندنەوە</p>
              <h4 className="font-bold text-xs" style={{ color: accentColor }}>{lastRead.surahName} - {lastRead.verseKey.split(':')[1]}</h4>
            </div>
          </div>
          <ArrowLeft size={14} className="opacity-20" />
        </div>
      )}

      {/* View Mode & Font Size Settings */}
      <div className={`p-6 rounded-[32px] shadow-lg transition-all space-y-6 backdrop-blur-md ${
        theme === AppTheme.DARK ? 'bg-[#212622]/40 border border-gray-800/50' : 'bg-white/40 border border-gray-100/50'
      }`}>
        <div>
          <h4 className="text-sm font-bold mb-4 flex items-center gap-2 opacity-60">
            <LayoutIcon size={16} /> شێوازی پیشاندان
          </h4>
          <div className={`flex p-1 rounded-2xl ${theme === AppTheme.DARK ? 'bg-black/40' : 'bg-gray-100'}`}>
            {[
              { id: 'quran', label: 'قورئان', icon: <AlignRight size={14} /> },
              { id: 'both', label: 'هەردووکی', icon: <LayoutIcon size={14} /> },
              { id: 'tafseer', label: 'تەفسیر', icon: <BookOpen size={14} /> }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as ViewMode)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold transition-all ${
                  viewMode === mode.id 
                    ? 'text-white shadow-lg' 
                    : 'opacity-50 grayscale'
                }`}
                style={{ backgroundColor: viewMode === mode.id ? accentColor : undefined }}
              >
                {mode.icon}
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold flex items-center gap-2 opacity-60">
              <Type size={16} /> قەبارەی دەق
            </h4>
            <span className="text-lg font-bold px-3 py-1 rounded-xl text-white shadow-md" style={{ backgroundColor: accentColor }}>{Math.round(fontSize * 100)}%</span>
          </div>
          <div className="px-2 flex items-center gap-4">
            <button onClick={() => setFontSize(prev => Math.max(0.5, prev - 0.1))} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold active:scale-90 transition-all ${theme === AppTheme.DARK ? 'bg-white/10' : 'bg-gray-100'}`}>-</button>
            <input 
              type="range" 
              min="0.5" 
              max="3.6" 
              step="0.1" 
              value={fontSize} 
              onChange={(e) => setFontSize(parseFloat(e.target.value))}
              className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: accentColor }}
            />
            <button onClick={() => setFontSize(prev => Math.min(3.6, prev + 0.1))} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold active:scale-90 transition-all ${theme === AppTheme.DARK ? 'bg-white/10' : 'bg-gray-100'}`}>+</button>
          </div>
        </div>
      </div>

      {/* Database Status Card */}
      {!isDefaultDb && (
        <div className={`rounded-[32px] p-8 relative overflow-hidden flex flex-col items-center transition-all shadow-xl ${
          dbReady 
            ? (theme === AppTheme.DARK || theme === AppTheme.NIGHT ? 'bg-white/10 border border-white/20' : 'bg-white/80 border border-white/50') 
            : 'bg-orange-50 text-orange-950 border-2 border-dashed border-orange-200'
        }`} style={{ color: dbReady ? accentColor : undefined }}>
          <div className="absolute right-0 bottom-0 opacity-10 translate-y-1/4 translate-x-1/4">
            <Database size={220} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-center">{dbReady ? <CheckCircle2 size={32} className="inline mb-1 mr-2" /> : <FileBox size={32} className="inline mb-1 mr-2 opacity-40" />} SQLite</h3>
          <p className="text-sm opacity-70 mb-6 text-center max-w-[280px]">
            {dbReady ? "فایلەکە بە سەرکەوتوویی بارکراوە." : "فایلی تەفسیر باربکە."}
          </p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 text-white`}
            style={{ backgroundColor: accentColor }}
          >
            {dbReady ? "گۆڕینی فایل" : "بارکردنی فایل"}
            <input type="file" ref={fileInputRef} className="hidden" accept=".db" onChange={handleFileUpload} />
          </button>
        </div>
      )}

      {isDefaultDb && (
        <div className={`rounded-[32px] p-4 flex items-center justify-center gap-3 border border-emerald-500/20 bg-emerald-500/5`} style={{ color: accentColor }}>
          <Database size={16} className="opacity-50" />
          <span className="text-[10px] font-bold uppercase tracking-widest">داتابەیسی جێگیر چالاکە</span>
        </div>
      )}

      <div id="surah-list-start" className="flex flex-col gap-6 px-2 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">لیستی سوورەتەکان</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setTheme(AppTheme.EMERALD)}
              className={`w-8 h-8 rounded-full bg-[#006c4c] border-2 transition-all ${theme === AppTheme.EMERALD ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110 shadow-lg' : 'opacity-60'}`}
            />
            <button 
              onClick={() => setTheme(AppTheme.DARK)}
              className={`w-8 h-8 rounded-full bg-[#191c1a] border-2 transition-all ${theme === AppTheme.DARK ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110 shadow-lg' : 'opacity-60'}`}
            />
            <button 
              onClick={() => setTheme(AppTheme.SEPIA)}
              className={`w-8 h-8 rounded-full bg-[#f5e8d9] border-2 transition-all ${theme === AppTheme.SEPIA ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110 shadow-lg' : 'opacity-60'}`}
            />
          </div>
        </div>

        {/* Advanced Theme Picker */}
        <div className={`p-6 rounded-[32px] shadow-lg transition-all space-y-6 backdrop-blur-md ${
          theme === AppTheme.DARK ? 'bg-[#212622]/40 border border-gray-800/50' : 'bg-white/40 border border-gray-100/50'
        }`}>
          <div>
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2 opacity-60">
              <Palette size={16} /> ڕووکارە پێشکەوتووەکان
            </h4>
            <div className="flex flex-wrap gap-3">
              {[
                { id: AppTheme.EMERALD, label: 'سەوز', color: '#006c4c' },
                { id: AppTheme.OCEAN, label: 'زەریا', color: '#0061a4' },
                { id: AppTheme.NIGHT, label: 'شەو', color: '#1c1b1f' },
                { id: AppTheme.ROSE, label: 'گوڵ', color: '#ba1a1a' },
                { id: AppTheme.SEPIA, label: 'کۆن', color: '#725c00' },
                { id: AppTheme.DARK, label: 'تاریک', color: '#191c1a' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-bold transition-all border ${
                    theme === t.id 
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' 
                      : (theme === AppTheme.DARK ? 'bg-black/20 border-gray-800' : 'bg-gray-100 border-gray-200')
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></div>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2 opacity-60">
              <Type size={16} /> ڕەنگی دەق و نیشانەکان
            </h4>
            <div className="flex flex-wrap gap-4">
              {Object.entries(AccentColor).map(([name, color]) => (
                <button
                  key={name}
                  onClick={() => setAccentColor(color as AccentColor)}
                  className={`w-10 h-10 rounded-full border-4 transition-all relative ${
                    accentColor === color ? 'scale-110 shadow-xl ring-2 ring-offset-2 ring-emerald-500' : 'opacity-60 scale-90'
                  }`}
                  style={{ backgroundColor: color, borderColor: (color === AccentColor.BLACK && theme === AppTheme.DARK) || (color === AccentColor.WHITE && theme !== AppTheme.DARK) ? '#ddd' : 'transparent' }}
                >
                  {accentColor === color && <div className={`absolute inset-0 flex items-center justify-center ${color === AccentColor.WHITE ? 'text-black' : 'text-white'}`}><CheckCircle2 size={16} /></div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1 pb-10">
        {surahs.map(s => <SurahCard key={s.id} surah={s} theme={theme} accentColor={accentColor} onClick={handleSurahClick} />)}
      </div>
    </div>
  );

  return (
    <Layout 
      activeScreen={screen} 
      onNavigate={setScreen} 
      title={screen === AppScreen.HOME ? "تەفسیری قورئان" : selectedSurah?.name_arabic || ""}
      showBack={screen === AppScreen.SURAH_DETAIL}
      onBack={goHome}
      theme={theme}
      accentColor={accentColor}
      hideNav={screen === AppScreen.SURAH_DETAIL}
      hideHeader={screen === AppScreen.SURAH_DETAIL}
    >
      {loading && (
        <div className="fixed inset-0 bg-white/60 z-[60] flex items-center justify-center backdrop-blur-md">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-emerald-700" size={40} />
            <span className="font-bold text-emerald-900 text-sm">کەمێکی تر...</span>
          </div>
        </div>
      )}

      {screen === AppScreen.HOME && renderHome()}
      
      {screen === AppScreen.SURAH_DETAIL && (
        <>
          {/* Floating + Button - Always Accessible Fixed to Viewport */}
          {!isHeaderVisible && (
            <button 
              onClick={() => setIsHeaderVisible(true)}
              className={`fixed top-3 left-3 z-[100] w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 bg-emerald-600/10 text-emerald-600/40 hover:bg-emerald-600/20 hover:text-emerald-600/60 backdrop-blur-[2px] border border-emerald-600/10`}
            >
              <Plus size={20} />
            </button>
          )}

          <div className="page-enter pb-safe relative">
            <div 
              className={`sticky top-0 z-20 flex flex-col border-b shadow-md transition-all duration-500 pt-safe backdrop-blur-md ${
                theme === AppTheme.DARK ? 'bg-[#191c1a]/80 border-gray-800' : 'bg-white/80 border-gray-100'
              } ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
            >
              <div className="p-3 flex gap-2 items-center justify-center w-full">
                {/* - Button to hide header */}
                <button 
                  onClick={() => setIsHeaderVisible(false)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    theme === AppTheme.DARK ? 'bg-gray-800/60 text-emerald-400' : 'bg-emerald-50/60 text-emerald-900 border border-emerald-100/50'
                  }`}
                >
                  <Minus size={20} />
                </button>

                <button 
                  onClick={goHome}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  theme === AppTheme.DARK ? 'bg-gray-800/60 text-emerald-400' : 'bg-emerald-50/60 text-emerald-900 border border-emerald-100/50'
                }`}
              >
                <ArrowRight size={20} />
              </button>

              <div className="relative flex-1 max-w-[200px]">
                <select 
                  value={selectedSurah?.id || ""} 
                  onChange={(e) => {
                    const s = surahs.find(sur => sur.id === parseInt(e.target.value));
                    if (s) handleSurahClick(s);
                  }}
                  className={`w-full appearance-none px-4 py-3 rounded-2xl font-bold text-xs text-center focus:outline-none transition-all pr-8 ${
                    theme === AppTheme.DARK ? 'bg-gray-800/60 text-emerald-400' : 'bg-emerald-50/60 text-emerald-900 border border-emerald-100/50'
                  }`}
                >
                  {surahs.map(s => (
                    <option key={s.id} value={s.id}>{s.id}. {s.name_arabic}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><ChevronDown size={14} /></div>
              </div>

              <div className="relative flex-1 max-w-[100px]">
                <select 
                  value={jumpToAyah} 
                  onChange={(e) => {
                    scrollToAyah(e.target.value);
                  }}
                  className={`w-full appearance-none px-4 py-3 rounded-2xl font-bold text-xs text-center focus:outline-none transition-all pr-8 ${
                    theme === AppTheme.DARK ? 'bg-gray-800/60 text-emerald-400' : 'bg-emerald-50/60 text-emerald-900 border border-emerald-100/50'
                  }`}
                >
                  <option value="">ئایەت</option>
                  {Array.from({ length: selectedSurah?.verses_count || 0 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><Hash size={14} /></div>
              </div>

              {/* Toggler for In-Surah Font Settings */}
              <button 
                onClick={() => {
                  setShowInSurahFontSettings(!showInSurahFontSettings);
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  showInSurahFontSettings 
                    ? 'text-white shadow-lg' 
                    : (theme === AppTheme.DARK ? 'bg-gray-800/60 text-emerald-400' : 'bg-emerald-50/60 text-emerald-900 border border-emerald-100/50')
                }`}
                style={{ backgroundColor: showInSurahFontSettings ? accentColor : undefined }}
              >
                <Type size={18} />
              </button>
            </div>

            {/* In-Surah Font Size Control Bar */}
            {showInSurahFontSettings && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={`px-4 py-4 flex items-center gap-4 animate-in slide-in-from-top duration-200 border-t backdrop-blur-sm ${
                theme === AppTheme.DARK ? 'bg-black/40 border-gray-800' : 'bg-gray-50/60 border-gray-100'
              }`}>
                <button onClick={() => setFontSize(prev => Math.max(0.5, prev - 0.1))} className="p-2 bg-emerald-100 text-emerald-900 rounded-lg"><Minus size={16} /></button>
                <div className="flex-1 flex flex-col gap-1">
                   <div className="flex justify-between text-[10px] font-bold opacity-50">
                      <span>بچووک</span>
                      <span className="text-emerald-600 font-bold">{Math.round(fontSize * 100)}%</span>
                      <span>گەورە</span>
                   </div>
                   <input 
                    type="range" 
                    min="0.5" 
                    max="3.6" 
                    step="0.1" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <button onClick={() => setFontSize(prev => Math.min(3.6, prev + 0.1))} className="p-2 bg-emerald-100 text-emerald-900 rounded-lg"><Plus size={16} /></button>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {verses.map(v => {
              const parts = v.verse_key.split(':');
              const tafseerFullText = (viewMode === 'tafseer' || viewMode === 'both') 
                ? getTafseerFromDB(parseInt(parts[0]), parseInt(parts[1]))
                : null;

              return (
                <div 
                  key={v.id} 
                  ref={(el) => { verseRefs.current[v.verse_key] = el; }}
                  data-verse-key={v.verse_key}
                  className={`p-6 border-b transition-colors scroll-mt-32 ${theme === AppTheme.DARK ? 'bg-[#191c1a] border-gray-800' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-4 py-1.5 rounded-full bg-[#cce8d9] text-[#002114] font-bold text-[10px] tracking-widest uppercase">ئایەتی {parts[1]}</span>
                    <button onClick={() => setSelectedVerse(v)} className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all" style={{ backgroundColor: accentColor }}>
                      <Database size={16} />
                    </button>
                  </div>

                  {(viewMode === 'quran' || viewMode === 'both') && (
                    <p 
                      className={`arabic-text text-right leading-[2.4] select-text mb-6`}
                      style={{ fontSize: `${32 * fontSize}px`, color: accentColor }}
                    >
                      {v.text_uthmani}
                    </p>
                  )}

                  {(viewMode === 'tafseer' || viewMode === 'both') && (
                    <div className={`text-right p-6 rounded-[32px] border-r-8 transition-all animate-in fade-in duration-500 ${
                      theme === AppTheme.DARK 
                        ? 'bg-gray-800/40' 
                        : 'bg-white shadow-sm'
                    }`} style={{ borderColor: accentColor }}>
                      {tafseerFullText ? (
                        <div 
                          className="leading-loose whitespace-pre-wrap select-text"
                          style={{ fontSize: `${18 * fontSize}px`, color: accentColor }}
                        >
                          {tafseerFullText}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 opacity-30 py-4" style={{ color: accentColor }}>
                          <Database size={24} />
                          <p className="text-xs font-bold italic">تەفسیر بۆ ئەم ئایەتە نییە</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="p-8 flex items-center justify-between gap-4">
              <button 
                onClick={() => handleSurahNavigate(-1)}
                disabled={selectedSurah?.id === 1}
                className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[28px] font-bold text-sm transition-all active:scale-95 shadow-lg disabled:opacity-20 ${
                  theme === AppTheme.DARK ? 'bg-gray-800' : 'bg-white'
                }`}
                style={{ color: accentColor }}
              >
                <ArrowRight size={20} />
                سوورەتی پێشوو
              </button>
              <button 
                onClick={() => handleSurahNavigate(1)}
                disabled={selectedSurah?.id === 114}
                className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[28px] font-bold text-sm transition-all active:scale-95 shadow-lg disabled:opacity-20 text-white`}
                style={{ backgroundColor: accentColor }}
              >
                سوورەتی داهاتوو
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    {selectedVerse && (
        <TafseerOverlay 
          verse={selectedVerse} 
          theme={theme}
          accentColor={accentColor}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onClose={() => setSelectedVerse(null)}
          onNext={() => navigateVerse(1)}
          onPrev={() => navigateVerse(-1)}
          fontSize={fontSize}
        />
      )}
    </Layout>
  );
};

export default App;
