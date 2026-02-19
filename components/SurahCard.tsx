
import React from 'react';
import { Surah, AppTheme } from '../types';

interface SurahCardProps {
  surah: Surah;
  theme: AppTheme;
  onClick: (surah: Surah) => void;
}

const SurahCard: React.FC<SurahCardProps> = ({ surah, theme, onClick }) => {
  const getCardStyle = () => {
    switch(theme) {
      case AppTheme.DARK: return 'bg-gray-800 border-gray-700 hover:border-emerald-500/50';
      case AppTheme.SEPIA: return 'bg-orange-100/50 border-orange-200 hover:border-orange-400';
      default: return 'bg-white border-gray-100 hover:border-emerald-200';
    }
  };

  const getTextColor = () => theme === AppTheme.DARK ? 'text-gray-100' : 'text-gray-800';
  const getSubTextColor = () => theme === AppTheme.DARK ? 'text-gray-400' : 'text-gray-500';

  return (
    <div 
      onClick={() => onClick(surah)}
      className={`${getCardStyle()} mx-4 my-2 p-4 rounded-2xl flex items-center justify-between border transition-all active:scale-[0.98] cursor-pointer android-shadow`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border -rotate-45 ${
          theme === AppTheme.DARK ? 'bg-gray-700 border-gray-600' : 'bg-emerald-50 border-emerald-100'
        }`}>
          <span className={`${theme === AppTheme.DARK ? 'text-emerald-400' : 'text-emerald-700'} font-bold rotate-45 text-sm`}>{surah.id}</span>
        </div>
        <div className="text-right">
          <h3 className={`font-semibold ${getTextColor()}`}>{surah.name_simple}</h3>
          <p className={`text-[10px] uppercase tracking-wider ${getSubTextColor()}`}>
            {surah.revelation_place === 'makkah' ? 'مەککی' : 'مەدەنی'} • {surah.verses_count} ئایەت
          </p>
        </div>
      </div>
      <div className="text-left">
        <span className={`noto-arabic text-xl font-bold ${
          theme === AppTheme.DARK ? 'text-emerald-400' : 'text-emerald-800'
        }`}>{surah.name_arabic}</span>
        <p className="text-[10px] text-gray-400 mt-1">{surah.translated_name.name}</p>
      </div>
    </div>
  );
};

export default SurahCard;
