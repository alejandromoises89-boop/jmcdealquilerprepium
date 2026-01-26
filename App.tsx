
import React, { useState, useEffect, useCallback } from 'react';
import { Vehicle, Reservation, Gasto, Breakdown } from './types';
import { INITIAL_FLOTA, FILTER_DATE_START, Language, TRANSLATIONS } from './constants';
import { fetchBrlToPyg } from './services/exchangeService';
import { fetchReservationsFromSheet, saveReservationToSheet } from './services/googleSheetService';
import Navbar from './components/Navbar';
import VehicleGrid from './components/VehicleGrid';
import AdminPanel from './components/AdminPanel';
import LocationSection from './components/LocationSection';
import SupportForm from './components/SupportForm';
import { RefreshCw, BellRing, X, Landmark, Lock, MapPin, Phone, MessageCircle, ShieldCheck, Loader2 } from 'lucide-react';

interface AppNotification {
  id: string;
  type: 'maintenance' | 'booking' | 'system' | 'critical';
  title: string;
  message: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reservas' | 'ubicacion' | 'asistencia' | 'admin'>('reservas');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('jm_theme') === 'dark');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('jm_lang') as Language) || 'es');
  const [showContactModal, setShowContactModal] = useState(false);
  
  const [flota, setFlota] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('jm_flota');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_FLOTA; }
    }
    return INITIAL_FLOTA;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('jm_reservations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [exchangeRate, setExchangeRate] = useState<number>(1550);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => localStorage.getItem('jm_admin_unlocked') === 'true');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    localStorage.setItem('jm_flota', JSON.stringify(flota));
    localStorage.setItem('jm_reservations', JSON.stringify(reservations));
    localStorage.setItem('jm_lang', language);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('jm_theme', darkMode ? 'dark' : 'light');
  }, [flota, reservations, language, darkMode]);

  const syncDataFromSheet = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const cloudRes = await fetchReservationsFromSheet();
      if (cloudRes) {
        setReservations(prevLocal => {
          const localOnly = prevLocal.filter(r => !r.id.startsWith('CLOUD-R98-'));
          const combined = [...cloudRes, ...localOnly];
          const uniqueMap = new Map();
          combined.forEach(item => {
            const key = `${item.cliente}-${item.auto}-${item.inicio}`.toLowerCase().replace(/\s+/g, '');
            if (!uniqueMap.has(key)) uniqueMap.set(key, item);
          });
          return Array.from(uniqueMap.values());
        });
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchBrlToPyg().then(setExchangeRate);
    syncDataFromSheet();
    const interval = setInterval(syncDataFromSheet, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setIsAdminUnlocked(false);
    localStorage.removeItem('jm_admin_unlocked');
    setActiveTab('reservas');
  };

  const handlePinSubmit = () => {
    if (pinValue === "2026") {
      setIsAdminUnlocked(true);
      setShowPinPrompt(false);
      setPinValue("");
      localStorage.setItem('jm_admin_unlocked', 'true');
      setActiveTab('admin');
    } else {
      alert("PIN Incorrecto");
      setPinValue("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-base dark:text-gray-100 transition-colors duration-300 font-sans">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'admin' && !isAdminUnlocked) setShowPinPrompt(true);
          else setActiveTab(tab);
        }} 
        isAdminUnlocked={isAdminUnlocked}
        onLogout={handleLogout}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        language={language}
        setLanguage={setLanguage}
        onShowContact={() => setShowContactModal(true)}
      />

      {isSyncing && (
        <div className="fixed top-28 right-6 z-[130] flex items-center gap-4 bg-white/95 dark:bg-dark-card/95 text-bordeaux-950 px-6 py-3 rounded-2xl shadow-xl border border-gold/20">
          <Loader2 className="animate-spin text-gold" size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest">Sincronizando Nube</span>
        </div>
      )}

      {showPinPrompt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-dark-base/95 backdrop-blur-xl">
          <div className="bg-white dark:bg-dark-card rounded-[3.5rem] p-10 w-full max-w-sm text-center space-y-8 animate-slideUp border-4 border-gold/20 shadow-2xl">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto text-gold"><Lock size={32} /></div>
            <input 
              type="password" 
              value={pinValue} 
              onChange={(e) => setPinValue(e.target.value)} 
              placeholder="PIN Maestro" 
              className="w-full bg-gray-50 dark:bg-dark-base dark:text-gold border-0 rounded-2xl py-4 text-center text-2xl font-black" 
            />
            <button onClick={handlePinSubmit} className="w-full bordeaux-gradient text-white py-5 rounded-2xl font-robust text-[11px] uppercase tracking-widest shadow-xl">Autenticar</button>
            <button onClick={() => setShowPinPrompt(false)} className="text-[9px] font-black text-gray-400 uppercase">Cancelar</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-40">
        {activeTab === 'reservas' && <VehicleGrid flota={flota} exchangeRate={exchangeRate} reservations={reservations} onAddReservation={res => setReservations([res, ...reservations])} language={language} />}
        {activeTab === 'ubicacion' && <LocationSection />}
        {activeTab === 'asistencia' && <SupportForm flota={flota} onSubmit={() => alert("Asistencia enviada.")} />}
        {activeTab === 'admin' && isAdminUnlocked && <AdminPanel flota={flota} setFlota={setFlota} reservations={reservations} setReservations={setReservations} onDeleteReservation={id => setReservations(reservations.filter(r => r.id !== id))} gastos={[]} setGastos={()=>{}} exchangeRate={exchangeRate} onSyncSheet={syncDataFromSheet} isSyncing={isSyncing} breakdowns={[]} setBreakdowns={()=>{}} />}
      </main>
    </div>
  );
};

export default App;
