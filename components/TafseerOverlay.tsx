
import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, BookOpen, Share2, Edit3, Type as TypeIcon, Loader2, ChevronLeft, ChevronRight, CheckCircle2, Settings, Eye, LayoutTemplate } from 'lucide-react';
import { Verse, LocalTafseer, AppTheme, DisplayFocus } from '../types';
import { getLocalTafseer, saveLocalTafseer } from '../services/localTafseerService';
import { getAIInsights } from '../services/geminiService';

interface TafseerOverlayProps {
  verse: Verse;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  isNavigating: boolean;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  isLandscape?: boolean;
}

const TafseerOverlay: React.FC<TafseerOverlayProps> = ({ 
  verse, 
  onClose, 
  onNext, 
  onPrev, 
  isNavigating,
  theme,
  onThemeChange,
  isLandscape = false
}) => {
  const [tafseer, setTafseer] = useState<LocalTafseer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [fontSize, setFontSize] = useState(16);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMode, setFocusMode] = useState<DisplayFocus>(DisplayFocus.BOTH);
  
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const entry = getLocalTafseer(verse.verse_key);
    setTafseer(entry);
    setDraftText(entry?.text || '');
    setAiInsights(null);
    setSaveStatus('idle');
    
    if (!entry) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [verse.verse_key]);

  useEffect(() => {
    if (!isEditing) return;
    const originalText = tafseer?.text || '';
    if (draftText === originalText && saveStatus !== 'saving') return;

    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);

    setSaveStatus('saving');
    saveTimeoutRef.current = window.setTimeout(() => {
      const entry = saveLocalTafseer(verse.verse_key, draftText);
      setTafseer(entry);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, [draftText, isEditing]);

  const handleAIInsight = async () => {
    setIsAiLoading(true);
    const insights = await getAIInsights(
      verse.text_uthmani, 
      verse.translations?.[0]?.text || "", 
      draftText || "No custom tafseer written yet."
    );
    setAiInsights(insights);
    setIsAiLoading(false);
  };

  const getHeaderStyle = () => {
    switch(theme) {
      case AppTheme.DARK: return 'bg-gray-950 text-white border-b border-gray-800';
      case AppTheme.SEPIA: return 'bg-orange-950 text-orange-50';
      default: return 'bg-emerald-900 text-white';
    }
  };

  const getContentBg = () => {
    switch(theme) {
      case AppTheme.DARK: return 'bg-gray-900 text-gray-100';
      case AppTheme.SEPIA: return 'bg-orange-50 text-orange-900';
      default: return 'bg-white text-gray-900';
    }
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col animate-in slide-in-from-bottom duration-300 ${getContentBg()}`}>
      <div className={`${getHeaderStyle()} p-4 flex flex-col shadow-lg shrink-0 transition-colors duration-500 ${isLandscape ? 'hidden' : ''}`}>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-1 hover:opacity-70">
              <Settings size={20} />
            </button>
            <div className="flex flex-col">
               <h2 className="font-semibold text-sm truncate max-w-[150px]">ئایەتی {verse.verse_key}</h2>
               <span className="text-[10px] opacity-60 uppercase tracking-tighter">
                {isEditing ? 'خەریکی نووسین' : 'پێداچوونەوە'}
               </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center mr-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold animate-pulse">
                  <Loader2 size={10} className="animate-spin" /> پاشکەوت دەکرێت
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <CheckCircle2 size={10} /> پاشکەوت کرا
                </div>
              )}
            </div>

            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-white/10 p-2 rounded-xl hover:bg-white/20 active:scale-95 transition-all"
              >
                <Edit3 size={18} />
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(false)}
                className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
              >
                تەواو
              </button>
            )}
            <button onClick={onClose} className="p-1.5 bg-white/10 rounded-full ml-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
          <button 
            onClick={onPrev}
            className="flex items-center gap-1 text-xs font-bold opacity-80 active:scale-90 transition-all p-1"
          >
            <ChevronRight size={16} /> پێشوو
          </button>
          
          <div className="flex items-center gap-2">
            {isNavigating && <Loader2 size={12} className="animate-spin opacity-60" />}
            <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">گەڕان بۆ ئایەتەکان</span>
          </div>

          <button 
            onClick={onNext}
            className="flex items-center gap-1 text-xs font-bold opacity-80 active:scale-90 transition-all p-1"
          >
            داهاتوو <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {isLandscape && (
        <div className={`p-2 border-b flex items-center justify-between z-30 ${theme === AppTheme.DARK ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-4">
             <button onClick={onClose} className="p-2 text-red-500"><X size={20} /></button>
             <button onClick={onPrev} className="p-2"><ChevronRight size={20} /></button>
             <span className="text-xs font-bold opacity-40">ئایەتی {verse.verse_key}</span>
             <button onClick={onNext} className="p-2"><ChevronLeft size={20} /></button>
          </div>
          <div className="flex items-center gap-4">
            {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin text-emerald-500" />}
            <button onClick={() => setFocusMode(focusMode === DisplayFocus.BOTH ? DisplayFocus.TAFSEER_ONLY : DisplayFocus.BOTH)} className="p-2">
              <LayoutTemplate size={18} />
            </button>
            <button onClick={() => setIsEditing(!isEditing)} className={`px-4 py-1.5 rounded-full text-xs font-bold ${isEditing ? 'bg-emerald-500 text-white' : 'border border-gray-200'}`}>
              {isEditing ? 'پاشکەوت' : 'دەستکاری'}
            </button>
          </div>
        </div>
      )}

      {showSettings && !isLandscape && (
        <div className={`p-4 border-b animate-in fade-in slide-in-from-top-2 duration-200 ${theme === AppTheme.DARK ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">شێوازی پیشاندان</p>
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
                        : theme === AppTheme.DARK ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 border border-gray-100'
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

      <div className={`flex-1 overflow-y-auto p-4 transition-colors duration-500 ${isLandscape ? 'flex flex-row gap-6 p-6 overflow-hidden' : 'space-y-6 pb-24'}`}>
        {(focusMode === DisplayFocus.BOTH || focusMode === DisplayFocus.QURAN_ONLY) && (
          <div className={`${isLandscape ? 'flex-1 overflow-y-auto pl-2' : ''} space-y-4`}>
            <div className={`rounded-3xl p-6 border transition-all duration-500 ${
              theme === AppTheme.DARK ? 'bg-gray-800 border-gray-700 shadow-2xl' : theme === AppTheme.SEPIA ? 'bg-orange-100/50 border-orange-200' : 'bg-emerald-50 border-emerald-100'
            }`}>
              <p className={`arabic-text leading-loose text-right mb-6 ${isLandscape ? 'text-4xl' : 'text-3xl'} ${theme === AppTheme.DARK ? 'text-gray-100' : 'text-gray-950'}`}>
                {verse.text_uthmani}
              </p>
              <p className={`text-base leading-relaxed text-right italic ${theme === AppTheme.DARK ? 'text-gray-400' : 'text-emerald-900/80 font-medium'}`}>
                {verse.translations?.[0]?.text.replace(/<[^>]*>?/gm, '')}
              </p>
            </div>
          </div>
        )}

        {(focusMode === DisplayFocus.BOTH || focusMode === DisplayFocus.TAFSEER_ONLY) && (
          <div className={`${isLandscape ? 'flex-1 overflow-y-auto flex flex-col gap-4' : 'space-y-4'} rounded-3xl`}>
            {!isLandscape && (
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-[10px] flex items-center gap-2 uppercase tracking-widest opacity-40">
                  {isEditing ? <Edit3 size={14} /> : <BookOpen size={14} />}
                  {isEditing ? 'نووسینی تەفسیر' : 'تەفسیری تۆمارکراو'}
                </h3>
              </div>
            )}

            {isEditing ? (
              <div className="relative flex-1">
                <textarea
                  dir="rtl"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="سەرنجەکانت لێرە بنووسە..."
                  className={`w-full h-full p-6 rounded-3xl border-2 transition-all outline-none leading-relaxed shadow-sm resize-none text-right ${
                    theme === AppTheme.DARK 
                      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-emerald-500' 
                      : 'bg-white border-emerald-100 text-gray-800 focus:border-emerald-500'
                  }`}
                  style={{ fontSize: '18px', minHeight: isLandscape ? '100%' : '320px' }}
                  autoFocus
                />
              </div>
            ) : (
              <div 
                style={{ fontSize: `${fontSize + 2}px` }}
                className={`leading-relaxed whitespace-pre-wrap font-medium p-6 border rounded-3xl android-shadow transition-colors duration-500 flex-1 text-right ${
                  theme === AppTheme.DARK ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-100 text-gray-800'
                }`}
              >
                {tafseer?.text || (
                  <div className="flex flex-col items-center justify-center h-full opacity-20 gap-3">
                     <Edit3 size={40} />
                     <p>هیچ تەفسیرێک نەنووسراوە.</p>
                     <button onClick={() => setIsEditing(true)} className="text-xs font-bold uppercase border-b border-current">ئێستا بنووسە</button>
                  </div>
                )}
              </div>
            )}

            <div className={`rounded-3xl p-6 text-white shadow-xl transition-all duration-500 ${
              theme === AppTheme.SEPIA ? 'bg-orange-950' : 'bg-slate-900'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-emerald-400" />
                  <h3 className="font-bold text-sm tracking-wide">سەرنجی زانستی AI</h3>
                </div>
                {!aiInsights && (
                  <button onClick={handleAIInsight} disabled={isAiLoading} className="bg-emerald-500 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase">
                    {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : 'شیکردنەوە'}
                  </button>
                )}
              </div>
              {aiInsights ? <div className="text-xs opacity-90 leading-relaxed prose prose-invert">{aiInsights}</div> : <p className="text-[11px] opacity-60">شیکردنەوەی ئایەتەکە لەڕێی زیرەکی دەستکردەوە.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TafseerOverlay;
