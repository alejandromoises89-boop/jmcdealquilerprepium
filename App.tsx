
import React, { useState, useEffect } from 'react';
import { User, Vehicle, Reservation, Gasto, Breakdown } from './types';
import { INITIAL_FLOTA } from './constants';
import { fetchBrlToPyg } from './services/exchangeService';
import { fetchReservationsFromSheet } from './services/googleSheetService';
import Navbar from './components/Navbar';
import VehicleGrid from './components/VehicleGrid';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import LocationSection from './components/LocationSection';
import SupportForm from './components/SupportForm';
import { RefreshCw, CheckCircle, ShieldCheck, Gem, Lock, BellRing, X } from 'lucide-react';

interface AppNotification {
  id: string;
  type: 'maintenance' | 'booking' | 'system';
  title: string;
  message: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'reservas' | 'ubicacion' | 'asistencia' | 'admin'>('reservas');
  const [flota, setFlota] = useState<Vehicle[]>(INITIAL_FLOTA);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1450);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");

  // Sistema de Notificaciones JM
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    fetchBrlToPyg().then(setExchangeRate);
    
    const savedRes = localStorage.getItem('jm_reservations');
    const savedGastos = localStorage.getItem('jm_gastos');
    const savedBreakdowns = localStorage.getItem('jm_breakdowns');
    const savedFlota = localStorage.getItem('jm_flota');

    if (savedRes) setReservations(JSON.parse(savedRes));
    if (savedGastos) setGastos(JSON.parse(savedGastos));
    if (savedBreakdowns) setBreakdowns(JSON.parse(savedBreakdowns));
    if (savedFlota) setFlota(JSON.parse(savedFlota));
    else setFlota(INITIAL_FLOTA);

    syncDataFromSheet();
  }, []);

  // Alertas Automáticas de Mantenimiento al iniciar (Admin)
  useEffect(() => {
    if (user?.isAdmin) {
      const now = new Date();
      const tenDaysAway = new Date();
      tenDaysAway.setDate(now.getDate() + 10);

      flota.forEach(v => {
        if (v.mantenimientoVence) {
          const [d, m, y] = v.mantenimientoVence.split('/').map(Number);
          const vent = new Date(y, m - 1, d);
          if (vent <= tenDaysAway) {
            pushNotification({
              id: `mnt-${v.id}`,
              type: 'maintenance',
              title: `Alerta: ${v.nombre}`,
              message: `Mantenimiento vence el ${v.mantenimientoVence}. Favor agendar revisión técnica.`
            });
          }
        }
      });
    }
  }, [user, flota]);

  const pushNotification = (notif: AppNotification) => {
    setAppNotifications(prev => {
      if (prev.find(p => p.id === notif.id)) return prev;
      return [notif, ...prev];
    });
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
      setTimeout(() => setLastSyncSuccess(false), 4000);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUser({
        name: "Director JM",
        email: "dirección@jmasociados.com",
        picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        isAdmin: true
      });
      setIsAuthenticating(false);
      pushNotification({
        id: 'welcome',
        type: 'system',
        title: 'Acceso Autorizado',
        message: 'Bienvenido al panel ejecutivo JM Asociados.'
      });
    }, 1200);
  };

  const handleReportBreakdown = (b: Breakdown) => {
    const updated = [...breakdowns, b];
    setBreakdowns(updated);
    localStorage.setItem('jm_breakdowns', JSON.stringify(updated));
    pushNotification({
      id: b.id,
      type: 'system',
      title: 'Incidente Reportado',
      message: `El reporte para ${b.vehicleName} ha sido enviado a mantenimiento.`
    });
    alert("Reporte enviado al centro técnico JM Asociados. Un operador se comunicará con usted.");
    setActiveTab('reservas');
  };

  const handlePinSubmit = () => {
    if (pinValue === "8899") {
      setIsAdminUnlocked(true);
      setShowPinPrompt(false);
      setActiveTab('admin');
      setPinValue("");
      pushNotification({
        id: 'admin-unlocked',
        type: 'system',
        title: 'Modo Maestro',
        message: 'Panel administrativo desbloqueado con éxito.'
      });
    } else {
      alert("PIN incorrecto.");
      setPinValue("");
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} isLoading={isAuthenticating} />;
  }

  return (
    <div className="min-h-screen bg-white selection:bg-bordeaux-800 selection:text-white overflow-x-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-bordeaux-800 rounded-full blur-[200px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-gold rounded-full blur-[200px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <Navbar 
        activeTab={activeTab as any} 
        setActiveTab={(tab) => {
          if (tab === 'admin' && !isAdminUnlocked) setShowPinPrompt(true);
          else setActiveTab(tab as any);
        }} 
        user={user} 
        isAdminUnlocked={isAdminUnlocked}
        onLogout={() => { setUser(null); setIsAdminUnlocked(false); }} 
      />
      
      {/* Sistema de Toasts JM Asociados */}
      <div className="fixed top-28 right-6 z-[120] flex flex-col gap-4 max-w-sm w-full">
        {appNotifications.map(n => (
          <div key={n.id} className="bg-white/95 backdrop-blur shadow-[0_30px_60px_-15px_rgba(128,0,0,0.3)] border border-bordeaux-100 rounded-[2rem] p-6 animate-slideDown flex gap-5 relative overflow-hidden group">
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${n.type === 'maintenance' ? 'bg-orange-500' : n.type === 'booking' ? 'bg-gold' : 'bg-bordeaux-800'}`}></div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${n.type === 'maintenance' ? 'bg-orange-50 text-orange-600' : 'bg-bordeaux-50 text-bordeaux-800'}`}>
              <BellRing size={20} />
            </div>
            <div className="space-y-1">
               <h4 className="text-sm font-black text-bordeaux-950 uppercase tracking-tight">{n.title}</h4>
               <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{n.message}</p>
            </div>
            <button onClick={() => setAppNotifications(prev => prev.filter(x => x.id !== n.id))} className="absolute top-4 right-4 text-gray-300 hover:text-red-600 transition-colors">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 w-[90%] md:w-auto">
        {isSyncing && (
          <div className="bg-bordeaux-950 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center justify-center gap-4 animate-bounce border border-white/10">
            <RefreshCw size={18} className="text-gold animate-spin" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Sincronizando...</span>
          </div>
        )}
        {lastSyncSuccess && !isSyncing && (
          <div className="bg-green-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center justify-center gap-4 animate-slideDown border border-green-400">
            <CheckCircle size={18} />
            <span className="text-xs font-black uppercase tracking-[0.2em]">DB Actualizada ({lastSyncTime})</span>
          </div>
        )}
      </div>

      {showPinPrompt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-bordeaux-950/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center space-y-8 animate-slideUp">
            <div className="w-16 h-16 bg-bordeaux-50 rounded-full flex items-center justify-center mx-auto text-bordeaux-800"><Lock size={32} /></div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-bordeaux-950">Acceso Privado</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ingrese PIN Administrativo</p>
            </div>
            <input type="password" maxLength={4} value={pinValue} onChange={(e) => setPinValue(e.target.value)} placeholder="****" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 text-center text-3xl font-black tracking-[1em] outline-none focus:ring-2 focus:ring-bordeaux-800" autoFocus />
            <div className="flex gap-4">
              <button onClick={() => setShowPinPrompt(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-gray-400">Cerrar</button>
              <button onClick={handlePinSubmit} className="flex-1 bg-bordeaux-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16 pb-40 relative z-10">
        {activeTab === 'reservas' && (
          <div className="space-y-20 animate-fadeIn">
            <div className="text-center space-y-6 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-bordeaux-50 rounded-full text-bordeaux-800 text-[10px] font-black uppercase tracking-[0.4em] mb-4"><Gem size={14} /> Colección Corporativa 2026</div>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-bordeaux-950 leading-tight tracking-tight">Flota Premium <span className="italic text-gold block">JM Asociados</span></h2>
            </div>
            <VehicleGrid flota={flota} exchangeRate={exchangeRate} reservations={reservations} onAddReservation={(res) => { 
              const n = [...reservations, res]; 
              setReservations(n); 
              localStorage.setItem('jm_reservations', JSON.stringify(n)); 
              pushNotification({
                id: res.id,
                type: 'booking',
                title: 'Reserva Registrada',
                message: `Nueva reserva confirmada para ${res.auto}. Documentación enviada a ${res.email}.`
              });
            }} />
          </div>
        )}

        {activeTab === 'ubicacion' && <LocationSection />}
        
        {activeTab === 'asistencia' && <SupportForm flota={flota} onSubmit={handleReportBreakdown} />}

        {activeTab === 'admin' && isAdminUnlocked && (
          <AdminPanel flota={flota} setFlota={setFlota} reservations={reservations} setReservations={setReservations} gastos={gastos} setGastos={setGastos} exchangeRate={exchangeRate} onSyncSheet={syncDataFromSheet} isSyncing={isSyncing} breakdowns={breakdowns} />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-[60]">
        <div className="bg-bordeaux-950 text-white py-6 px-12 flex justify-between items-center border-t border-white/10 shadow-2xl">
          <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-4">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/40">Market Live</span>
                <span className="text-sm font-bold">1 R$ = <span className="text-gold">{exchangeRate.toLocaleString()} Gs.</span></span>
              </div>
            </div>
          </div>
          <p className="text-[10px] uppercase font-black tracking-[0.5em] text-white/30">JM ASOCIADOS &copy; 2026</p>
        </div>
      </div>
    </div>
  );
};

export default App;
