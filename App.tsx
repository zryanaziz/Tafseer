
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SurahCard from './components/SurahCard';
import TafseerOverlay from './components/TafseerOverlay';
import { fetchSurahs, fetchSurahVerses } from './services/quranService';
import { getInterpretationStats, getLocalTafseer } from './services/localTafseerService';
import { Surah, Verse, AppScreen, AppTheme, DisplayFocus } from './types';
import { PlayCircle, PenTool, Loader2, Settings, Eye, BookOpen, LayoutTemplate, Maximize2, FileText } from 'lucide-react';

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
    try {
      const verseData = await fetchSurahVerses(surah.id);
      setVerses(verseData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

  const renderHome = () => (
    <div className={`page-enter py-4 ${isLandscape ? 'px-8' : ''}`}>
      {!isLandscape && (
        <div className="mx-4 mb-6">
          <div className={`${theme === AppTheme.DARK ? 'bg-[#3b4b41]' : 'bg-[#cce8d9]'} rounded-[32px] p-8 text-[#002114] flex flex-col relative overflow-hidden`}>
            <div className="absolute left-0 bottom-0 opacity-10 translate-y-1/4 -translate-x-1/4">
              <PlayCircle size={200} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">ئاستی بەرەوپێشچوون</p>
            <h3 className="text-5xl font-black mb-4">{stats} <span className="text-xl font-medium opacity-50">/ ٦٢٣٦</span></h3>
            <div className="w-full h-3 bg-black/10 rounded-full mt-2">
              <div 
                className="h-full bg-[#006c4c] rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (stats / 6236) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mx-6 mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">سوورەتەکان</h2>
        <button onClick={() => setShowGlobalSettings(!showGlobalSettings)} className="p-3 rounded-full bg-gray-100 active:bg-gray-200 transition-all">
          <Settings size={24} />
        </button>
      </div>

      {showGlobalSettings && (
        <div className="mx-4 mb-6 p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div>
            <p className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">ڕەنگی بەرنامە</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: AppTheme.EMERALD, color: 'bg-[#006c4c]', label: 'سەوز' },
                { id: AppTheme.DARK, color: 'bg-[#191c1a]', label: 'تاریک' },
                { id: AppTheme.SEPIA, color: 'bg-[#f5e8d9]', label: 'دافێ' },
                { id: AppTheme.LIGHT, color: 'bg-white', label: 'ڕوون' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-[24px] transition-all ${theme === t.id ? 'bg-[#cce8d9] ring-2 ring-[#006c4c]' : 'bg-gray-50'}`}
                >
                  <div className={`w-10 h-10 rounded-full border border-gray-200 ${t.color}`}></div>
                  <span className="text-[10px] font-bold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">شێوازی پیشاندان</p>
            <div className="flex gap-2">
              {[
                { id: DisplayFocus.BOTH, label: 'هەردووکی', icon: <LayoutTemplate size={18} /> },
                { id: DisplayFocus.QURAN_ONLY, label: 'قورئان', icon: <Eye size={18} /> },
                { id: DisplayFocus.TAFSEER_ONLY, label: 'تەفسیر', icon: <BookOpen size={18} /> }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setFocusMode(mode.id)}
                  className={`flex-1 py-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    focusMode === mode.id 
                      ? 'bg-[#006c4c] text-white shadow-lg' 
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-[#006c4c] animate-spin" /></div>
      ) : (
        <div className={`${isLandscape ? 'grid grid-cols-2 gap-4' : 'flex flex-col'}`}>
          {surahs.map(s => <SurahCard key={s.id} surah={s} theme={theme} onClick={handleSurahClick} />)}
        </div>
      )}
    </div>
  );

  return (
    <Layout 
      activeScreen={screen} 
      onNavigate={setScreen} 
      title={screen === AppScreen.HOME ? "تەفسیری قورئان" : selectedSurah?.name_arabic || "سوورەت"}
      showBack={screen === AppScreen.SURAH_DETAIL}
      onBack={() => setScreen(AppScreen.HOME)}
      theme={theme}
      hideNav={isLandscape}
      hideHeader={isLandscape && screen === AppScreen.SURAH_DETAIL}
    >
      {screen === AppScreen.HOME && renderHome()}
      {screen === AppScreen.SURAH_DETAIL && (
        <div className={`page-enter min-h-full pb-20 ${theme === AppTheme.DARK ? 'bg-[#191c1a]' : theme === AppTheme.SEPIA ? 'bg-[#fdf3e7]' : 'bg-[#fbfdf9]'}`}>
           {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-[#006c4c] animate-spin" /></div>
           ) : (
            <div className={isLandscape ? 'grid grid-cols-2 gap-px bg-gray-200' : 'space-y-4'}>
              {verses.map(v => {
                const localTafseer = getLocalTafseer(v.verse_key);
                return (
                  <div key={v.id} className={`p-6 ${theme === AppTheme.DARK ? 'bg-[#212622]' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className="px-4 py-1.5 rounded-full bg-[#cce8d9] text-[#002114] font-bold text-xs">ئایەتی {v.verse_key.split(':')[1]}</span>
                      <button 
                        onClick={() => setSelectedVerse(v)}
                        className="flex items-center gap-2 bg-[#006c4c] text-white px-5 py-2 rounded-full font-bold text-sm active:scale-90 transition-transform shadow-md"
                      >
                        <PenTool size={16} /> {localTafseer ? 'بینین' : 'تەفسیر'}
                      </button>
                    </div>

                    {(focusMode === DisplayFocus.BOTH || focusMode === DisplayFocus.QURAN_ONLY) && (
                      <>
                        <p className={`arabic-text leading-[2.2] text-right mb-6 ${isLandscape ? 'text-4xl' : 'text-3xl'} ${theme === AppTheme.DARK ? 'text-[#e1e3df]' : 'text-gray-900'}`}>
                          {v.text_uthmani}
                        </p>
                        <p className="text-right text-gray-500 italic text-sm leading-relaxed mb-4">{v.translations?.[0]?.text.replace(/<[^>]*>?/gm, '')}</p>
                      </>
                    )}

                    {(focusMode === DisplayFocus.BOTH || focusMode === DisplayFocus.TAFSEER_ONLY) && (
                      localTafseer ? (
                        <div className="p-5 rounded-[24px] bg-[#f3fbf6] border-r-8 border-[#006c4c] text-right">
                          <p className="font-bold text-xs opacity-40 mb-2 uppercase tracking-widest">تێبینی من</p>
                          <p className="line-clamp-3 text-[#002114] leading-relaxed">{localTafseer.text}</p>
                        </div>
                      ) : (
                        focusMode === DisplayFocus.TAFSEER_ONLY && (
                          <div className="p-5 rounded-[24px] bg-gray-50 border-r-8 border-gray-300 text-right opacity-60">
                             <p className="text-sm italic">هیچ تەفسیرێک تۆمار نەکراوە.</p>
                          </div>
                        )
                      )
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
