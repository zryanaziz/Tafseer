
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, Database, Layout as LayoutIcon, AlignRight, BookOpen } from 'lucide-react';
import { Verse, AppTheme } from '../types';
import { getTafseerFromDB } from '../services/dbService';

type ViewMode = 'quran' | 'tafseer' | 'both';

interface TafseerOverlayProps {
  verse: Verse;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  theme: AppTheme;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  fontSize: number;
}

const TafseerOverlay: React.FC<TafseerOverlayProps> = ({ 
  verse, onClose, onNext, onPrev, theme, viewMode, onViewModeChange, fontSize
}) => {
  const [dbContent, setDbContent] = useState<string | null>(null);

  useEffect(() => {
    const parts = verse.verse_key.split(':');
    const surahId = parseInt(parts[0]);
    const verseId = parseInt(parts[1]);
    
    setDbContent(getTafseerFromDB(surahId, verseId));
  }, [verse.verse_key]);

  const getOverlayBg = () => {
    switch(theme) {
      case AppTheme.DARK: return 'bg-[#191c1a] text-gray-100';
      case AppTheme.SEPIA: return 'bg-[#fdf3e7] text-[#504538]';
      default: return 'bg-[#fbfdf9] text-gray-900';
    }
  };

  const getHeaderStyles = () => {
    switch(theme) {
      case AppTheme.DARK: return 'bg-[#212622] border-gray-800 text-white';
      case AppTheme.SEPIA: return 'bg-[#f5e8d9] border-[#e9ddd0] text-[#504538]';
      default: return 'bg-emerald-900 text-white border-transparent';
    }
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
          <div className="w-10 flex justify-end">
             <Database size={20} className="opacity-40" />
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className={`flex p-1 rounded-2xl self-center w-full max-w-[320px] ${
          theme === AppTheme.DARK ? 'bg-black/40' : 'bg-black/10'
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
                  ? (theme === AppTheme.DARK ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-emerald-900 shadow-md') 
                  : 'opacity-60 grayscale'
              }`}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28">
        {/* Quran Section */}
        {(viewMode === 'quran' || viewMode === 'both') && (
          <div className={`p-8 rounded-[40px] border shadow-sm text-right transition-all animate-in fade-in duration-500 ${
            theme === AppTheme.DARK ? 'bg-[#212622] border-gray-800' : theme === AppTheme.SEPIA ? 'bg-orange-100/50 border-orange-200' : 'bg-emerald-50 border-emerald-100'
          }`}>
            <p 
              className="arabic-text leading-[2.2] mb-6 text-[#006c4c] dark:text-[#9cf4c6] select-text"
              style={{ fontSize: `${40 * fontSize}px` }}
            >
              {verse.text_uthmani}
            </p>
            <div className="h-px w-full bg-current opacity-10 mb-6"></div>
            <p 
              className="opacity-80 leading-relaxed font-medium"
              style={{ fontSize: `${14 * fontSize}px` }}
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
                ? (theme === AppTheme.DARK ? 'bg-gray-800/50 border-emerald-500/50 text-gray-100' : 'bg-white border-emerald-600 text-gray-800') 
                : 'border-gray-200 bg-gray-100 opacity-40 grayscale flex items-center justify-center'
            }`}>
              {dbContent ? (
                <div 
                  className="whitespace-pre-wrap select-text"
                  style={{ fontSize: `${18 * fontSize}px` }}
                >{dbContent}</div>
              ) : (
                <div className="flex flex-col items-center gap-4 opacity-50 text-center">
                  <Database size={32} />
                  <p className="text-sm font-bold">بۆ ئەم ئایەتە هیچ تەفسیرێک نەدۆزرایەوە.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className={`h-24 border-t flex items-center justify-between px-8 pb-safe shrink-0 transition-colors ${
        theme === AppTheme.DARK ? 'bg-[#191c1a] border-gray-800' : 'bg-white border-gray-100'
      }`}>
        <button 
          onClick={onPrev} 
          className="flex items-center gap-2 font-bold text-sm text-emerald-700 active:scale-90 transition-all p-4 -ml-4"
        >
          <ChevronRight size={20} /> پێشوو
        </button>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></div>
        </div>
        <button 
          onClick={onNext} 
          className="flex items-center gap-2 font-bold text-sm text-emerald-700 active:scale-90 transition-all p-4 -mr-4"
        >
          داهاتوو <ChevronLeft size={20} />
        </button>
      </footer>
    </div>
  );
};

export default TafseerOverlay;
