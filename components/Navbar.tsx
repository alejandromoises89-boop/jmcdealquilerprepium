
import React, { useState } from 'react';
import { User } from '../types';
import { LayoutDashboard, MapPin, ShieldCheck, LogOut, Lock, MessageCircleWarning, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeTab: 'reservas' | 'ubicacion' | 'asistencia' | 'admin';
  setActiveTab: (tab: 'reservas' | 'ubicacion' | 'asistencia' | 'admin') => void;
  user: User;
  isAdminUnlocked: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, user, isAdminUnlocked, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'reservas', label: 'Flota', icon: LayoutDashboard },
    { id: 'ubicacion', label: 'Sede', icon: MapPin },
    { id: 'asistencia', label: 'Asistencia', icon: MessageCircleWarning },
    { id: 'admin', label: 'Gestión', icon: isAdminUnlocked ? ShieldCheck : Lock }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header Desktop & Mobile Logo Row */}
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center cursor-pointer group" onClick={() => { setActiveTab('reservas'); setIsMobileMenuOpen(false); }}>
            <div className="bg-white p-2 rounded-2xl border border-gray-50 shadow-sm transition-all duration-500 group-hover:scale-105">
              <img 
                src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" 
                alt="JM Logo" 
                className="h-14 md:h-16 w-auto object-contain" 
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center bg-gray-50/80 p-1.5 rounded-[2rem] border border-gray-100 my-auto shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all duration-500 ${
                  activeTab === tab.id 
                  ? 'bg-bordeaux-800 text-white shadow-lg transform scale-105' 
                  : 'text-gray-500 hover:text-bordeaux-800 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={16} strokeWidth={2.5} />
                <span className="text-xs font-bold tracking-wide uppercase">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* User & Mobile Toggle */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-full border border-gray-100 shadow-sm">
              <div className="relative">
                <img src={user.picture} alt="Avatar" className="h-10 w-10 rounded-full border-2 border-white shadow-md object-cover" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isAdminUnlocked ? 'bg-green-500' : 'bg-gold'}`}></div>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-0.5">{isAdminUnlocked ? 'Master' : 'Cliente'}</span>
                <span className="text-xs font-bold text-bordeaux-950 truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-3 bg-gray-50 rounded-2xl text-bordeaux-800 border border-gray-100"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <button onClick={onLogout} className="hidden md:flex p-3 text-gray-300 hover:text-red-600 transition-colors duration-300 rounded-2xl hover:bg-red-50 border border-transparent hover:border-red-100">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Expanded - Debajo del Logo */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-gray-50 animate-fadeIn">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {tabs.map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all ${
                    activeTab === tab.id 
                    ? 'bg-bordeaux-800 text-white border-bordeaux-800 shadow-xl' 
                    : 'bg-white text-gray-400 border-gray-100'
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={onLogout}
              className="w-full py-5 bg-red-50 text-red-600 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-red-100"
            >
              <LogOut size={18} /> Finalizar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
