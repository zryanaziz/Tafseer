
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, Database, Layout as LayoutIcon, AlignRight, BookOpen, Play, Pause, Bookmark, CheckCircle2, ChevronDown } from 'lucide-react';
import { Verse, AppTheme, AccentColor } from '../types';
import { getTafseerFromDB } from '../services/dbService';

type ViewMode = 'quran' | 'tafseer' | 'both';

interface TafseerOverlayProps {
  verse: Verse;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  theme: AppTheme;
  accentColor?: AccentColor;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  fontSize: number;
  isPlaying: boolean;
  onToggleAudio: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  activeTafseer: string;
  availableTafseerFiles: { id: string, name: string }[];
  activeTafseerFile: string;
  onSwitchTafseerFile: (fileName: string) => void;
}

const TafseerOverlay: React.FC<TafseerOverlayProps> = ({ 
  verse, onClose, onNext, onPrev, theme, accentColor = AccentColor.EMERALD, viewMode, onViewModeChange, fontSize, isPlaying, onToggleAudio, isBookmarked, onToggleBookmark, activeTafseer,
  availableTafseerFiles, activeTafseerFile, onSwitchTafseerFile
}) => {
  const [dbContent, setDbContent] = useState<string | null>(null);
  const [showTafseerSelector, setShowTafseerSelector] = useState(false);

  useEffect(() => {
    const parts = verse.verse_key.split(':');
    const surahId = parseInt(parts[0]);
    const verseId = parseInt(parts[1]);
    
    setDbContent(getTafseerFromDB(surahId, verseId, activeTafseer));
  }, [verse.verse_key, activeTafseer, activeTafseerFile]);

  const isDarkTheme = theme.startsWith('#0') || theme.startsWith('#1') || theme.startsWith('#2');

  const getOverlayBg = () => {
    return `backdrop-blur-xl ${isDarkTheme ? 'bg-black/80 text-gray-100' : 'bg-white/80 text-gray-900'}`;
  };

  const getHeaderStyles = () => {
    return `backdrop-blur-md border-b ${isDarkTheme ? 'bg-black/60 border-gray-800 text-white' : 'bg-white/60 border-gray-100 text-gray-900'}`;
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col animate-in slide-in-from-bottom duration-300 ${getOverlayBg()}`}>
      {/* Header */}
      <header className={`${getHeaderStyles()} px-4 py-4 flex flex-col gap-4 border-b shadow-lg shrink-0 pt-safe`}>
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 active:scale-90 transition-all">
            <X size={24} />
          </button>
          <div className="text-center">
            <h2 className="font-bold text-lg leading-tight">ئایەتی {verse.verse_key}</h2>
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={onToggleAudio}
               className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                 isPlaying ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
               }`}
             >
               {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
             </button>
             <button 
               onClick={onToggleBookmark}
               className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                 isBookmarked ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
               }`}
             >
               <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
             </button>
          </div>
        </div>

        {showTafseerSelector && (
          <div 
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowTafseerSelector(false)}
          >
            <div 
              className={`absolute bottom-0 left-0 right-0 p-8 rounded-t-[40px] shadow-2xl animate-in slide-in-from-bottom duration-500 ${
                isDarkTheme ? 'bg-[#191c1a] border-t border-white/5' : 'bg-white border-t border-black/5'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-400/20 rounded-full mx-auto mb-8"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="text-right">
                  <h3 className="text-xl font-bold">هەڵبژاردنی تەفسیر</h3>
                  <p className="text-xs opacity-50 mt-1">سەرچاوەی تەفسیرەکە بگۆڕە</p>
                </div>
                <button 
                  onClick={() => setShowTafseerSelector(false)}
                  className={`p-3 rounded-full transition-all ${
                    isDarkTheme ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                {availableTafseerFiles.map(file => (
                  <button
                    key={file.id}
                    onClick={() => {
                      onSwitchTafseerFile(file.id);
                      setShowTafseerSelector(false);
                    }}
                    className={`px-6 py-5 rounded-3xl text-right font-bold text-sm transition-all flex items-center justify-between group active:scale-[0.98] ${
                      activeTafseerFile === file.id 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                        : (isDarkTheme ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100')
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {activeTafseerFile === file.id ? (
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-current opacity-10 group-hover:opacity-30 transition-all"></div>
                      )}
                      <span className="text-base">{file.name}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-center gap-2 opacity-30">
                <Database size={12} />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">SQLite Database Engine</p>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Switcher */}
        <div className="flex flex-col gap-3 w-full max-w-[320px] self-center">
          <div className={`flex p-1 rounded-2xl ${
            isDarkTheme ? 'bg-black/40' : 'bg-black/10'
          }`}>
            {[
              { id: 'quran', label: 'قورئان', icon: <AlignRight size={14} /> },
              { id: 'both', label: 'هەردووکی', icon: <LayoutIcon size={14} /> },
              { id: 'tafseer', label: 'تەفسیر', icon: <BookOpen size={14} /> }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => onViewModeChange(mode.id as ViewMode)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  viewMode === mode.id 
                    ? (isDarkTheme ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-emerald-900 shadow-md') 
                    : 'opacity-60 grayscale'
                }`}
              >
                {mode.icon}
                {mode.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowTafseerSelector(true)}
            className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all border ${
              isDarkTheme ? 'bg-white/5 border-white/10 text-white/70' : 'bg-black/5 border-black/5 text-black/70'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database size={14} className="text-emerald-500" />
              <span>سەرچاوەی تەفسیر: {availableTafseerFiles.find(f => f.id === activeTafseerFile)?.name}</span>
            </div>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28">
        {/* Quran Section */}
        {(viewMode === 'quran' || viewMode === 'both') && (
          <div className={`p-8 rounded-[40px] border shadow-sm text-right transition-all animate-in fade-in duration-500 ${
            isDarkTheme ? 'bg-[#212622] border-gray-800' : 'bg-white border-gray-100'
          }`}>
            <p 
              className="arabic-text leading-[2.2] mb-6 select-text"
              style={{ fontSize: `${40 * fontSize}px`, color: accentColor }}
            >
              {verse.text_uthmani}
            </p>
            <div className="h-px w-full bg-current opacity-10 mb-6"></div>
            <p 
              className="opacity-80 leading-relaxed font-medium"
              style={{ fontSize: `${14 * fontSize}px`, color: accentColor }}
            >
              {verse.translations?.[0]?.text.replace(/<[^>]*>?/gm, '')}
            </p>
          </div>
        )}

        {/* SQLite Content Section */}
        {(viewMode === 'tafseer' || viewMode === 'both') && (
          <div className="space-y-3 px-2 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 opacity-40">
              <Lock size={14} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">ناوەڕۆکی فایلی SQLite</span>
            </div>
            
            <div className={`p-8 rounded-[40px] min-h-[180px] text-right leading-relaxed shadow-inner border-t-4 transition-all ${
              dbContent 
                ? (isDarkTheme ? 'bg-gray-800/50' : 'bg-white') 
                : 'border-gray-200 bg-gray-100 opacity-40 grayscale flex items-center justify-center'
            }`} style={{ borderColor: dbContent ? accentColor : undefined }}>
              {dbContent ? (
                <div 
                  className="whitespace-pre-wrap select-text"
                  style={{ fontSize: `${18 * fontSize}px`, color: accentColor, fontFamily: 'Calibri, sans-serif' }}
                >{dbContent}</div>
              ) : (
                <div className="flex flex-col items-center gap-4 opacity-50 text-center" style={{ color: accentColor }}>
                  <Database size={32} />
                  <p className="text-sm font-bold">بۆ ئەم ئایەتە هیچ تەفسیرێک نەدۆزرایەوە.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className={`h-24 border-t flex items-center justify-between px-8 pb-safe shrink-0 transition-colors backdrop-blur-md ${
        isDarkTheme ? 'bg-[#191c1a]/60 border-gray-800' : 'bg-white/60 border-gray-100'
      }`}>
        <button 
          onClick={onPrev} 
          className="flex items-center gap-2 font-bold text-sm active:scale-90 transition-all p-4 -ml-4"
          style={{ color: accentColor }}
        >
          <ChevronRight size={20} /> پێشوو
        </button>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></div>
          <div className="w-1.5 h-1.5 rounded-full opacity-30" style={{ backgroundColor: accentColor }}></div>
          <div className="w-1.5 h-1.5 rounded-full opacity-30" style={{ backgroundColor: accentColor }}></div>
        </div>
        <button 
          onClick={onNext} 
          className="flex items-center gap-2 font-bold text-sm active:scale-90 transition-all p-4 -mr-4"
          style={{ color: accentColor }}
        >
          داهاتوو <ChevronLeft size={20} />
        </button>
      </footer>
    </div>
  );
};

export default TafseerOverlay;
