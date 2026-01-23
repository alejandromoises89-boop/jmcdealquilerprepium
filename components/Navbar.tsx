
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { 
  LayoutDashboard, MapPin, ShieldCheck, LogOut, 
  Lock, MessageCircleWarning, Menu, X, ChevronDown, 
  Crown, Shield, Bell, Sparkles, User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'reservas' | 'ubicacion' | 'asistencia' | 'admin';
  setActiveTab: (tab: 'reservas' | 'ubicacion' | 'asistencia' | 'admin') => void;
  user: User;
  isAdminUnlocked: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, user, isAdminUnlocked, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'reservas', label: 'Flota VIP', icon: LayoutDashboard },
    { id: 'ubicacion', label: 'Sede CDE', icon: MapPin },
    { id: 'asistencia', label: 'Seguridad', icon: MessageCircleWarning },
    { id: 'admin', label: 'Gestión', icon: isAdminUnlocked ? ShieldCheck : Lock }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
      scrolled 
        ? 'py-3 bg-white/95 backdrop-blur-3xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] border-b border-gray-100' 
        : 'py-8 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Brand Identity - Premium Unification */}
          <div 
            className="flex items-center gap-4 cursor-pointer group" 
            onClick={() => { setActiveTab('reservas'); setIsMobileMenuOpen(false); }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gold/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className={`relative p-2.5 rounded-2xl md:rounded-[1.75rem] border transition-all duration-700 ${
                scrolled ? 'bg-white border-gold/20 shadow-lg' : 'bg-white/90 border-white/50 shadow-2xl'
              } group-hover:scale-105 group-hover:border-gold/50`}>
                <img 
                  src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" 
                  alt="JM Logo" 
                  className="h-10 md:h-12 w-auto object-contain" 
                />
              </div>
            </div>
            <div className="hidden lg:flex flex-col">
              <h1 className="text-xl md:text-2xl font-serif font-black text-bordeaux-950 leading-none flex items-center gap-2">
                JM <span className="text-gold">ASOCIADOS</span>
                <Crown size={14} className="text-gold fill-gold animate-pulse" />
              </h1>
              <span className="text-[8px] font-black text-gold/80 uppercase tracking-[0.6em] mt-1.5 leading-none">Platinum Fleet Services</span>
            </div>
          </div>

          {/* Premium Desktop Navigation Bar */}
          <div className="hidden md:flex items-center bg-gray-50/40 backdrop-blur-md p-1.5 rounded-full border border-gray-100 shadow-inner">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center gap-3 px-7 py-3.5 rounded-full transition-all duration-500 group/btn overflow-hidden ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-bordeaux-800'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bordeaux-gradient rounded-full shadow-[0_5px_15px_-5px_rgba(128,0,0,0.4)]"></div>
                  )}
                  <div className="relative z-10 flex items-center gap-3">
                    <tab.icon size={16} className={`${isActive ? 'text-gold' : 'group-hover/btn:text-gold/60 transition-colors'}`} />
                    <span className="text-[10px] font-black tracking-[0.15em] uppercase">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* User Controls & Profile Section */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className={`flex items-center gap-4 pl-1.5 pr-5 py-1.5 rounded-full border transition-all duration-500 group/profile cursor-pointer ${
                scrolled 
                ? 'bg-white border-gray-100 shadow-sm' 
                : 'bg-white/80 backdrop-blur-md border-white/50 shadow-xl'
            } hover:border-gold/30`}>
              <div className="relative">
                <div className="absolute inset-0 bg-gold/10 blur-md rounded-full"></div>
                <img 
                  src={user.picture} 
                  alt="Socio" 
                  className="relative z-10 h-10 w-10 md:h-11 md:w-11 rounded-full border-2 border-white shadow-md object-cover" 
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white z-20 shadow-sm ${isAdminUnlocked ? 'bg-green-500' : 'bg-gold'}`}></div>
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="text-[7px] font-black uppercase text-gold tracking-[0.2em] leading-none mb-1">
                  {isAdminUnlocked ? 'Protocolo Activo' : 'Socio Platinum'}
                </span>
                <span className="text-[13px] font-black text-bordeaux-950 truncate max-w-[120px] leading-none">
                  {user.name}
                </span>
              </div>
              <ChevronDown size={14} className="text-gray-300 group-hover/profile:text-gold transition-all" />
            </div>

            <button 
              onClick={onLogout} 
              className="hidden md:flex p-4 text-gray-300 hover:text-white transition-all duration-500 rounded-2xl bg-white border border-gray-100 hover:bg-bordeaux-800 hover:border-bordeaux-900 shadow-sm active:scale-90"
              title="Finalizar Conexión"
            >
              <LogOut size={18} />
            </button>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-4 bg-bordeaux-950 rounded-2xl text-gold border border-bordeaux-900 shadow-xl active:scale-90 transition-all"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overly */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[100%] mt-4 px-6 animate-slideUp">
            <div className="bg-white/98 backdrop-blur-3xl rounded-[3rem] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] p-8 space-y-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none">
                  <Sparkles size={180} className="text-gold" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 relative z-10">
                {tabs.map(tab => (
                    <button 
                      key={tab.id} 
                      onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                      className={`flex flex-col items-center justify-center gap-4 p-7 rounded-[2.5rem] border transition-all duration-500 ${
                          activeTab === tab.id 
                          ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-2xl scale-105' 
                          : 'bg-gray-50/50 text-gray-400 border-gray-100 hover:border-gold/20'
                      }`}
                    >
                      <div className={`p-4 rounded-2xl ${activeTab === tab.id ? 'bg-gold/10 text-gold shadow-inner' : 'bg-white shadow-sm'}`}>
                          <tab.icon size={22} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                    </button>
                ))}
                </div>
                
                <button 
                    onClick={onLogout}
                    className="relative z-10 w-full py-7 bordeaux-gradient text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
                >
                    <LogOut size={18} /> Cerrar Nodo Seguro
                </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
      `}</style>
    </nav>
  );
};

export default Navbar;
