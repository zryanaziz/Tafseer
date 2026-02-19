
import React from 'react';
import { Home, Bookmark, Search, MessageSquare, Menu, ArrowRight } from 'lucide-react';
import { AppScreen, AppTheme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  theme?: AppTheme;
  hideNav?: boolean;
  hideHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeScreen, 
  onNavigate, 
  title,
  showBack,
  onBack,
  theme = AppTheme.EMERALD,
  hideNav = false,
  hideHeader = false
}) => {
  const getHeaderStyle = () => {
    switch(theme) {
      case AppTheme.DARK: return 'bg-gray-950 text-white border-b border-gray-800';
      case AppTheme.SEPIA: return 'bg-orange-950 text-orange-50';
      default: return 'bg-emerald-800 text-white';
    }
  };

  const getNavStyle = () => {
    switch(theme) {
      case AppTheme.DARK: return 'bg-gray-950 border-t border-gray-800';
      case AppTheme.SEPIA: return 'bg-orange-50 border-t border-orange-200';
      default: return 'bg-white border-t border-gray-200';
    }
  };

  const getBgStyle = () => {
    switch(theme) {
      case AppTheme.DARK: return 'bg-gray-900';
      case AppTheme.SEPIA: return 'bg-orange-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className={`flex flex-col h-screen max-w-4xl mx-auto overflow-hidden relative transition-colors duration-500 ${getBgStyle()}`}>
      {!hideHeader && (
        <header className={`${getHeaderStyle()} px-4 py-4 flex items-center justify-between shadow-md z-10 shrink-0`}>
          <div className="flex items-center gap-4">
            {showBack ? (
              <button onClick={onBack} className="p-1 hover:opacity-70 rounded-full transition-all">
                <ArrowRight size={24} />
              </button>
            ) : (
              <button className="p-1">
                <Menu size={24} />
              </button>
            )}
            <h1 className="text-xl font-semibold tracking-tight truncate max-w-[200px]">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate(AppScreen.SEARCH)} className="p-1">
              <Search size={22} />
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto relative ${hideNav ? 'pb-0' : 'pb-20'}`}>
        {children}
      </main>

      {!hideNav && (
        <nav className={`${getNavStyle()} flex justify-around items-center h-16 safe-bottom absolute bottom-0 left-0 right-0 z-20`}>
          <NavItem 
            icon={<Home size={24} />} 
            label="سەرەتا" 
            active={activeScreen === AppScreen.HOME || activeScreen === AppScreen.SURAH_DETAIL} 
            onClick={() => onNavigate(AppScreen.HOME)} 
            theme={theme}
          />
          <NavItem 
            icon={<Bookmark size={24} />} 
            label="نیشانەکراوەکان" 
            active={activeScreen === AppScreen.BOOKMARKS} 
            onClick={() => onNavigate(AppScreen.BOOKMARKS)} 
            theme={theme}
          />
          <NavItem 
            icon={<MessageSquare size={24} />} 
            label="یاریدەدەری زیرەک" 
            active={activeScreen === AppScreen.AI_CHAT} 
            onClick={() => onNavigate(AppScreen.AI_CHAT)} 
            theme={theme}
          />
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, theme: AppTheme }> = ({ icon, label, active, onClick, theme }) => {
  const getActiveColor = () => {
    switch(theme) {
      case AppTheme.DARK: return active ? 'text-emerald-400' : 'text-gray-500';
      case AppTheme.SEPIA: return active ? 'text-orange-900' : 'text-orange-300';
      default: return active ? 'text-emerald-700' : 'text-gray-500';
    }
  };

  const getActiveBg = () => {
    if (!active) return '';
    switch(theme) {
      case AppTheme.DARK: return 'bg-gray-800';
      case AppTheme.SEPIA: return 'bg-orange-200';
      default: return 'bg-emerald-50';
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full transition-all ${getActiveColor()}`}
    >
      <div className={`p-1 rounded-xl transition-all ${getActiveBg()}`}>
        {icon}
      </div>
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
};

export default Layout;
