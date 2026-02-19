
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import SurahCard from './components/SurahCard';
import TafseerOverlay from './components/TafseerOverlay';
import { fetchSurahs, fetchSurahVerses } from './services/quranService';
import { getInterpretationStats, getLocalTafseer } from './services/localTafseerService';
import { Surah, Verse, AppScreen, Bookmark, AppTheme, DisplayFocus } from './types';
import { PlayCircle, PenTool, Loader2, Settings, Eye, BookOpen, LayoutTemplate, FileText, Maximize2 } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.HOME);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('app_theme') as AppTheme) || AppTheme.EMERALD;
  });

  const [focusMode, setFocusMode] = useState<DisplayFocus>(() => {
    return (localStorage.getItem('display_focus') as DisplayFocus) || DisplayFocus.BOTH;
  });
  
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      
      if (landscape && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!landscape && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('display_focus', focusMode);
  }, [focusMode]);

  useEffect(() => {
    const loadSurahs = async () => {
      const data = await fetchSurahs();
      setSurahs(data);
      setLoading(false);
      setStats(getInterpretationStats());
    };
    loadSurahs();
  }, []);

  const handleSurahClick = async (surah: Surah) => {
    setSelectedSurah(surah);
    setLoading(true);
    setScreen(AppScreen.SURAH_DETAIL);
    const verseData = await fetchSurahVerses(surah.id);
    setVerses(verseData);
    setLoading(false);
  };

  const handleNextVerse = async () => {
    if (!selectedVerse || !selectedSurah || verses.length === 0) return;
    const currentIndex = verses.findIndex(v => v.id === selectedVerse.id);
    if (currentIndex < verses.length - 1) {
      setSelectedVerse(verses[currentIndex + 1]);
    } else {
      const surahIndex = surahs.findIndex(s => s.id === selectedSurah.id);
      if (surahIndex < surahs.length - 1) {
        setIsNavigating(true);
        const nextSurah = surahs[surahIndex + 1];
        const nextVerses = await fetchSurahVerses(nextSurah.id);
        setSelectedSurah(nextSurah);
        setVerses(nextVerses);
        setSelectedVerse(nextVerses[0]);
        setIsNavigating(false);
      }
    }
  };

  const handlePrevVerse = async () => {
    if (!selectedVerse || !selectedSurah || verses.length === 0) return;
    const currentIndex = verses.findIndex(v => v.id === selectedVerse.id);
    if (currentIndex > 0) {
      setSelectedVerse(verses[currentIndex - 1]);
    } else {
      const surahIndex = surahs.findIndex(s => s.id === selectedSurah.id);
      if (surahIndex > 0) {
        setIsNavigating(true);
        const prevSurah = surahs[surahIndex - 1];
        const prevVerses = await fetchSurahVerses(prevSurah.id);
        setSelectedSurah(prevSurah);
        setVerses(prevVerses);
        setSelectedVerse(prevVerses[prevVerses.length - 1]);
        setIsNavigating(false);
      }
    }
  };

  const getTitle = () => {
    switch(screen) {
      case AppScreen.HOME: return "تەفسیری قورئانی پیرۆز";
      case AppScreen.SURAH_DETAIL: return selectedSurah?.name_arabic || "سوورەت";
      default: return "تەفسیری قورئان";
    }
  };

  const renderHome = () => (
    <div className={`py-2 ${isLandscape ? 'px-8' : ''}`}>
      {!isLandscape && (
        <div className="mx-4 mt-4 mb-2">
          <h2 className={`text-lg font-bold ${theme === AppTheme.DARK ? 'text-gray-100' : 'text-gray-800'}`}>بەرەوپێشچوونم</h2>
          <div className={`mt-3 ${theme === AppTheme.DARK ? 'bg-gray-800' : theme === AppTheme.SEPIA ? 'bg-orange-900' : 'bg-emerald-800'} rounded-3xl p-6 text-white flex items-center justify-between shadow-xl relative overflow-hidden transition-all duration-500`}>
            <div className="absolute -left-4 -bottom-4 opacity-10">
              <PenTool size={120} />
            </div>
            <div className="relative z-10 text-right">
              <p className="opacity-60 text-[10px] uppercase tracking-widest font-bold">ئایەتە تەفسیرکراوەکان</p>
              <h3 className="text-4xl font-black mt-1">{stats} <span className="text-lg font-medium opacity-60">/ 6٢٣٦</span></h3>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-32 h-1.5 bg-black/20 rounded-full">
                  <div 
                    className={`h-full ${theme === AppTheme.SEPIA ? 'bg-orange-400' : 'bg-emerald-400'} rounded-full transition-all duration-500`} 
                    style={{ width: `${(stats / 6236) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold">
                  {((stats / 6236) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <PlayCircle size={44} className="opacity-80" />
          </div>
        </div>
      )}
      
      <div className="mx-4 mt-6 mb-2 flex items-center justify-between">
        <h2 className={`text-lg font-bold ${theme === AppTheme.DARK ? 'text-gray-100' : 'text-gray-800'}`}>فەهرەستی سوورەتەکان</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowGlobalSettings(!showGlobalSettings)}
            className={`p-2 rounded-xl flex items-center gap-2 ${theme === AppTheme.DARK ? 'bg-gray-800 text-gray-300' : 'bg-emerald-50 text-emerald-700'}`}
          >
            <Settings size={18} />
            {!isLandscape && <span className="text-xs font-bold uppercase tracking-tighter">ڕێکخستنەکان</span>}
          </button>
        </div>
      </div>

      {showGlobalSettings && (
        <div className={`mx-4 mb-4 p-4 rounded-3xl animate-in slide-in-from-top-2 duration-300 ${theme === AppTheme.DARK ? 'bg-gray-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
          <div className={`space-y-4 ${isLandscape ? 'grid grid-cols-2 gap-4 space-y-0' : ''}`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">ڕەنگی بەرنامە</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: AppTheme.EMERALD, color: 'bg-emerald-600', label: 'سەوز' },
                  { id: AppTheme.DARK, color: 'bg-gray-900', label: 'تاریک' },
                  { id: AppTheme.SEPIA, color: 'bg-orange-100', label: 'دافێ' },
                  { id: AppTheme.LIGHT, color: 'bg-white', label: 'ڕوون' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${theme === t.id ? 'bg-emerald-500/10 ring-1 ring-emerald-500' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full border border-gray-200 ${t.color}`}></div>
                    <span className={`text-[9px] font-bold ${theme === AppTheme.DARK ? 'text-gray-400' : 'text-gray-600'}`}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">شێوازی پیشاندان</p>
              <div className="flex gap-2">
                {[
                  { id: DisplayFocus.BOTH, label: 'هەردووکی', icon: <LayoutTemplate size={14} /> },
                  { id: DisplayFocus.QURAN_ONLY, label: 'قورئان', icon: <Eye size={14} /> },
                  { id: DisplayFocus.TAFSEER_ONLY, label: 'تەفسیر', icon: <BookOpen size={14} /> }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setFocusMode(mode.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      focusMode === mode.id 
                        ? 'bg-emerald-600 text-white shadow-lg' 
                        : theme === AppTheme.DARK ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {mode.icon} {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && surahs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className={`pb-4 ${isLandscape ? 'grid grid-cols-2 gap-2' : ''}`}>
          {surahs.map(s => <SurahCard key={s.id} surah={s} theme={theme} onClick={handleSurahClick} />)}
        </div>
      )}
    </div>
  );

  return (
    <Layout 
      activeScreen={screen} 
      onNavigate={setScreen} 
      title={getTitle()}
      showBack={screen === AppScreen.SURAH_DETAIL}
      onBack={() => setScreen(AppScreen.HOME)}
      theme={theme}
      hideNav={isLandscape}
      hideHeader={isLandscape && screen === AppScreen.SURAH_DETAIL}
    >
      {screen === AppScreen.HOME && renderHome()}
      {screen === AppScreen.SURAH_DETAIL && (
        <div className={`min-h-full divide-y transition-colors duration-500 ${theme === AppTheme.DARK ? 'bg-gray-900 divide-gray-800' : theme === AppTheme.SEPIA ? 'bg-orange-50 divide-orange-100' : 'bg-white divide-gray-100'}`}>
          {isLandscape && (
            <div className={`sticky top-0 z-20 p-2 flex items-center justify-between border-b ${theme === AppTheme.DARK ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-100'}`}>
               <button onClick={() => setScreen(AppScreen.HOME)} className="p-2 text-emerald-500 flex items-center gap-2 font-bold text-sm">
                 <Maximize2 size={16} className="-rotate-45" /> گەڕانەوە بۆ سەرەتا
               </button>
               <h2 className="text-xs font-bold opacity-40 uppercase tracking-widest">{selectedSurah?.name_arabic}</h2>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : (
            <div className={isLandscape ? 'grid grid-cols-2 divide-x divide-x-reverse divide-gray-800/10' : ''}>
              {verses.map(v => {
                const localTafseer = getLocalTafseer(v.verse_key);
                return (
                  <div key={v.id} className="p-5 text-right">
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${theme === AppTheme.DARK ? 'bg-gray-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        ئایەتی {v.verse_key.split(':')[1]}
                      </span>
                      <button 
                        onClick={() => setSelectedVerse(v)}
                        className={`p-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all ${theme === AppTheme.DARK ? 'bg-gray-800 text-emerald-400' : theme === AppTheme.SEPIA ? 'bg-orange-200 text-orange-900' : 'bg-emerald-100 text-emerald-700'}`}
                      >
                        <PenTool size={16} />
                        <span className="text-xs font-bold">{localTafseer ? 'کردنەوە' : 'نووسین'}</span>
                      </button>
                    </div>
                    
                    {focusMode !== DisplayFocus.TAFSEER_ONLY && (
                      <p className={`arabic-text leading-loose text-right mb-4 ${isLandscape ? 'text-4xl' : 'text-3xl'} ${theme === AppTheme.DARK ? 'text-gray-100' : 'text-gray-900'}`}>
                        {v.text_uthmani}
                      </p>
                    )}

                    {focusMode === DisplayFocus.BOTH && (
                      <>
                        <p className={`text-sm italic mb-4 text-right opacity-60 ${theme === AppTheme.DARK ? 'text-gray-400' : 'text-gray-500'}`}>
                          {v.translations?.[0]?.text.replace(/<[^>]*>?/gm, '')}
                        </p>
                        {localTafseer && (
                          <div className={`p-4 rounded-2xl border-r-4 border-emerald-500 text-sm text-right ${theme === AppTheme.DARK ? 'bg-gray-800/50 text-gray-300' : 'bg-emerald-50/30 text-emerald-900'}`}>
                             <p className="font-bold text-[10px] uppercase tracking-widest opacity-40 mb-1">تەفسیری من</p>
                             <p className="line-clamp-3 leading-relaxed">{localTafseer.text}</p>
                          </div>
                        )}
                      </>
                    )}

                    {focusMode === DisplayFocus.QURAN_ONLY && (
                      <p className={`text-sm italic text-right opacity-60 ${theme === AppTheme.DARK ? 'text-gray-400' : 'text-gray-500'}`}>
                        {v.translations?.[0]?.text.replace(/<[^>]*>?/gm, '')}
                      </p>
                    )}

                    {focusMode === DisplayFocus.TAFSEER_ONLY && (
                      <div className={`p-4 rounded-2xl border-r-4 border-emerald-500 text-right ${theme === AppTheme.DARK ? 'bg-gray-800/50 text-gray-100' : 'bg-emerald-50 text-emerald-950'}`}>
                        <div className="flex items-center gap-2 mb-2 opacity-40">
                           <FileText size={12} />
                           <p className="font-bold text-[10px] uppercase tracking-widest">تەفسیر</p>
                        </div>
                        {localTafseer ? (
                          <p className="text-sm leading-relaxed">{localTafseer.text}</p>
                        ) : (
                          <p className="text-sm italic opacity-40">هیچ تەفسیرێک تۆمار نەکراوە.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {selectedVerse && (
        <TafseerOverlay 
          verse={selectedVerse} 
          isNavigating={isNavigating}
          onNext={handleNextVerse}
          onPrev={handlePrevVerse}
          theme={theme}
          onThemeChange={setTheme}
          focusMode={focusMode}
          onFocusModeChange={setFocusMode}
          isLandscape={isLandscape}
          onClose={() => {
            setSelectedVerse(null);
            setStats(getInterpretationStats());
          }} 
        />
      )}
    </Layout>
  );
};

export default App;
