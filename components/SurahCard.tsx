
import React from 'react';
import { Surah, AppTheme, AccentColor } from '../types';

interface SurahCardProps {
  surah: Surah;
  theme: AppTheme;
  accentColor?: AccentColor;
  onClick: (surah: Surah) => void;
}

const SurahCard: React.FC<SurahCardProps> = ({ surah, theme, accentColor = AccentColor.EMERALD, onClick }) => {
  const isDark = theme === AppTheme.DARK || theme === AppTheme.NIGHT;
  const isSepia = theme === AppTheme.SEPIA;

  const getCardBg = () => {
    if (isDark) return 'bg-[#212622]/40 text-[#e1e3df] backdrop-blur-sm border border-white/5';
    if (isSepia) return 'bg-[#fdf3e7]/40 text-[#504538] backdrop-blur-sm border border-black/5';
    return 'bg-white/40 text-[#191c1a] backdrop-blur-sm border border-white/20';
  };

  return (
    <div 
      onClick={() => onClick(surah)}
      className={`${getCardBg()} mx-4 my-2 p-4 rounded-[28px] flex items-center justify-between transition-all active:scale-[0.97] cursor-pointer`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center font-bold text-lg ${
          isDark ? 'bg-[#3b4b41] text-[#9cf4c6]' : 'bg-[#cce8d9] text-[#002114]'
        }`}>
          {surah.id}
        </div>
        <div className="text-right">
          <h3 className="font-bold text-lg leading-tight">{surah.name_simple}</h3>
          <p className="text-xs opacity-70 mt-0.5">
            {surah.revelation_place === 'makkah' ? 'مەککی' : 'مەدەنی'} • {surah.verses_count} ئایەت
          </p>
        </div>
      </div>
      <div className="text-left flex flex-col items-end">
        <span className="noto-arabic text-2xl font-bold" style={{ color: accentColor }}>{surah.name_arabic}</span>
        <p className="text-[10px] opacity-50 mt-1 uppercase tracking-wider">{surah.translated_name.name}</p>
      </div>
    </div>
  );
};

export default SurahCard;
