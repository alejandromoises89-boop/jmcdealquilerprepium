
import React, { useState, useEffect } from 'react';
import { 
  Language, TRANSLATIONS, APP_VERSION
} from '../constants';
import { 
  LayoutDashboard, MapPin, ShieldCheck, LogOut, 
  Lock, MessageCircleWarning, Menu, X, 
  Sun, Moon, TrendingUp, Bell
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
  alertCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isAdminUnlocked, onLogout, darkMode, toggleDarkMode, language, setLanguage, exchangeRate = 1550, alertCount = 0 }) => {
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
        ? 'py-4 bg-white/90 dark:bg-bordeaux-950/90 backdrop-blur-3xl shadow-2xl border-b border-gray-100 dark:border-white/5' 
        : 'py-8 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-10">
        <div className="flex justify-between items-center h-20">
          
          <div className="flex items-center gap-6 cursor-pointer group" onClick={() => setActiveTab('reservas')}>
            <div className="relative p-3 rounded-[1.5rem] bg-white dark:bg-bordeaux-900 border border-gold/30 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-2">
              <img src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" alt="JM Logo" className="h-12 w-auto object-contain" />
            </div>
            <div className="hidden lg:flex flex-col">
              <h1 className="text-2xl font-brand text-bordeaux-950 dark:text-white leading-none tracking-tight">
                JM <span className="text-gold italic">Asociados</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-2 bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                  <TrendingUp size={11} className="text-gold" />
                  <span className="text-[9px] font-black text-gold uppercase tracking-widest italic">DNIT: 1 R$ = {exchangeRate} Gs.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-gray-50/50 dark:bg-bordeaux-900/50 backdrop-blur-xl p-2 rounded-full border border-gray-100 dark:border-white/5">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-4 px-8 py-4 rounded-full transition-all duration-500 ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-bordeaux-800'
                }`}>
                {activeTab === tab.id && <div className="absolute inset-0 bordeaux-gradient rounded-full shadow-2xl animate-fadeIn"></div>}
                <div className="relative z-10 flex items-center gap-3">
                  <tab.icon size={15} className={activeTab === tab.id ? 'text-gold' : ''} />
                  <span className="tracking-wide-label text-[10px]">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-4 bg-gray-50 dark:bg-bordeaux-900 rounded-2xl text-bordeaux-800 dark:text-gold border dark:border-white/5 hover:scale-110 transition-all gold-glow">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAdminUnlocked && (
              <button onClick={onLogout} className="hidden md:flex p-4 text-gray-300 hover:text-red-600 transition-all rounded-2xl bg-white dark:bg-bordeaux-900 border dark:border-white/5">
                <LogOut size={18} />
              </button>
            )}

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-4 bg-bordeaux-950 rounded-2xl text-gold active:scale-90">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute inset-x-0 top-full mt-4 px-8 animate-slideUp">
          <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-3xl rounded-[3rem] border-2 border-gold/20 shadow-2xl p-8 space-y-8">
              <div className="bg-gold/5 p-6 rounded-[2rem] border border-gold/20 text-center">
                 <p className="tracking-wide-label text-gray-400 mb-2">DNIT Paraguay</p>
                 <p className="text-xl font-robust text-bordeaux-950 dark:text-white italic">1 R$ = {exchangeRate} Gs.</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                    className={`flex items-center gap-6 p-6 rounded-3xl border transition-all ${
                      activeTab === tab.id 
                        ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-2xl' 
                        : 'bg-gray-50 dark:bg-dark-elevated text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5'
                    }`}>
                    <tab.icon size={22} className={activeTab === tab.id ? 'text-gold' : ''} />
                    <span className="tracking-wide-label text-xs">{tab.label}</span>
                  </button>
                ))}
              </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
