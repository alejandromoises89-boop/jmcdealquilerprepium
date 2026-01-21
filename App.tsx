
import React, { useState, useEffect, useCallback } from 'react';
import { User, Vehicle, Reservation, Gasto, Breakdown } from './types';
import { INITIAL_FLOTA } from './constants';
import { fetchBrlToPyg } from './services/exchangeService';
import { fetchReservationsFromSheet, saveReservationToSheet } from './services/googleSheetService';
import Navbar from './components/Navbar';
import VehicleGrid from './components/VehicleGrid';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import LocationSection from './components/LocationSection';
import SupportForm from './components/SupportForm';
import { RefreshCw, CheckCircle, ShieldCheck, Gem, Lock, BellRing, X, Landmark, AlertTriangle } from 'lucide-react';

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
  const [lastSyncSuccess, setLastSyncSuccess] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const pushNotification = useCallback((notif: AppNotification) => {
    setAppNotifications(prev => {
      if (prev.find(p => p.id === notif.id)) return prev;
      return [notif, ...prev];
    });
  }, []);

  const checkFleetStatus = useCallback((currentFlota: Vehicle[]) => {
    const today = new Date();
    const fifteenDaysLater = new Date();
    fifteenDaysLater.setDate(today.getDate() + 15);

    currentFlota.forEach(v => {
      const mntDate = parseDate(v.mantenimientoVence || "");
      const segDate = parseDate(v.seguroVence || "");

      if (mntDate) {
        if (mntDate < today) {
          pushNotification({
            id: `mnt-expired-${v.id}`,
            type: 'critical',
            title: `MANTENIMIENTO VENCIDO: ${v.placa}`,
            message: `La unidad ${v.nombre} requiere atención inmediata.`,
            actionUrl: `https://wa.me/595993471667?text=ALERTA:%20Mantenimiento%20VENCIDO%20Unidad%20${v.placa}`
          });
        } else if (mntDate < fifteenDaysLater) {
          pushNotification({
            id: `mnt-warn-${v.id}`,
            type: 'maintenance',
            title: `Mantenimiento Próximo: ${v.placa}`,
            message: `Vence el ${v.mantenimientoVence}. Agendar revisión.`,
          });
        }
      }

      if (segDate) {
        if (segDate < today) {
          pushNotification({
            id: `seg-expired-${v.id}`,
            type: 'critical',
            title: `SEGURO VENCIDO: ${v.placa}`,
            message: `Unidad ${v.nombre} sin cobertura activa. Bloquear unidad.`,
            actionUrl: `https://wa.me/595991681191?text=URGENTE:%20Seguro%20VENCIDO%20Unidad%20${v.placa}`
          });
        } else if (segDate < fifteenDaysLater) {
          pushNotification({
            id: `seg-warn-${v.id}`,
            type: 'maintenance',
            title: `Seguro por Vencer: ${v.placa}`,
            message: `Renovación necesaria para el ${v.seguroVence}.`,
          });
        }
      }
    });
  }, [pushNotification]);

  useEffect(() => {
    fetchBrlToPyg().then(setExchangeRate);
    
    const savedUser = localStorage.getItem('jm_session_user');
    const savedAdminLock = localStorage.getItem('jm_admin_unlocked');
    const savedRes = localStorage.getItem('jm_reservations');
    const savedGastos = localStorage.getItem('jm_gastos');
    const savedBreakdowns = localStorage.getItem('jm_breakdowns');
    const savedFlota = localStorage.getItem('jm_flota');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedAdminLock === 'true') setIsAdminUnlocked(true);
    if (savedRes) setReservations(JSON.parse(savedRes));
    if (savedGastos) setGastos(JSON.parse(savedGastos));
    if (savedBreakdowns) setBreakdowns(JSON.parse(savedBreakdowns));
    
    if (savedFlota) {
      const parsedFlota = JSON.parse(savedFlota);
      setFlota(parsedFlota);
      checkFleetStatus(parsedFlota);
    } else {
      checkFleetStatus(INITIAL_FLOTA);
    }

    syncDataFromSheet();
  }, [checkFleetStatus]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('jm_session_user', JSON.stringify(userData));
    pushNotification({ id: 'welcome', type: 'system', title: 'Acceso VIP JM', message: `Bienvenido Director ${userData.name}.` });
    checkFleetStatus(flota);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdminUnlocked(false);
    localStorage.removeItem('jm_session_user');
    localStorage.removeItem('jm_admin_unlocked');
  };

  const syncDataFromSheet = async () => {
    setIsSyncing(true);
    try {
      const sheetReservations = await fetchReservationsFromSheet();
      if (sheetReservations) {
        setReservations(prev => {
          const merged = [...sheetReservations, ...prev];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          localStorage.setItem('jm_reservations', JSON.stringify(unique));
          return unique;
        });
      }
      setLastSyncSuccess(true);
      setLastSyncTime(new Date().toLocaleTimeString());
      setTimeout(() => setLastSyncSuccess(false), 3000);
    } catch (err) {
      console.error("Sync error", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePinSubmit = () => {
    if (pinValue === "8899") {
      setIsAdminUnlocked(true);
      localStorage.setItem('jm_admin_unlocked', 'true');
      setShowPinPrompt(false);
      setActiveTab('admin');
      setPinValue("");
    } else {
      alert("PIN incorrecto");
      setPinValue("");
    }
  };

  const handleAddReservation = async (res: Reservation) => {
    const updated = [res, ...reservations];
    setReservations(updated);
    localStorage.setItem('jm_reservations', JSON.stringify(updated));
    
    // Intento de guardado en la nube inmediato para nuevas reservas
    await saveReservationToSheet(res);
    pushNotification({
      id: `new-res-${res.id}`,
      type: 'booking',
      title: 'Reserva Enviada',
      message: `Solicitud de ${res.cliente} registrada en la nube.`
    });
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

      {/* Enhanced Toasts */}
      <div className="fixed top-28 right-6 z-[120] flex flex-col gap-4 max-w-sm w-full">
        {appNotifications.map(n => (
          <div key={n.id} className={`bg-white/95 backdrop-blur-md shadow-2xl border rounded-[2rem] p-6 animate-slideDown flex flex-col gap-4 overflow-hidden relative ${n.type === 'critical' ? 'border-red-200' : 'border-bordeaux-100'}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${n.type === 'critical' ? 'bg-red-600' : n.type === 'maintenance' ? 'bg-orange-500' : 'bg-gold'}`}></div>
            <div className="flex gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'critical' ? 'bg-red-50 text-red-600' : 'bg-bordeaux-50 text-bordeaux-800'}`}>
                {n.type === 'critical' ? <AlertTriangle size={18} /> : <BellRing size={18} />}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-bordeaux-950 uppercase tracking-tight">{n.title}</h4>
                <p className="text-[10px] text-gray-500 font-medium">{n.message}</p>
              </div>
              <button onClick={() => setAppNotifications(prev => prev.filter(x => x.id !== n.id))} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
            </div>
            {n.actionUrl && (
              <button 
                onClick={() => window.open(n.actionUrl, '_blank')}
                className="w-full py-2 bg-bordeaux-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-bordeaux-950 transition-all flex items-center justify-center gap-2"
              >
                Ejecutar Reporte WhatsApp
              </button>
            )}
          </div>
        ))}
      </div>

      {showPinPrompt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-bordeaux-950/90 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center space-y-8 animate-slideUp">
            <div className="w-16 h-16 bg-bordeaux-50 rounded-full flex items-center justify-center mx-auto text-bordeaux-800"><Lock size={32} /></div>
            <h3 className="text-2xl font-serif font-bold text-bordeaux-950">Acceso Privado</h3>
            <input type="password" maxLength={4} value={pinValue} onChange={(e) => setPinValue(e.target.value)} placeholder="****" className="w-full bg-gray-50 border-0 rounded-2xl py-5 text-center text-3xl font-black tracking-[1em] outline-none focus:ring-2 focus:ring-bordeaux-800" autoFocus />
            <button onClick={handlePinSubmit} className="w-full bg-bordeaux-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Confirmar</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10 pb-40">
        {activeTab === 'reservas' && (
          <VehicleGrid flota={flota} exchangeRate={exchangeRate} reservations={reservations} onAddReservation={handleAddReservation} />
        )}
        {activeTab === 'ubicacion' && <LocationSection />}
        {activeTab === 'asistencia' && <SupportForm flota={flota} onSubmit={(b) => {
          const n = [...breakdowns, b];
          setBreakdowns(n);
          localStorage.setItem('jm_breakdowns', JSON.stringify(n));
          alert("Reporte enviado");
        }} />}
        {activeTab === 'admin' && isAdminUnlocked && (
          <AdminPanel 
            flota={flota} setFlota={(f) => { setFlota(f); localStorage.setItem('jm_flota', JSON.stringify(f)); }}
            reservations={reservations} setReservations={(r) => { setReservations(r); localStorage.setItem('jm_reservations', JSON.stringify(r)); }}
            gastos={gastos} setGastos={(g) => { setGastos(g); localStorage.setItem('jm_gastos', JSON.stringify(g)); }}
            exchangeRate={exchangeRate} onSyncSheet={syncDataFromSheet} isSyncing={isSyncing} breakdowns={breakdowns}
          />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-bordeaux-950 text-white py-6 px-12 border-t border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Landmark size={20} className="text-gold" />
          <span className="text-sm font-bold">1 R$ = <span className="text-gold">{exchangeRate.toLocaleString()} Gs.</span></span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-30">JM ASOCIADOS CORPORATE &copy; 2026</p>
      </div>
    </div>
  );
};

export default App;
