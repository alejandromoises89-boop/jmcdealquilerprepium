
import React, { useState, useEffect } from 'react';
import { 
  Language, TRANSLATIONS, APP_VERSION
} from '../constants';
import { 
  LayoutDashboard, MapPin, ShieldCheck, LogOut, 
  Lock, MessageCircleWarning, Menu, X, 
  Sun, Moon, TrendingUp
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
  exchangeRate?: number;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isAdminUnlocked, onLogout, darkMode, toggleDarkMode, language, setLanguage, exchangeRate = 1550 }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
              <h1 className="text-xl font-robust text-bordeaux-950 dark:text-white leading-none flex items-center gap-2 italic">
                JM <span className="text-gold uppercase tracking-tighter not-italic">Asociados</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5 bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
                  <TrendingUp size={10} className="text-gold" />
                  <span className="text-[8px] font-black text-gold uppercase tracking-widest">DNIT: 1 R$ = {exchangeRate} Gs.</span>
                </div>
              </div>
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
          <div className="bg-white dark:bg-dark-card rounded-[2.5rem] border-2 border-bordeaux-800/10 dark:border-gold/20 shadow-2xl p-6 space-y-6">
              <div className="bg-gold/5 p-4 rounded-2xl border border-gold/20 text-center">
                 <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Cotización DNIT Paraguay</p>
                 <p className="text-sm font-robust text-bordeaux-950 dark:text-white uppercase italic">1 R$ = {exchangeRate} Gs.</p>
              </div>
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
              {isAdminUnlocked && (
                <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} 
                  className="w-full flex items-center justify-center gap-3 py-4 bg-red-600/10 text-red-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
