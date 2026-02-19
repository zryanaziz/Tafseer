
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
      case AppTheme.DARK: return 'bg-[#191c1a] text-[#e1e3df] border-b border-[#404943]';
      case AppTheme.SEPIA: return 'bg-[#fdf3e7] text-[#504538] border-b border-[#e9ddd0]';
      default: return 'bg-[#fbfdf9] text-[#191c1a] border-b border-[#dce5dd]';
    }
  };

  const getNavStyle = () => {
    switch(theme) {
      case AppTheme.DARK: return 'bg-[#191c1a] border-t border-[#404943]';
      case AppTheme.SEPIA: return 'bg-[#fdf3e7] border-t border-[#e9ddd0]';
      default: return 'bg-[#fbfdf9] border-t border-[#dce5dd]';
    }
  };

  return (
    <div className={`flex flex-col h-screen w-full overflow-hidden relative select-none`}>
      {/* Top App Bar - MD3 Center Aligned Style */}
      {!hideHeader && (
        <header className={`${getHeaderStyle()} pt-safe px-4 py-3 flex items-center justify-between z-20 shrink-0`}>
          <div className="flex items-center gap-3">
            {showBack ? (
              <button onClick={onBack} className="p-2 rounded-full active:bg-black/10 transition-colors">
                <ArrowRight size={24} />
              </button>
            ) : (
              <button className="p-2 rounded-full active:bg-black/10 transition-colors">
                <Menu size={24} />
              </button>
            )}
          </div>
          <h1 className="text-xl font-medium tracking-tight truncate flex-1 text-center">{title}</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => onNavigate(AppScreen.SEARCH)} className="p-2 rounded-full active:bg-black/10 transition-colors">
              <Search size={24} />
            </button>
          </div>
        </header>
      )}

      {/* Main Content with Native Scrolling */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth ${hideNav ? 'pb-safe' : 'pb-24'}`}>
        {children}
      </main>

      {/* Navigation Bar - MD3 Style with active indicator pill */}
      {!hideNav && (
        <nav className={`${getNavStyle()} flex justify-around items-center h-20 pb-safe absolute bottom-0 left-0 right-0 z-30 px-2`}>
          <NavItem 
            icon={<Home size={24} />} 
            label="سەرەتا" 
            active={activeScreen === AppScreen.HOME || activeScreen === AppScreen.SURAH_DETAIL} 
            onClick={() => onNavigate(AppScreen.HOME)} 
            theme={theme}
          />
          <NavItem 
            icon={<Bookmark size={24} />} 
            label="نیشانە" 
            active={activeScreen === AppScreen.BOOKMARKS} 
            onClick={() => onNavigate(AppScreen.BOOKMARKS)} 
            theme={theme}
          />
          <NavItem 
            icon={<MessageSquare size={24} />} 
            label="ژیری" 
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
  const isDark = theme === AppTheme.DARK;
  
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full transition-all group`}
    >
      <div className={`relative px-5 py-1 rounded-full transition-all duration-300 ${
        active 
          ? (isDark ? 'bg-[#3b4b41] text-[#9cf4c6]' : 'bg-[#cce8d9] text-[#002114]') 
          : 'text-gray-500 hover:bg-gray-100'
      }`}>
        {icon}
      </div>
      <span className={`text-xs mt-1 font-medium tracking-tight ${active ? 'text-inherit font-bold' : 'text-gray-500'}`}>
        {label}
      </span>
    </button>
  );
};

export default Layout;
