
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
import { RefreshCw, CheckCircle, ShieldCheck, Gem, Smartphone, Monitor, AlertCircle, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'reservas' | 'ubicacion' | 'admin'>('reservas');
  const [flota, setFlota] = useState<Vehicle[]>(INITIAL_FLOTA);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1450);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  
  // Nuevo estado para control de PIN
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");

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

  const syncDataFromSheet = async () => {
    setIsSyncing(true);
    setLastSyncSuccess(false);
    setSyncError(null);

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
      setSyncError("Error de conexión con la base de datos externa.");
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
    }, 1200);
  };

  const saveReservations = (newRes: Reservation[]) => {
    setReservations(newRes);
    localStorage.setItem('jm_reservations', JSON.stringify(newRes));
  };

  const saveGastos = (newGastos: Gasto[]) => {
    setGastos(newGastos);
    localStorage.setItem('jm_gastos', JSON.stringify(newGastos));
  };

  const updateFlota = (newFlota: Vehicle[]) => {
    setFlota(newFlota);
    localStorage.setItem('jm_flota', JSON.stringify(newFlota));
  };

  const handlePinSubmit = () => {
    if (pinValue === "8899") {
      setIsAdminUnlocked(true);
      setShowPinPrompt(false);
      setActiveTab('admin');
      setPinValue("");
    } else {
      alert("PIN incorrecto. Acceso denegado.");
      setPinValue("");
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} isLoading={isAuthenticating} />;
  }

  return (
    <div className="min-h-screen bg-white selection:bg-bordeaux-800 selection:text-white overflow-x-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] md:w-[1000px] h-[300px] md:h-[1000px] bg-bordeaux-800 rounded-full blur-[100px] md:blur-[200px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[250px] md:w-[800px] h-[250px] md:h-[800px] bg-gold rounded-full blur-[100px] md:blur-[200px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (tab === 'admin' && !isAdminUnlocked) {
            setShowPinPrompt(true);
          } else {
            setActiveTab(tab);
          }
        }} 
        user={user} 
        isAdminUnlocked={isAdminUnlocked}
        onLogout={() => {
          setUser(null);
          setIsAdminUnlocked(false);
        }} 
      />
      
      <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 w-[90%] md:w-auto space-y-2">
        {isSyncing && (
          <div className="bg-bordeaux-950 text-white px-6 py-3 md:px-8 md:py-4 rounded-full md:rounded-3xl shadow-2xl flex items-center justify-center gap-4 animate-bounce border border-white/10 mx-auto">
            <RefreshCw size={18} className="text-gold animate-spin" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Sincronizando Disponibilidad...</span>
          </div>
        )}
        {lastSyncSuccess && !isSyncing && (
          <div className="bg-green-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-full md:rounded-3xl shadow-2xl flex items-center justify-center gap-4 animate-slideDown border border-green-400 mx-auto">
            <CheckCircle size={18} />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">Disponibilidad Actualizada ({lastSyncTime})</span>
          </div>
        )}
      </div>

      {showPinPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bordeaux-950/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center space-y-8 animate-slideUp">
            <div className="w-16 h-16 bg-bordeaux-50 rounded-full flex items-center justify-center mx-auto text-bordeaux-800">
              <Lock size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-bordeaux-950">Acceso Privado</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ingrese el PIN Administrativo</p>
            </div>
            <input 
              type="password" 
              maxLength={4}
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="****"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 text-center text-3xl font-black tracking-[1em] outline-none focus:ring-2 focus:ring-bordeaux-800"
              autoFocus
            />
            <div className="flex gap-4">
              <button onClick={() => setShowPinPrompt(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-gray-400">Cerrar</button>
              <button onClick={handlePinSubmit} className="flex-1 bg-bordeaux-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-10 md:py-16 pb-32 md:pb-40 relative z-10">
        {activeTab === 'reservas' && (
          <div className="space-y-12 md:space-y-20 animate-fadeIn">
            <div className="text-center space-y-4 md:space-y-6 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 md:px-6 py-1.5 md:py-2 bg-bordeaux-50 rounded-full text-bordeaux-800 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-2 md:mb-4">
                <Gem size={14} /> Colección Corporativa 2026
              </div>
              <h2 className="text-3xl md:text-7xl font-serif font-bold text-bordeaux-950 leading-tight tracking-tight">
                Flota Premium <span className="italic text-gold md:block">JM Asociados</span>
              </h2>
            </div>
            
            <VehicleGrid 
              flota={flota} 
              exchangeRate={exchangeRate} 
              reservations={reservations} 
              onAddReservation={(res) => saveReservations([...reservations, res])}
            />
          </div>
        )}

        {activeTab === 'ubicacion' && <LocationSection />}

        {activeTab === 'admin' && isAdminUnlocked && (
          <AdminPanel 
            flota={flota}
            setFlota={updateFlota}
            reservations={reservations}
            setReservations={saveReservations}
            gastos={gastos}
            setGastos={saveGastos}
            exchangeRate={exchangeRate}
            onSyncSheet={syncDataFromSheet}
            isSyncing={isSyncing}
          />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-[60]">
        <div className="bg-bordeaux-950 text-white py-4 md:py-6 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/10 shadow-[0_-10px_40px_rgba(58,11,11,0.5)]">
          <div className="flex flex-row items-center justify-between w-full md:w-auto md:space-x-10">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-2 md:w-2.5 h-2 md:h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] text-white/40">Market Live</span>
                <span className="text-xs md:text-sm font-bold">1 R$ = <span className="text-gold">{exchangeRate.toLocaleString()} Gs.</span></span>
              </div>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[9px] md:text-[10px] uppercase font-black tracking-[0.5em] text-white/30">
              JM ASOCIADOS &bull; CORPORATE MANAGEMENT &copy; 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
