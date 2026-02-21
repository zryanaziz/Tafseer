
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import SurahCard from './components/SurahCard';
import TafseerOverlay from './components/TafseerOverlay';
import { fetchSurahs, fetchSurahVerses } from './services/quranService';
import { initSQLite, loadPersistedDB, getTafseerFromDB } from './services/dbService';
import { Surah, Verse, AppScreen, AppTheme, LastRead } from './types';
import { Database, Loader2, FileBox, CheckCircle2, Layout as LayoutIcon, AlignRight, BookOpen, ChevronDown, Hash, ArrowRight, ArrowLeft, Type, Clock, Plus, Minus } from 'lucide-react';

type ViewMode = 'quran' | 'tafseer' | 'both';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.HOME);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  
  const [theme, setTheme] = useState<AppTheme>(() => (localStorage.getItem('app_theme') as AppTheme) || AppTheme.EMERALD);
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastTap = useRef<number>(0);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const persisted = await loadPersistedDB();
      setDbReady(persisted);
      
      const data = await fetchSurahs();
      setSurahs(data);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => { localStorage.setItem('app_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('app_view_mode', viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem('app_font_size', fontSize.toString()); }, [fontSize]);
  useEffect(() => { 
    if (lastRead) localStorage.setItem('app_last_read', JSON.stringify(lastRead)); 
  }, [lastRead]);

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
    await loadVerses(surah.id);
    saveLastRead(surah, `${surah.id}:1`);
    
    // Scroll to top of the main content area
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
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

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setIsHeaderVisible(prev => !prev);
    }
    lastTap.current = now;
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
          className={`p-3 rounded-[20px] shadow-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer border ${
            theme === AppTheme.DARK ? 'bg-[#212622] border-gray-800' : 'bg-emerald-50 border-emerald-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-emerald-600/10 text-emerald-600">
              <Clock size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest">کۆتا خوێندنەوە</p>
              <h4 className="font-bold text-xs">{lastRead.surahName} - {lastRead.verseKey.split(':')[1]}</h4>
            </div>
          </div>
          <ArrowLeft size={14} className="opacity-20" />
        </div>
      )}

      {/* View Mode & Font Size Settings */}
      <div className={`p-6 rounded-[32px] shadow-lg transition-all space-y-6 ${
        theme === AppTheme.DARK ? 'bg-[#212622] border border-gray-800' : 'bg-white border border-gray-100'
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
                    ? (theme === AppTheme.DARK ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-emerald-900 shadow-md') 
                    : 'opacity-50 grayscale'
                }`}
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
            <span className="text-lg font-bold px-3 py-1 rounded-xl bg-emerald-600 text-white shadow-md">{Math.round(fontSize * 100)}%</span>
          </div>
          <div className="px-2 flex items-center gap-4">
            <button onClick={() => setFontSize(prev => Math.max(0.5, prev - 0.1))} className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl font-bold active:scale-90 transition-all">-</button>
            <input 
              type="range" 
              min="0.5" 
              max="2.5" 
              step="0.1" 
              value={fontSize} 
              onChange={(e) => setFontSize(parseFloat(e.target.value))}
              className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <button onClick={() => setFontSize(prev => Math.min(2.5, prev + 0.1))} className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl font-bold active:scale-90 transition-all">+</button>
          </div>
        </div>
      </div>

      {/* Database Status Card */}
      <div className={`rounded-[32px] p-8 relative overflow-hidden flex flex-col items-center transition-all shadow-xl ${
        dbReady 
          ? (theme === AppTheme.DARK ? 'bg-emerald-900/40 border border-emerald-500/30' : 'bg-emerald-900 text-white') 
          : 'bg-orange-50 text-orange-950 border-2 border-dashed border-orange-200'
      }`}>
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-1/4 translate-x-1/4">
          <Database size={220} />
        </div>
        <h3 className="text-xl font-bold mb-2 text-center">{dbReady ? <CheckCircle2 size={32} className="inline mb-1 mr-2 text-emerald-400" /> : <FileBox size={32} className="inline mb-1 mr-2 opacity-40" />} SQLite</h3>
        <p className="text-sm opacity-70 mb-6 text-center max-w-[280px]">
          {dbReady ? "فایلەکە بە سەرکەوتوویی بارکراوە." : "فایلی تەفسیر باربکە."}
        </p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${dbReady ? 'bg-white text-emerald-900' : 'bg-orange-900 text-white'}`}
        >
          {dbReady ? "گۆڕینی فایل" : "بارکردنی فایل"}
          <input type="file" ref={fileInputRef} className="hidden" accept=".db" onChange={handleFileUpload} />
        </button>
      </div>

      <div className="flex items-center justify-between px-2 pt-4">
        <h2 className="text-2xl font-bold">لیستی سوورەتەکان</h2>
        <div className="flex gap-2">
           {[AppTheme.EMERALD, AppTheme.DARK, AppTheme.SEPIA].map(t => (
             <button 
              key={t} 
              onClick={() => setTheme(t)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${t === AppTheme.EMERALD ? 'bg-[#006c4c]' : t === AppTheme.DARK ? 'bg-[#191c1a]' : 'bg-[#f5e8d9]'} ${theme === t ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110 shadow-lg' : 'opacity-60'}`}
             />
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1 pb-10">
        {surahs.map(s => <SurahCard key={s.id} surah={s} theme={theme} onClick={handleSurahClick} />)}
      </div>
    </div>
  );

  return (
    <Layout 
      activeScreen={screen} 
      onNavigate={setScreen} 
      title={screen === AppScreen.HOME ? "تەفسیری قورئان" : selectedSurah?.name_arabic || ""}
      showBack={screen === AppScreen.SURAH_DETAIL}
      onBack={() => setScreen(AppScreen.HOME)}
      theme={theme}
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
        <div className="page-enter pb-safe relative">
          {/* Double-tap trigger area at the top */}
          <div 
            className="fixed top-0 left-0 right-0 h-20 z-[25] cursor-pointer"
            onClick={handleDoubleTap}
          />

          <div className={`sticky top-0 z-20 flex flex-col border-b shadow-md transition-all duration-300 pt-safe ${
            theme === AppTheme.DARK ? 'bg-[#191c1a] border-gray-800' : 'bg-white border-gray-100'
          } ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
            <div className="p-3 flex gap-2 items-center justify-center w-full">
              <button 
                onClick={() => setScreen(AppScreen.HOME)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  theme === AppTheme.DARK ? 'bg-gray-800 text-emerald-400' : 'bg-emerald-50 text-emerald-900 border border-emerald-100'
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
                    theme === AppTheme.DARK ? 'bg-gray-800 text-emerald-400' : 'bg-emerald-50 text-emerald-900 border border-emerald-100'
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
                  onChange={(e) => scrollToAyah(e.target.value)}
                  className={`w-full appearance-none px-4 py-3 rounded-2xl font-bold text-xs text-center focus:outline-none transition-all pr-8 ${
                    theme === AppTheme.DARK ? 'bg-gray-800 text-emerald-400' : 'bg-emerald-50 text-emerald-900 border border-emerald-100'
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
                onClick={() => setShowInSurahFontSettings(!showInSurahFontSettings)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  showInSurahFontSettings 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : (theme === AppTheme.DARK ? 'bg-gray-800 text-emerald-400' : 'bg-emerald-50 text-emerald-900')
                }`}
              >
                <Type size={18} />
              </button>
            </div>

            {/* In-Surah Font Size Control Bar */}
            {showInSurahFontSettings && (
              <div className={`px-4 py-4 flex items-center gap-4 animate-in slide-in-from-top duration-200 border-t ${
                theme === AppTheme.DARK ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-gray-100'
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
                    max="2.5" 
                    step="0.1" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <button onClick={() => setFontSize(prev => Math.min(2.5, prev + 0.1))} className="p-2 bg-emerald-100 text-emerald-900 rounded-lg"><Plus size={16} /></button>
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
                    <button onClick={() => setSelectedVerse(v)} className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-700 text-white shadow-lg active:scale-95 transition-all">
                      <Database size={16} />
                    </button>
                  </div>

                  {(viewMode === 'quran' || viewMode === 'both') && (
                    <p 
                      className={`arabic-text text-right leading-[2.4] select-text mb-6 ${theme === AppTheme.DARK ? 'text-gray-100' : 'text-gray-900'}`}
                      style={{ fontSize: `${32 * fontSize}px` }}
                    >
                      {v.text_uthmani}
                    </p>
                  )}

                  {(viewMode === 'tafseer' || viewMode === 'both') && (
                    <div className={`text-right p-6 rounded-[32px] border-r-8 transition-all animate-in fade-in duration-500 ${
                      theme === AppTheme.DARK 
                        ? 'bg-gray-800/40 border-emerald-500/50 text-gray-200' 
                        : 'bg-emerald-50 border-emerald-600 text-gray-800 shadow-sm'
                    }`}>
                      {tafseerFullText ? (
                        <div 
                          className="leading-loose whitespace-pre-wrap select-text"
                          style={{ fontSize: `${18 * fontSize}px` }}
                        >
                          {tafseerFullText}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 opacity-30 py-4">
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
                  theme === AppTheme.DARK ? 'bg-gray-800 text-emerald-400' : 'bg-emerald-50 text-emerald-900'
                }`}
              >
                <ArrowRight size={20} />
                سوورەتی پێشوو
              </button>
              <button 
                onClick={() => handleSurahNavigate(1)}
                disabled={selectedSurah?.id === 114}
                className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[28px] font-bold text-sm transition-all active:scale-95 shadow-lg disabled:opacity-20 ${
                  theme === AppTheme.DARK ? 'bg-emerald-900 text-white' : 'bg-emerald-700 text-white'
                }`}
              >
                سوورەتی داهاتوو
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVerse && (
        <TafseerOverlay 
          verse={selectedVerse} 
          theme={theme}
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
