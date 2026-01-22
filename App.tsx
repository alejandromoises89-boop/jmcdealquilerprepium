
import React, { useState, useEffect, useCallback } from 'react';
import { User, Vehicle, Reservation, Gasto, Breakdown } from './types';
import { INITIAL_FLOTA, FILTER_DATE_START } from './constants';
import { fetchBrlToPyg } from './services/exchangeService';
import { fetchReservationsFromSheet, saveReservationToSheet } from './services/googleSheetService';
import Navbar from './components/Navbar';
import VehicleGrid from './components/VehicleGrid';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import LocationSection from './components/LocationSection';
import SupportForm from './components/SupportForm';
import { RefreshCw, BellRing, X, Landmark, Lock } from 'lucide-react';

interface AppNotification {
  id: string;
  type: 'maintenance' | 'booking' | 'system' | 'critical';
  title: string;
  message: string;
  actionUrl?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'reservas' | 'ubicacion' | 'asistencia' | 'admin'>('reservas');
  const [flota, setFlota] = useState<Vehicle[]>(INITIAL_FLOTA);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1450);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split(' ')[0].split(/[/-]/);
    if (parts.length !== 3) return null;
    
    let d, m, y;
    if (parts[0].length === 4) { y = parseInt(parts[0]); m = parseInt(parts[1]) - 1; d = parseInt(parts[2]); }
    else { d = parseInt(parts[0]); m = parseInt(parts[1]) - 1; y = parseInt(parts[2]); }
    if (y < 100) y += 2000;
    return new Date(y, m, d);
  };

  const pushNotification = useCallback((notif: AppNotification) => {
    setAppNotifications(prev => {
      if (prev.find(p => p.id === notif.id)) return prev;
      return [notif, ...prev];
    });
  }, []);

  const syncDataFromSheet = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const sheetReservations = await fetchReservationsFromSheet();
      if (sheetReservations) {
        const filteredSheetData = sheetReservations.filter(res => {
          const resDate = parseDate(res.inicio);
          return resDate && resDate >= FILTER_DATE_START;
        });

        setReservations(prev => {
          const merged = [...filteredSheetData, ...prev];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          localStorage.setItem('jm_reservations', JSON.stringify(unique));
          return unique;
        });
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Sync error", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchBrlToPyg().then(setExchangeRate);
    
    const savedUser = localStorage.getItem('jm_session_user');
    const savedAdminLock = localStorage.getItem('jm_admin_unlocked');
    const savedRes = localStorage.getItem('jm_reservations');
    const savedFlota = localStorage.getItem('jm_flota');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedAdminLock === 'true') setIsAdminUnlocked(true);
    if (savedRes) setReservations(JSON.parse(savedRes));
    if (savedFlota) setFlota(JSON.parse(savedFlota));

    syncDataFromSheet();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('jm_session_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdminUnlocked(false);
    localStorage.removeItem('jm_session_user');
    localStorage.removeItem('jm_admin_unlocked');
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

  const handleAddReservation = async (res: Reservation) => {
    const updated = [res, ...reservations];
    setReservations(updated);
    localStorage.setItem('jm_reservations', JSON.stringify(updated));
    await saveReservationToSheet(res);
  };

  if (!user) return <Login onLogin={handleLogin} isLoading={false} />;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-bordeaux-800 selection:text-white">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'admin' && !isAdminUnlocked) setShowPinPrompt(true);
          else setActiveTab(tab);
        }} 
        user={user} 
        isAdminUnlocked={isAdminUnlocked}
        onLogout={handleLogout} 
      />

      <div className="fixed top-28 right-6 z-[120] flex flex-col gap-4 max-w-sm w-full">
        {appNotifications.map(n => (
          <div key={n.id} className="bg-white/95 backdrop-blur-md shadow-2xl border border-bordeaux-100 rounded-[2rem] p-6 flex flex-col gap-4 relative">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${n.type === 'critical' ? 'bg-red-600' : 'bg-gold'}`}></div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-bordeaux-50 rounded-xl flex items-center justify-center shrink-0 text-bordeaux-800"><BellRing size={18} /></div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-bordeaux-950 uppercase tracking-tight">{n.title}</h4>
                <p className="text-[10px] text-gray-500 font-medium">{n.message}</p>
              </div>
              <button onClick={() => setAppNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
            </div>
          </div>
        ))}
        
        {isSyncing && (
          <div className="bg-bordeaux-950 text-white p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
            <RefreshCw className="animate-spin text-gold" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando con la Nube...</span>
          </div>
        )}
      </div>

      {showPinPrompt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-bordeaux-950/90 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center space-y-8 animate-slideUp">
            <div className="w-16 h-16 bg-bordeaux-50 rounded-full flex items-center justify-center mx-auto text-bordeaux-800"><Lock size={32} /></div>
            <h3 className="text-2xl font-serif font-bold text-bordeaux-950">Acceso Maestro</h3>
            <input type="password" maxLength={4} value={pinValue} onChange={(e) => setPinValue(e.target.value)} placeholder="****" className="w-full bg-gray-50 border-0 rounded-2xl py-5 text-center text-3xl font-black tracking-[1em] outline-none focus:ring-2 focus:ring-bordeaux-800" autoFocus />
            <button onClick={handlePinSubmit} className="w-full bg-bordeaux-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Confirmar PIN</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-40">
        {activeTab === 'reservas' && <VehicleGrid flota={flota} exchangeRate={exchangeRate} reservations={reservations} onAddReservation={handleAddReservation} />}
        {activeTab === 'ubicacion' && <LocationSection />}
        {activeTab === 'asistencia' && <SupportForm flota={flota} onSubmit={(b) => alert("Reporte enviado")} />}
        {activeTab === 'admin' && isAdminUnlocked && (
          <AdminPanel 
            flota={flota} setFlota={(f) => { setFlota(f); localStorage.setItem('jm_flota', JSON.stringify(f)); }}
            reservations={reservations} setReservations={(r) => { setReservations(r); localStorage.setItem('jm_reservations', JSON.stringify(r)); }}
            gastos={gastos} setGastos={setGastos} exchangeRate={exchangeRate} onSyncSheet={syncDataFromSheet} isSyncing={isSyncing} breakdowns={breakdowns}
          />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-bordeaux-950 text-white py-6 px-12 border-t border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Landmark size={20} className="text-gold" />
          <span className="text-sm font-bold">1 R$ = <span className="text-gold">{exchangeRate.toLocaleString()} Gs.</span></span>
          {lastSyncTime && <span className="text-[10px] opacity-40 ml-4">Sinc: {lastSyncTime}</span>}
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">JM ASOCIADOS CORPORATE &copy; 2026</p>
      </div>
    </div>
  );
};

export default App;
