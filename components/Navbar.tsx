
import React, { useState, useEffect } from 'react';
import { 
  Language, TRANSLATIONS
} from '../constants';
import { 
  LayoutDashboard, MapPin, ShieldCheck, LogOut, 
  Lock, MessageCircleWarning, Menu, X, 
  Crown, Sun, Moon,
  PhoneCall, Globe
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'reservas' | 'ubicacion' | 'asistencia' | 'admin';
  setActiveTab: (tab: 'reservas' | 'ubicacion' | 'asistencia' | 'admin') => void;
  isAdminUnlocked: boolean;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onShowContact?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isAdminUnlocked, onLogout, darkMode, toggleDarkMode, language, setLanguage, onShowContact }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'reservas', label: t.fleet, icon: LayoutDashboard },
    { id: 'ubicacion', label: t.office, icon: MapPin },
    { id: 'asistencia', label: t.security, icon: MessageCircleWarning },
    { id: 'admin', label: t.management, icon: isAdminUnlocked ? ShieldCheck : Lock }
  ];

  const langs = [
    { id: 'es', label: 'ESP', flag: '🇪🇸' },
    { id: 'pt', label: 'POR', flag: '🇧🇷' },
    { id: 'en', label: 'ENG', flag: '🇺🇸' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
      scrolled 
        ? 'py-3 bg-white/95 dark:bg-bordeaux-950/95 backdrop-blur-3xl shadow-xl border-b border-gray-100 dark:border-white/5' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('reservas')}>
            <div className="relative p-2 rounded-2xl bg-white dark:bg-bordeaux-900 border border-gold/20 shadow-lg transition-transform group-hover:scale-110">
              <img src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" alt="JM Logo" className="h-10 w-auto object-contain" />
            </div>
            <div className="hidden lg:flex flex-col">
              <h1 className="text-xl font-serif font-black text-bordeaux-950 dark:text-white leading-none flex items-center gap-2">
                JM <span className="text-gold uppercase tracking-tighter">Asociados</span>
                <Crown size={14} className="text-gold animate-pulse" />
              </h1>
              <span className="text-[7px] font-black text-gold/80 uppercase tracking-[0.5em] mt-1">Platinum Fleet</span>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-gray-50/40 dark:bg-bordeaux-900/40 backdrop-blur-md p-1.5 rounded-full border border-gray-100 dark:border-white/5">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-bordeaux-800 dark:hover:text-gold'
                }`}>
                {activeTab === tab.id && <div className="absolute inset-0 bordeaux-gradient rounded-full shadow-lg"></div>}
                <div className="relative z-10 flex items-center gap-2">
                  <tab.icon size={14} className={activeTab === tab.id ? 'text-gold' : ''} />
                  <span className="text-[9px] font-black tracking-widest uppercase">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 p-3.5 bg-gray-50 dark:bg-bordeaux-900 rounded-2xl text-bordeaux-800 dark:text-gold border dark:border-white/5 hover:scale-110 transition-all">
                <Globe size={16} />
                <span className="hidden lg:block text-[8px] font-black">{language.toUpperCase()}</span>
              </button>
              {showLangMenu && (
                <div className="absolute top-full right-0 mt-3 w-32 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border dark:border-gold/10 overflow-hidden animate-slideUp">
                   {langs.map(l => (
                     <button key={l.id} onClick={() => { setLanguage(l.id as Language); setShowLangMenu(false); }}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-[9px] font-black uppercase hover:bg-gold/10 ${language === l.id ? 'text-gold bg-gold/5' : 'text-gray-400'}`}>
                       <span>{l.flag}</span> {l.label}
                     </button>
                   ))}
                </div>
              )}
            </div>

            <button onClick={toggleDarkMode} className="p-3.5 bg-gray-50 dark:bg-bordeaux-900 rounded-2xl text-bordeaux-800 dark:text-gold border dark:border-white/5 hover:scale-110 transition-all">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {isAdminUnlocked && (
              <button onClick={onLogout} className="hidden md:flex p-3.5 text-gray-300 hover:text-red-600 transition-all rounded-2xl bg-white dark:bg-bordeaux-900 border dark:border-white/5 shadow-sm">
                <LogOut size={16} />
              </button>
            )}

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-3.5 bg-bordeaux-950 rounded-2xl text-gold active:scale-90">
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute inset-x-0 top-full mt-2 px-6 animate-slideUp">
          {/* bg-white y dark:bg-dark-card son colores sólidos sin transparencia ni desenfoque */}
          <div className="bg-white dark:bg-dark-card rounded-[2.5rem] border-2 border-bordeaux-800/10 dark:border-gold/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all ${
                      activeTab === tab.id 
                        ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-xl' 
                        : 'bg-gray-50 dark:bg-dark-elevated text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5'
                    }`}>
                    <tab.icon size={20} className={activeTab === tab.id ? 'text-gold' : ''} />
                    <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-dark-base rounded-[1.5rem]">
                 {langs.map(l => (
                   <button key={l.id} onClick={() => { setLanguage(l.id as Language); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${language === l.id ? 'bg-gold text-dark-base' : 'text-gray-400'}`}>
                     <span className="text-lg">{l.flag}</span>
                     <span className="text-[7px] font-black">{l.label}</span>
                   </button>
                 ))}
              </div>
              {isAdminUnlocked && (
                <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} 
                  className="w-full flex items-center justify-center gap-3 py-4 bg-red-600/10 text-red-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                  <LogOut size={16} /> Cerrar Sesión Maestra
                </button>
              )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
