
import React from 'react';
import { Home, Bookmark, Search, Menu, ArrowRight } from 'lucide-react';
import { AppScreen, AppTheme, AccentColor } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  theme?: AppTheme;
  accentColor?: AccentColor;
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
  theme = '#f0f4f2',
  accentColor = AccentColor.EMERALD,
  hideNav = false,
  hideHeader = false
}) => {
  const isDarkTheme = theme.startsWith('#0') || theme.startsWith('#1') || theme.startsWith('#2');

  const getHeaderStyle = () => {
    return `backdrop-blur-lg border-b ${isDarkTheme ? 'bg-black/60 text-[#e1e3df] border-[#404943]' : 'bg-white/60 text-[#191c1a] border-[#dce5dd]'}`;
  };

  const getNavStyle = () => {
    return `backdrop-blur-lg border-t ${isDarkTheme ? 'bg-black/60 border-[#404943]' : 'bg-white/60 border-[#dce5dd]'}`;
  };

  return (
    <div className={`flex flex-col h-screen w-full overflow-hidden relative select-none`}>
      {/* Top App Bar */}
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
          <h1 className="text-xl font-medium tracking-tight truncate flex-1 text-center">
            {activeScreen === AppScreen.SURAH_DETAIL ? "خوێندنەوە" : title}
          </h1>
          <div className="flex items-center gap-1">
            <button onClick={() => onNavigate(AppScreen.SEARCH)} className="p-2 rounded-full active:bg-black/10 transition-colors">
              <Search size={24} />
            </button>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth ${hideNav ? 'pb-safe' : 'pb-24'}`}>
        {children}
      </main>

      {/* Navigation Bar */}
      {!hideNav && (
        <nav className={`${getNavStyle()} flex justify-around items-center h-20 pb-safe absolute bottom-0 left-0 right-0 z-30 px-2`}>
          <NavItem 
            icon={<Home size={24} />} 
            label="سەرەتا" 
            active={activeScreen === AppScreen.HOME || activeScreen === AppScreen.SURAH_DETAIL} 
            onClick={() => onNavigate(AppScreen.HOME)} 
            theme={theme}
            accentColor={accentColor}
          />
          <NavItem 
            icon={<Bookmark size={24} />} 
            label="نیشانە" 
            active={activeScreen === AppScreen.BOOKMARKS} 
            onClick={() => onNavigate(AppScreen.BOOKMARKS)} 
            theme={theme}
            accentColor={accentColor}
          />
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void, theme: AppTheme, accentColor: AccentColor }> = ({ icon, label, active, onClick, theme, accentColor }) => {
  const isDark = theme.startsWith('#0') || theme.startsWith('#1') || theme.startsWith('#2');
  
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full transition-all group`}
    >
      <div 
        className={`relative px-5 py-1 rounded-full transition-all duration-300 ${
          active 
            ? (isDark ? 'bg-white/10' : 'bg-black/5') 
            : 'text-gray-500 hover:bg-gray-100/50'
        }`}
        style={{ color: active ? accentColor : undefined }}
      >
        {icon}
      </div>
      <span className={`text-xs mt-1 font-medium tracking-tight ${active ? 'text-inherit font-bold' : 'text-gray-500'}`}>
        {label}
      </span>
    </button>
  );
};

export default Layout;
