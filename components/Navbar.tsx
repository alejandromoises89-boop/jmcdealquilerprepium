
import React from 'react';
import { User } from '../types';
import { LayoutDashboard, MapPin, ShieldCheck, LogOut, Menu, Lock } from 'lucide-react';

interface NavbarProps {
  activeTab: 'reservas' | 'ubicacion' | 'admin';
  setActiveTab: (tab: 'reservas' | 'ubicacion' | 'admin') => void;
  user: User;
  isAdminUnlocked: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, user, isAdminUnlocked, onLogout }) => {
  return (
    <nav className="sticky top-0 z-50 glass-morphism border-b border-gray-100/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between h-24">
          {/* Logo Section */}
          <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => setActiveTab('reservas')}>
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-50 group-hover:shadow-md transition-all duration-500">
              <img 
                src="https://i.ibb.co/PzsvxYrM/JM-Asociados-Logotipo-02.png" 
                alt="JM Logo" 
                className="h-10 w-auto"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-serif font-bold text-bordeaux-800 tracking-tight leading-none">JM ASOCIADOS</h1>
              <p className="text-[9px] tracking-[0.3em] text-gold uppercase font-bold mt-1">Premium Mobility</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center bg-gray-50/50 p-1.5 rounded-[2rem] border border-gray-100 my-auto">
            <button
              onClick={() => setActiveTab('reservas')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all duration-500 ${
                activeTab === 'reservas' 
                ? 'bg-bordeaux-800 text-white shadow-xl scale-105' 
                : 'text-gray-500 hover:text-bordeaux-800'
              }`}
            >
              <LayoutDashboard size={18} />
              <span className="text-sm font-bold tracking-wide">Reservas</span>
            </button>
            <button
              onClick={() => setActiveTab('ubicacion')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all duration-500 ${
                activeTab === 'ubicacion' 
                ? 'bg-bordeaux-800 text-white shadow-xl scale-105' 
                : 'text-gray-500 hover:text-bordeaux-800'
              }`}
            >
              <MapPin size={18} />
              <span className="text-sm font-bold tracking-wide">Sede</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all duration-500 ${
                activeTab === 'admin' 
                ? 'bg-bordeaux-800 text-white shadow-xl scale-105' 
                : isAdminUnlocked ? 'text-gray-500 hover:text-bordeaux-800' : 'text-gray-200 hover:text-gray-300'
              }`}
            >
              {isAdminUnlocked ? <ShieldCheck size={18} /> : <Lock size={18} />}
              <span className="text-sm font-bold tracking-wide">Gestión</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={user.picture} 
                alt="Avatar" 
                className="h-11 w-11 rounded-2xl border-2 border-bordeaux-100 shadow-sm object-cover" 
              />
              {isAdminUnlocked && <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full flex items-center justify-center border-2 border-white shadow-sm"><ShieldCheck size={8} className="text-white" /></div>}
            </div>
            <button 
              onClick={onLogout}
              className="p-2.5 text-gray-300 hover:text-red-600 transition-colors duration-300 rounded-xl hover:bg-red-50"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-[2.5rem] p-2 flex justify-around">
        <button 
          onClick={() => setActiveTab('reservas')}
          className={`flex-1 py-4 flex flex-col items-center transition-all duration-500 rounded-3xl ${activeTab === 'reservas' ? 'bg-bordeaux-800 text-white shadow-lg' : 'text-gray-400'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Flota</span>
        </button>
        <button 
          onClick={() => setActiveTab('ubicacion')}
          className={`flex-1 py-4 flex flex-col items-center transition-all duration-500 rounded-3xl ${activeTab === 'ubicacion' ? 'bg-bordeaux-800 text-white shadow-lg' : 'text-gray-400'}`}
        >
          <MapPin size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Sede</span>
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-4 flex flex-col items-center transition-all duration-500 rounded-3xl ${activeTab === 'admin' ? 'bg-bordeaux-800 text-white shadow-lg' : 'text-gray-400'}`}
        >
          {isAdminUnlocked ? <ShieldCheck size={20} /> : <Lock size={20} />}
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Gestión</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
