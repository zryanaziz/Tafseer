import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, CheckCircle2, Circle, Eye, EyeOff, Loader2, Search, Filter, BookOpen, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Surah, Verse } from '../types';
import { fetchSurahVerses } from '../services/quranService';

interface HifzModeProps {
  surahs: Surah[];
  onBack: () => void;
  theme: string;
  accentColor: string;
  fontSize: number;
}

const HIFZ_STORAGE_KEY = 'app_hifz_data';

interface HifzData {
  memorizedSurahs: number[]; // surah IDs
  memorizedVerses: string[]; // verse keys
}

const HifzMode: React.FC<HifzModeProps> = ({ surahs, onBack, theme, accentColor, fontSize }) => {
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hifzData, setHifzData] = useState<HifzData>(() => {
    const saved = localStorage.getItem(HIFZ_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { memorizedSurahs: [], memorizedVerses: [] };
  });
  const [showOnlyNotMemorized, setShowOnlyNotMemorized] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenVerses, setHiddenVerses] = useState<Record<string, boolean>>({});

  const isDark = theme.startsWith('#0') || theme.startsWith('#1') || theme.startsWith('#2');

  useEffect(() => {
    localStorage.setItem(HIFZ_STORAGE_KEY, JSON.stringify(hifzData));
  }, [hifzData]);

  // Sync verses for already memorized surahs if they are missing
  useEffect(() => {
    let needsSync = false;
    const newMemorizedVerses = [...hifzData.memorizedVerses];

    hifzData.memorizedSurahs.forEach(surahId => {
      const surah = surahs.find(s => s.id === surahId);
      if (surah) {
        for (let i = 1; i <= surah.verses_count; i++) {
          const vk = `${surahId}:${i}`;
          if (!newMemorizedVerses.includes(vk)) {
            newMemorizedVerses.push(vk);
            needsSync = true;
          }
        }
      }
    });

    if (needsSync) {
      setHifzData(prev => ({ ...prev, memorizedVerses: newMemorizedVerses }));
    }
  }, [surahs]);

  const toggleSurahMemorized = (surahId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const surah = surahs.find(s => s.id === surahId);
    if (!surah) return;

    setHifzData(prev => {
      const isMemorized = prev.memorizedSurahs.includes(surahId);
      const surahVerseKeys = Array.from({ length: surah.verses_count }, (_, i) => `${surahId}:${i + 1}`);
      
      if (isMemorized) {
        // Remove surah and all its verses
        return { 
          ...prev, 
          memorizedSurahs: prev.memorizedSurahs.filter(id => id !== surahId),
          memorizedVerses: prev.memorizedVerses.filter(vk => !surahVerseKeys.includes(vk))
        };
      } else {
        // Add surah and all its verses (avoid duplicates)
        const newVerses = [...prev.memorizedVerses];
        surahVerseKeys.forEach(vk => {
          if (!newVerses.includes(vk)) newVerses.push(vk);
        });
        return { 
          ...prev, 
          memorizedSurahs: [...prev.memorizedSurahs, surahId],
          memorizedVerses: newVerses
        };
      }
    });
  };

  const toggleVerseMemorized = (verseKey: string) => {
    setHifzData(prev => {
      const isMemorized = prev.memorizedVerses.includes(verseKey);
      if (isMemorized) {
        return { ...prev, memorizedVerses: prev.memorizedVerses.filter(vk => vk !== verseKey) };
      } else {
        return { ...prev, memorizedVerses: [...prev.memorizedVerses, verseKey] };
      }
    });
  };

  const handleSurahClick = async (surah: Surah) => {
    setSelectedSurah(surah);
    setLoading(true);
    try {
      const data = await fetchSurahVerses(surah.id);
      setVerses(data);
      // Initially hide all verses for memorization mode
      const initialHidden: Record<string, boolean> = {};
      data.forEach(v => initialHidden[v.verse_key] = true);
      setHiddenVerses(initialHidden);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSurahs = surahs.filter(s => {
    const matchesSearch = s.name_arabic.includes(searchQuery) || 
                         s.translated_name.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = showOnlyNotMemorized ? !hifzData.memorizedSurahs.includes(s.id) : true;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
  });

  const toggleVerseVisibility = (verseKey: string) => {
    setHiddenVerses(prev => ({ ...prev, [verseKey]: !prev[verseKey] }));
  };

  const revealAll = () => {
    const allVisible: Record<string, boolean> = {};
    verses.forEach(v => allVisible[v.verse_key] = false);
    setHiddenVerses(allVisible);
  };

  const hideAll = () => {
    const allHidden: Record<string, boolean> = {};
    verses.forEach(v => allHidden[v.verse_key] = true);
    setHiddenVerses(allHidden);
  };

  const totalVerses = surahs.reduce((acc, s) => acc + s.verses_count, 0);
  const memorizedVersesCount = hifzData.memorizedVerses.length;
  const memorizedSurahsCount = hifzData.memorizedSurahs.length;
  const progressPercentage = totalVerses > 0 ? (memorizedVersesCount / totalVerses) * 100 : 0;

  return (
    <div className="page-enter flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className={`p-4 flex items-center justify-between border-b shrink-0 ${isDark ? 'bg-black/40 border-gray-800' : 'bg-white/40 border-gray-100'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-black/5 active:scale-90 transition-all">
            <ArrowRight size={24} />
          </button>
          <div>
            <h2 className="font-bold text-lg">لەبەرکردنی قورئان</h2>
            <p className="text-[10px] opacity-50 uppercase tracking-widest">بەدواداچوونی لەبەرکردن و تاقیکردنەوە</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {!selectedSurah && (
          <div className={`p-6 rounded-[32px] border shadow-sm space-y-4 ${isDark ? 'bg-[#212622]/40 border-gray-800/50' : 'bg-white/40 border-gray-100/50'}`}>
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-sm font-bold opacity-60 mb-1">پێشکەوتنی گشتی</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: accentColor }}>{progressPercentage.toFixed(1)}%</span>
                  <span className="text-[10px] opacity-40 font-bold uppercase tracking-wider">تەواوکراوە</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-end gap-2" dir="ltr">
                    <span className="text-xs font-bold">{memorizedSurahsCount} / {surahs.length}</span>
                    <span className="text-[10px] opacity-50" dir="rtl">سوورەت</span>
                  </div>
                  <div className="flex items-center justify-end gap-2" dir="ltr">
                    <span className="text-xs font-bold">{memorizedVersesCount} / {totalVerses}</span>
                    <span className="text-[10px] opacity-50" dir="rtl">ئایەت</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-1000 ease-out rounded-full"
                style={{ 
                  width: `${progressPercentage}%`, 
                  backgroundColor: accentColor,
                  boxShadow: `0 0 10px ${accentColor}40`
                }}
              />
            </div>
          </div>
        )}

        {!selectedSurah ? (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col gap-3">
              <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${isDark ? 'bg-black/20 border-gray-800' : 'bg-white border-gray-100'}`}>
                <Search size={18} className="opacity-40" />
                <input 
                  type="text" 
                  placeholder="گەڕان بۆ سوورەت..." 
                  className="bg-transparent border-none outline-none flex-1 text-sm py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowOnlyNotMemorized(!showOnlyNotMemorized)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-bold transition-all border ${
                    showOnlyNotMemorized 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : isDark ? 'bg-black/20 border-gray-800 opacity-60' : 'bg-white border-gray-100 opacity-60'
                  }`}
                >
                  <Filter size={14} />
                  {showOnlyNotMemorized ? 'هەموو' : 'لەبەر نەکراو'}
                </button>
                <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-bold transition-all border ${
                    isDark ? 'bg-black/20 border-gray-800 opacity-60' : 'bg-white border-gray-100 opacity-60'
                  }`}
                >
                  {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {sortOrder === 'asc' ? '١ بۆ ١١٤' : '١١٤ بۆ ١'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredSurahs.map(s => {
                const isMemorized = hifzData.memorizedSurahs.includes(s.id);
                const surahMemorizedVerses = hifzData.memorizedVerses.filter(vk => vk.startsWith(`${s.id}:`)).length;
                const surahProgress = (surahMemorizedVerses / s.verses_count) * 100;

                return (
                  <div 
                    key={s.id}
                    onClick={() => handleSurahClick(s)}
                    className={`p-4 rounded-[28px] flex flex-col gap-3 transition-all active:scale-[0.98] border shadow-sm cursor-pointer ${
                      isDark ? 'bg-[#212622]/40 border-gray-800/50' : 'bg-white/40 border-gray-100/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                          isMemorized ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {s.id}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{s.name_arabic}</h4>
                          <p className="text-[10px] opacity-50">{s.translated_name.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right" dir="ltr">
                          <p className="text-[10px] font-bold" style={{ color: accentColor }}>{surahMemorizedVerses} / {s.verses_count}</p>
                          <p className="text-[8px] opacity-40 uppercase tracking-tighter" dir="rtl">ئایەت</p>
                        </div>
                        <button 
                          onClick={(e) => toggleSurahMemorized(s.id, e)}
                          className={`p-2 rounded-xl transition-all ${
                            isMemorized ? 'text-emerald-600' : 'opacity-20 hover:opacity-100'
                          }`}
                        >
                          {isMemorized ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        <ChevronLeft size={16} className="opacity-20" />
                      </div>
                    </div>
                    
                    {/* Surah Progress Bar */}
                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 rounded-full"
                        style={{ 
                          width: `${surahProgress}%`, 
                          backgroundColor: isMemorized ? '#10b981' : accentColor,
                          opacity: surahProgress > 0 ? 1 : 0
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setSelectedSurah(null)}
                className="flex items-center gap-2 text-xs font-bold opacity-60 hover:opacity-100 transition-all"
              >
                <ArrowRight size={14} /> گەڕانەوە بۆ لیست
              </button>
              <h3 className="font-bold text-xl text-emerald-600">{selectedSurah.name_arabic}</h3>
            </div>

            {/* Controls for Memorization */}
            <div className="flex gap-2">
              <button 
                onClick={revealAll}
                className="flex-1 py-3 rounded-2xl bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Eye size={16} /> پیشاندانی هەموو
              </button>
              <button 
                onClick={hideAll}
                className="flex-1 py-3 rounded-2xl bg-black/5 font-bold text-xs flex items-center justify-center gap-2"
              >
                <EyeOff size={16} /> شاردنەوەی هەموو
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
                <p className="text-sm font-bold opacity-50">خەریکی بارکردنی ئایەتەکانە...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verses.map((v, idx) => {
                  const isMemorized = hifzData.memorizedVerses.includes(v.verse_key);
                  const isHidden = hiddenVerses[v.verse_key];

                  return (
                    <div 
                      key={v.id}
                      className={`p-6 rounded-[32px] border transition-all space-y-4 ${
                        isDark ? 'bg-[#212622]/40 border-gray-800/50' : 'bg-white/40 border-gray-100/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleVerseVisibility(v.verse_key)}
                            className={`p-2 rounded-xl transition-all ${isHidden ? 'bg-emerald-600 text-white' : 'bg-black/5 opacity-40'}`}
                          >
                            {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button 
                            onClick={() => toggleVerseMemorized(v.verse_key)}
                            className={`p-2 rounded-xl transition-all ${isMemorized ? 'text-emerald-600' : 'opacity-20'}`}
                          >
                            {isMemorized ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                        </div>
                      </div>

                      <div 
                        onClick={() => toggleVerseVisibility(v.verse_key)}
                        className={`arabic-text text-right leading-relaxed cursor-pointer transition-all duration-500 ${
                          isHidden ? 'blur-md opacity-20 select-none' : 'blur-0 opacity-100'
                        }`}
                        style={{ fontSize: `${24 * fontSize}px`, color: accentColor }}
                      >
                        {v.text_uthmani}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HifzMode;
