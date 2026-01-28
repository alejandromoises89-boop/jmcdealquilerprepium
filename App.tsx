
import React, { useState, useEffect } from 'react';
import { Vehicle, Reservation, Gasto, Breakdown, MaintenanceRecord, ExpirationRecord } from './types';
import { INITIAL_FLOTA, Language } from './constants';
import { fetchBrlToPyg } from './services/exchangeService';
import { fetchReservationsFromSheet, saveReservationToSheet } from './services/googleSheetService';
import Navbar from './components/Navbar';
import VehicleGrid from './components/VehicleGrid';
import AdminPanel from './components/AdminPanel';
import LocationSection from './components/LocationSection';
import SupportForm from './components/SupportForm';
import { RefreshCw, Lock, CloudUpload } from 'lucide-react';

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

  const [gastos, setGastos] = useState<Gasto[]>(() => {
    const saved = localStorage.getItem('jm_gastos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [mantenimientos, setMantenimientos] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem('jm_mantenimientos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [vencimientos, setVencimientos] = useState<ExpirationRecord[]>(() => {
    const saved = localStorage.getItem('jm_vencimientos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [breakdowns, setBreakdowns] = useState<Breakdown[]>(() => {
    const saved = localStorage.getItem('jm_breakdowns');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [exchangeRate, setExchangeRate] = useState<number>(1550);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => localStorage.getItem('jm_admin_unlocked') === 'true');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");

  useEffect(() => {
    localStorage.setItem('jm_flota', JSON.stringify(flota));
    localStorage.setItem('jm_reservations', JSON.stringify(reservations));
    localStorage.setItem('jm_gastos', JSON.stringify(gastos));
    localStorage.setItem('jm_mantenimientos', JSON.stringify(mantenimientos));
    localStorage.setItem('jm_vencimientos', JSON.stringify(vencimientos));
    localStorage.setItem('jm_breakdowns', JSON.stringify(breakdowns));
    localStorage.setItem('jm_lang', language);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('jm_theme', darkMode ? 'dark' : 'light');
  }, [flota, reservations, gastos, mantenimientos, vencimientos, breakdowns, language, darkMode]);

  // CALCULO DINAMICO DE ESTADO DE MANTENIMIENTO
  const flotaWithStatus = flota.map(v => {
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    
    // 1. Chequeo por mantenimientoKM propiedad del vehículo
    if (v.mantenimientoKM) {
       const diff = v.mantenimientoKM - v.kilometrajeActual;
       if (diff <= 0) status = 'critical';
       else if (diff <= 1000) status = 'warning'; // 1000km aviso
    }

    // 2. Chequeo por último registro de taller
    const logs = mantenimientos.filter(m => m.vehicleId === v.id);
    if (logs.length > 0) {
       const last = logs.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
       if (last.vencimientoKM) {
          const diffKM = last.vencimientoKM - v.kilometrajeActual;
          if (diffKM <= 0) status = 'critical';
          else if (diffKM <= 500 && status !== 'critical') status = 'warning';
       }
       if (last.vencimientoFecha) {
          const today = new Date();
          const due = new Date(last.vencimientoFecha);
          const diffTime = due.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 0) status = 'critical';
          else if (diffDays <= 15 && status !== 'critical') status = 'warning';
       }
    }
    return { ...v, maintenanceStatus: status };
  });

  const syncDataFromSheet = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const cloudRes = await fetchReservationsFromSheet();
      if (cloudRes) {
        setReservations(prevLocal => {
          // Filtrar las locales que no son "nube" para no duplicar las que ya vienen de la nube
          const localOnly = prevLocal.filter(r => !r.id.startsWith('CLOUD-'));
          const combined = [...cloudRes, ...localOnly];
          
          // Eliminar duplicados basados en clave única
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

  const handleNewReservation = async (newRes: Reservation) => {
    // 1. Agregar inmediatamente al estado local para bloquear calendario visualmente
    setReservations(prev => [newRes, ...prev]);
    
    // 2. Intentar guardar en nube (fondo)
    setIsSavingCloud(true);
    try {
      const success = await saveReservationToSheet(newRes);
      if (success) {
        console.log("Sincronización con Nube Exitosa");
      } else {
        console.warn("No se pudo guardar en la nube (Web App URL no configurada o error de red), pero se guardó localmente.");
      }
    } catch (error) {
      console.error("Error al guardar en la nube:", error);
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleNewBreakdown = (newBreakdown: Breakdown) => {
    setBreakdowns(prev => [newBreakdown, ...prev]);
    alert(language === 'es' ? "Asistencia reportada con éxito." : "Support reported successfully.");
    setActiveTab('reservas');
  };

  useEffect(() => {
    fetchBrlToPyg().then(setExchangeRate);
    syncDataFromSheet();
    const interval = setInterval(syncDataFromSheet, 300000); // 5 minutos
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
        exchangeRate={exchangeRate}
      />

      {(isSyncing || isSavingCloud) && (
        <div className="fixed top-28 right-6 z-[130] flex items-center gap-4 bg-white/95 dark:bg-dark-card/95 text-bordeaux-950 px-6 py-4 rounded-[2rem] shadow-2xl border border-gold/20 animate-slideUp">
          <div className="relative">
            <RefreshCw className={`text-gold ${isSyncing || isSavingCloud ? 'animate-spin' : ''}`} size={18} />
            {isSavingCloud && <CloudUpload className="absolute -top-1 -right-1 text-bordeaux-800 animate-bounce" size={10} />}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest block leading-none">
              {isSavingCloud ? 'Subiendo a Nube' : 'Sincronizando'}
            </span>
            <span className="text-[7px] text-gray-400 font-bold uppercase mt-1 block">JM Protocolo Seguro</span>
          </div>
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
        {activeTab === 'reservas' && (
          <VehicleGrid 
            flota={flotaWithStatus} 
            exchangeRate={exchangeRate} 
            reservations={reservations} 
            onAddReservation={handleNewReservation} 
            language={language} 
          />
        )}
        {activeTab === 'ubicacion' && <LocationSection />}
        {activeTab === 'asistencia' && <SupportForm flota={flota} onSubmit={handleNewBreakdown} />}
        {activeTab === 'admin' && isAdminUnlocked && (
          <AdminPanel 
            flota={flotaWithStatus} 
            setFlota={setFlota} 
            reservations={reservations} 
            setReservations={setReservations} 
            onDeleteReservation={id => setReservations(reservations.filter(r => r.id !== id))} 
            onAddReservation={handleNewReservation}
            gastos={gastos} 
            setGastos={setGastos} 
            mantenimientos={mantenimientos}
            setMantenimientos={setMantenimientos}
            vencimientos={vencimientos}
            setVencimientos={setVencimientos}
            exchangeRate={exchangeRate} 
            onSyncSheet={syncDataFromSheet} 
            isSyncing={isSyncing} 
            breakdowns={breakdowns} 
            setBreakdowns={setBreakdowns} 
            language={language}
          />
        )}
      </main>
    </div>
  );
};

export default App;
