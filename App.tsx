
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
  // Enhanced User Session Initialization
  const [user, setUser] = useState<User | null>(() => {
    const savedPersistent = localStorage.getItem('jm_session_user');
    if (savedPersistent) {
      try {
        return JSON.parse(savedPersistent);
      } catch (e) {
        localStorage.removeItem('jm_session_user');
      }
    }
    
    const savedSession = sessionStorage.getItem('jm_session_user');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        sessionStorage.removeItem('jm_session_user');
      }
    }
    
    return null;
  });
  
  const [activeTab, setActiveTab] = useState<'reservas' | 'ubicacion' | 'asistencia' | 'admin'>('reservas');
  
  const [flota, setFlota] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('jm_flota');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FLOTA;
      } catch (e) {
        return INITIAL_FLOTA;
      }
    }
    return INITIAL_FLOTA;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('jm_reservations');
    if (saved) {
      try {
        const parsed: Reservation[] = JSON.parse(saved);
        return parsed.filter(res => {
          const resDate = parseDate(res.inicio);
          return resDate && resDate >= FILTER_DATE_START && res.includeInCalendar !== false;
        });
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1550);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    return localStorage.getItem('jm_admin_unlocked') === 'true';
  });

  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);

  function parseDate(dateStr: string) {
    if (!dateStr) return null;
    const parts = dateStr.split(' ')[0].split(/[/-]/);
    if (parts.length !== 3) return null;
    
    let d, m, y;
    if (parts[0].length === 4) { // YYYY-MM-DD
      y = parseInt(parts[0]);
      m = parseInt(parts[1]) - 1;
      d = parseInt(parts[2]);
    } else { // DD-MM-YYYY
      d = parseInt(parts[0]);
      m = parseInt(parts[1]) - 1;
      y = parseInt(parts[2]);
      if (y < 100) y += 2000;
    }
    return new Date(y, m, d);
  }

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
        setReservations(prev => {
          const allReservations = [...sheetReservations, ...prev];
          const uniqueMap = new Map();
          allReservations.forEach(item => uniqueMap.set(item.id, item));
          const uniqueArray = Array.from(uniqueMap.values());

          const finalFilteredSet = uniqueArray.filter(res => {
            const resDate = parseDate(res.inicio);
            const isPost2026 = resDate && resDate >= FILTER_DATE_START;
            const isCalendarVisible = res.includeInCalendar !== false;
            return isPost2026 && isCalendarVisible;
          });

          localStorage.setItem('jm_reservations', JSON.stringify(finalFilteredSet));
          return finalFilteredSet;
        });
        setLastSyncTime(new Date().toLocaleTimeString());
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
    if (!flota || flota.length === 0) {
      setFlota(INITIAL_FLOTA);
      localStorage.setItem('jm_flota', JSON.stringify(INITIAL_FLOTA));
    }
  }, []);

  /**
   * Refactored Login Logic
   * Handles storage of user data based on "remember me" preference.
   */
  const handleLogin = (userData: User, remember: boolean) => {
    setUser(userData);
    
    // Clear any previous conflicting session data
    localStorage.removeItem('jm_session_user');
    sessionStorage.removeItem('jm_session_user');

    if (remember) {
      localStorage.setItem('jm_session_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('jm_session_user', JSON.stringify(userData));
    }
  };

  /**
   * Refactored Logout Logic
   * Ensures all sensitive session data is cleared from both storage engines.
   */
  const handleLogout = useCallback(() => {
    // 1. Reset Component States
    setUser(null);
    setIsAdminUnlocked(false);
    setActiveTab('reservas');
    setPinValue("");
    setShowPinPrompt(false);
    setAppNotifications([]);
    
    // 2. Clear Persistent Storage
    localStorage.removeItem('jm_session_user');
    localStorage.removeItem('jm_admin_unlocked');
    
    // 3. Clear Session-only Storage
    sessionStorage.removeItem('jm_session_user');
    sessionStorage.clear(); // Safety clear for any other session data
  }, []);

  const handlePinSubmit = () => {
    if (pinValue === "2026") {
      setIsAdminUnlocked(true);
      setShowPinPrompt(false);
      setPinValue("");
      localStorage.setItem('jm_admin_unlocked', 'true');
      setActiveTab('admin');
    } else {
      alert("PIN de Seguridad Incorrecto");
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

      {/* Notifications and Syncing Overlay */}
      <div className="fixed top-28 right-6 z-[120] flex flex-col gap-4 max-w-sm w-full">
        {appNotifications.map(n => (
          <div key={n.id} className="bg-white/95 backdrop-blur-md shadow-2xl border border-bordeaux-100 rounded-[2rem] p-6 flex flex-col gap-4 relative animate-slideUp">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${n.type === 'critical' ? 'bg-red-600' : 'bg-gold'}`}></div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-bordeaux-50 rounded-xl flex items-center justify-center shrink-0 text-bordeaux-800">
                <BellRing size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-bordeaux-950 uppercase tracking-tight">{n.title}</h4>
                <p className="text-[10px] text-gray-500 font-medium">{n.message}</p>
              </div>
              <button onClick={() => setAppNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {isSyncing && (
          <div className="bg-bordeaux-950 text-white p-4 rounded-2xl flex items-center gap-4 shadow-2xl animate-pulse self-end mr-4">
            <RefreshCw className="animate-spin text-gold" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando JM Cloud...</span>
          </div>
        )}
      </div>

      {showPinPrompt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-bordeaux-950/90 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center space-y-8 animate-slideUp shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
            <div className="w-16 h-16 bg-bordeaux-50 rounded-full flex items-center justify-center mx-auto text-bordeaux-800">
              <Lock size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-bordeaux-950">Acceso Maestro</h3>
              <p className="text-[10px] font-black text-gold uppercase tracking-widest">Introduzca el código de seguridad</p>
            </div>
            <input 
              type="password" 
              maxLength={4} 
              value={pinValue} 
              onChange={(e) => setPinValue(e.target.value)} 
              placeholder="****" 
              className="w-full bg-gray-50 border-0 rounded-2xl py-5 text-center text-3xl font-black tracking-[1em] outline-none focus:ring-4 focus:ring-bordeaux-50 transition-all" 
              autoFocus 
            />
            <div className="flex gap-3">
              <button 
                onClick={handlePinSubmit} 
                className="flex-1 bordeaux-gradient text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                Confirmar
              </button>
              <button 
                onClick={() => setShowPinPrompt(false)} 
                className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-40">
        {activeTab === 'reservas' && (
          <VehicleGrid 
            flota={flota} 
            exchangeRate={exchangeRate} 
            reservations={reservations} 
            onAddReservation={handleAddReservation} 
          />
        )}
        {activeTab === 'ubicacion' && <LocationSection />}
        {activeTab === 'asistencia' && (
          <SupportForm 
            flota={flota} 
            onSubmit={(b) => {
              pushNotification({
                id: Math.random().toString(),
                type: 'critical',
                title: 'Reporte Enviado',
                message: 'La central de asistencia JM ha recibido su reporte. Un agente le contactará.'
              });
            }} 
          />
        )}
        {activeTab === 'admin' && isAdminUnlocked && (
          <AdminPanel 
            flota={flota} 
            setFlota={(f) => { setFlota(f); localStorage.setItem('jm_flota', JSON.stringify(f)); }}
            reservations={reservations} 
            setReservations={(r) => { setReservations(r); localStorage.setItem('jm_reservations', JSON.stringify(r)); }}
            gastos={gastos} 
            setGastos={setGastos} 
            exchangeRate={exchangeRate} 
            onSyncSheet={syncDataFromSheet} 
            isSyncing={isSyncing} 
            breakdowns={breakdowns}
          />
        )}
      </main>

      {/* Corporate Footer Overlay */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-bordeaux-950 text-white py-6 px-12 border-t border-white/10 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            < Landmark size={20} className="text-gold" />
            <span className="text-sm font-bold tracking-tight">1 R$ = <span className="text-gold">{exchangeRate.toLocaleString()} Gs.</span></span>
          </div>
          <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
          {lastSyncTime && (
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest opacity-40">
              Sincronizado: {lastSyncTime}
            </span>
          )}
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">JM ASOCIADOS &copy; 2026 | SECURITY V4.0</p>
      </div>
    </div>
  );
};

export default App;
