
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import SurahCard from './components/SurahCard';
import TafseerOverlay from './components/TafseerOverlay';
import { fetchSurahs, fetchSurahVerses } from './services/quranService';
import { initSQLite, loadPersistedDB, getTafseerFromDB } from './services/dbService';
import { Surah, Verse, AppScreen, AppTheme } from './types';
import { Database, Loader2, Play, Pause, FileBox, Info, AlertCircle, CheckCircle2, Layout as LayoutIcon, AlignRight, BookOpen, ChevronDown, Hash } from 'lucide-react';

type ViewMode = 'quran' | 'tafseer' | 'both';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.HOME);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [showSchemaInfo, setShowSchemaInfo] = useState(false);
  
  const [theme, setTheme] = useState<AppTheme>(() => (localStorage.getItem('app_theme') as AppTheme) || AppTheme.EMERALD);
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('app_view_mode') as ViewMode) || 'both');
  
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [jumpToAyah, setJumpToAyah] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [playingKey, setPlayingKey] = useState<string | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const result = await initSQLite(file);
        if (result.success) {
          setDbReady(true);
        } else {
          alert(result.error);
        }
      } catch (err) {
        alert("هەڵەیەکی نەزانراو ڕوویدا لە کاتی بارکردنی فایلەکە.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleSurahClick = async (surah: Surah) => {
    setSelectedSurah(surah);
    setLoading(true);
    setScreen(AppScreen.SURAH_DETAIL);
    setJumpToAyah(""); // Reset ayah jump
    try {
      const data = await fetchSurahVerses(surah.id);
      setVerses(data);
    } finally {
      setLoading(false);
    }
  };

  const scrollToAyah = (ayahNum: string) => {
    setJumpToAyah(ayahNum);
    const key = `${selectedSurah?.id}:${ayahNum}`;
    const element = verseRefs.current[key];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleAudio = (v: Verse) => {
    if (playingKey === v.verse_key) {
      audioRef.current?.pause();
      setPlayingKey(null);
    } else {
      if (audioRef.current) audioRef.current.src = "";
      const url = v.audio?.url || "";
      if (!url) return;
      const finalUrl = url.startsWith('//') ? `https:${url}` : url;
      const audio = new Audio(finalUrl);
      audioRef.current = audio;
      setPlayingKey(v.verse_key);
      audio.play().catch(() => setPlayingKey(null));
      audio.onended = () => setPlayingKey(null);
    }
  };

  const navigateVerse = (offset: number) => {
    if (!selectedVerse) return;
    const idx = verses.findIndex(v => v.id === selectedVerse.id);
    const nextIdx = idx + offset;
    if (nextIdx >= 0 && nextIdx < verses.length) {
      setSelectedVerse(verses[nextIdx]);
    }
  };

  const renderHome = () => (
    <div className="page-enter py-4 px-4 space-y-6">
      {/* View Mode Selector */}
      <div className={`p-6 rounded-[32px] shadow-lg transition-all ${
        theme === AppTheme.DARK ? 'bg-[#212622] border border-gray-800' : 'bg-white border border-gray-100'
      }`}>
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

      <div className="grid grid-cols-1 gap-1">
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
        <div className="page-enter pb-24">
          {/* Quick Nav Bar: Surah and Ayah Selectors */}
          <div className={`sticky top-0 z-20 p-3 flex gap-2 items-center justify-center border-b transition-colors ${
            theme === AppTheme.DARK ? 'bg-[#191c1a] border-gray-800' : 'bg-white border-gray-100'
          }`}>
            {/* Surah Selector */}
            <div className="relative flex-1 max-w-[180px]">
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

            {/* Ayah Selector */}
            <div className="relative flex-1 max-w-[120px]">
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
                  // Fix: Wrapped the ref assignment in curly braces to ensure it returns void, addressing the error: Type '(el: HTMLDivElement) => HTMLDivElement' is not assignable to type 'Ref<HTMLDivElement>'
                  ref={(el) => { verseRefs.current[v.verse_key] = el; }}
                  className={`p-6 border-b transition-colors scroll-mt-24 ${theme === AppTheme.DARK ? 'bg-[#191c1a] border-gray-800' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-4 py-1.5 rounded-full bg-[#cce8d9] text-[#002114] font-bold text-[10px] tracking-widest uppercase">ئایەتی {parts[1]}</span>
                    <div className="flex gap-2">
                       <button onClick={() => toggleAudio(v)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${playingKey === v.verse_key ? 'bg-emerald-600 text-white animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                          {playingKey === v.verse_key ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                       </button>
                       <button onClick={() => setSelectedVerse(v)} className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-700 text-white shadow-lg active:scale-95 transition-all">
                         <Database size={16} />
                       </button>
                    </div>
                  </div>

                  {/* Quran View */}
                  {(viewMode === 'quran' || viewMode === 'both') && (
                    <p className={`arabic-text text-3xl text-right leading-[2.4] select-text mb-6 ${theme === AppTheme.DARK ? 'text-gray-100' : 'text-gray-900'}`}>
                      {v.text_uthmani}
                    </p>
                  )}

                  {/* Tafseer View (Full text, no clippings) */}
                  {(viewMode === 'tafseer' || viewMode === 'both') && (
                    <div className={`text-right p-6 rounded-[32px] border-r-8 transition-all animate-in fade-in duration-500 ${
                      theme === AppTheme.DARK 
                        ? 'bg-gray-800/40 border-emerald-500/50 text-gray-200' 
                        : 'bg-emerald-50 border-emerald-600 text-gray-800 shadow-sm'
                    }`}>
                      {tafseerFullText ? (
                        <div className="text-lg leading-loose whitespace-pre-wrap select-text">
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
        />
      )}
    </Layout>
  );
};

export default App;
