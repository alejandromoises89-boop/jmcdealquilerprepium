
import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, Reservation, Gasto, Breakdown, MaintenanceRecord, ExpirationRecord, MaintenanceThresholds, ChecklistLog } from './types';
import { INITIAL_FLOTA, Language } from './constants';
import { fetchBrlToPyg } from './services/exchangeService';
import { fetchReservationsFromSheet, saveReservationToSheet } from './services/googleSheetService';
import Navbar from './components/Navbar';
import VehicleGrid from './components/VehicleGrid';
import AdminPanel from './components/AdminPanel';
import LocationSection from './components/LocationSection';
import SupportForm from './components/SupportForm';
import { Lock } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reservas' | 'ubicacion' | 'asistencia' | 'admin'>('reservas');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('jm_theme') === 'dark');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('jm_lang') as Language) || 'es');
  
  const [thresholds, setThresholds] = useState<MaintenanceThresholds>(() => {
    const saved = localStorage.getItem('jm_thresholds');
    return saved ? JSON.parse(saved) : { kmThreshold: 1000, daysThreshold: 15 };
  });

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
    return [
      { id: 'g1', concepto: 'Cambio de Aceite Sintético', monto: 350, fecha: '2026-03-01', categoria: 'Mantenimiento', vehicleId: '2' },
      { id: 'g2', concepto: 'Seguro MAPFRE Mensual', monto: 1200, fecha: '2026-03-05', categoria: 'Seguros' }
    ];
  });

  const [mantenimientos, setMantenimientos] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem('jm_mantenimientos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { id: 'm1', vehicleId: '2', vehicleName: 'Toyota Vitz Blanco', fecha: '2026-02-15', kilometraje: 84500, descripcion: 'Cambio de Filtros y Aceite', monto: 350, tipo: 'Preventivo', realizado: true, vencimientoKM: 89500 }
    ];
  });

  const [vencimientos, setVencimientos] = useState<ExpirationRecord[]>(() => {
    const saved = localStorage.getItem('jm_vencimientos');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { id: 'v1', vehicleId: '1', vehicleName: 'Hyundai Tucson', tipo: 'Cuota', vencimiento: '2026-03-25', monto: 2500, pagado: false, referencia: 'C-24/36' },
      { id: 'v2', vehicleId: '3', vehicleName: 'Toyota Vitz Negro', tipo: 'Seguro', vencimiento: '2026-04-10', monto: 450, pagado: false, referencia: 'Póliza 9982' }
    ];
  });

  const [checklists, setChecklists] = useState<ChecklistLog[]>(() => {
    const saved = localStorage.getItem('jm_checklists');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { 
        id: 'chk1', vehicleId: '2', tipo: 'Check-Out', fecha: '2026-03-01', responsable: 'Admin JM', kilometraje: 84500, combustible: 'Full', 
        exterior: [{label: 'Carrocería', status: 'ok', obs: 'Sin detalles'}, {label: 'Pintura', status: 'ok', obs: ''}], 
        interior: [{label: 'Tapizados', status: 'ok', obs: 'Limpieza profunda'}], 
        mecanica: [{label: 'Aceite', status: 'ok', obs: ''}], 
        observacionesGlobales: 'Unidad entregada en perfectas condiciones.' 
      }
    ];
  });

  const [exchangeRate, setExchangeRate] = useState<number>(1550);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => localStorage.getItem('jm_admin_unlocked') === 'true');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState("");

  useEffect(() => {
    localStorage.setItem('jm_flota', JSON.stringify(flota));
    localStorage.setItem('jm_reservations', JSON.stringify(reservations));
    localStorage.setItem('jm_gastos', JSON.stringify(gastos));
    localStorage.setItem('jm_mantenimientos', JSON.stringify(mantenimientos));
    localStorage.setItem('jm_vencimientos', JSON.stringify(vencimientos));
    localStorage.setItem('jm_checklists', JSON.stringify(checklists));
    localStorage.setItem('jm_thresholds', JSON.stringify(thresholds));
    localStorage.setItem('jm_lang', language);
    
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('jm_theme', darkMode ? 'dark' : 'light');
  }, [flota, reservations, gastos, mantenimientos, vencimientos, checklists, language, darkMode, thresholds]);

  useEffect(() => {
    fetchBrlToPyg().then(setExchangeRate);
  }, []);

  const handleAddReservation = async (res: Reservation) => {
    setReservations(prev => [res, ...prev]);
    setFlota(prevFlota => prevFlota.map(v => 
      v.nombre.toUpperCase() === res.auto.toUpperCase() 
        ? { ...v, estado: 'En Alquiler' } 
        : v
    ));
    await saveReservationToSheet(res);
  };

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
      alert("PIN Maestro Incorrecto");
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
        exchangeRate={exchangeRate}
      />

      {showPinPrompt && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-dark-base/95 backdrop-blur-xl">
          <div className="bg-white dark:bg-dark-card rounded-[3.5rem] p-10 w-full max-w-sm text-center space-y-8 animate-slideUp border-4 border-gold/20 shadow-2xl">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto text-gold"><Lock size={32} /></div>
            <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] italic">Terminal Maestro JM</p>
            <input 
              type="password" 
              value={pinValue} 
              onChange={(e) => setPinValue(e.target.value)} 
              placeholder="••••" 
              className="w-full bg-gray-50 dark:bg-dark-base dark:text-gold border-0 rounded-2xl py-4 text-center text-3xl font-black tracking-[0.5em] outline-none focus:ring-2 focus:ring-gold/30" 
              autoFocus
            />
            <button 
              onClick={handlePinSubmit} 
              className="w-full bordeaux-gradient text-white py-5 rounded-2xl font-robust text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Autenticar Acceso
            </button>
            <button onClick={() => setShowPinPrompt(false)} className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cancelar Protocolo</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-40">
        {activeTab === 'reservas' && (
          <VehicleGrid 
            flota={flota} 
            exchangeRate={exchangeRate} 
            reservations={reservations} 
            onAddReservation={handleAddReservation} 
            language={language} 
          />
        )}
        {activeTab === 'ubicacion' && <LocationSection />}
        {activeTab === 'asistencia' && <SupportForm flota={flota} onSubmit={(b) => {}} />}
        {activeTab === 'admin' && isAdminUnlocked && (
          <AdminPanel 
            flota={flota} setFlota={setFlota} 
            reservations={reservations} setReservations={setReservations} 
            gastos={gastos} setGastos={setGastos} 
            mantenimientos={mantenimientos} setMantenimientos={setMantenimientos}
            vencimientos={vencimientos} setVencimientos={setVencimientos}
            checklists={checklists} setChecklists={setChecklists}
            thresholds={thresholds} setThresholds={setThresholds}
            exchangeRate={exchangeRate} language={language}
          />
        )}
      </main>
    </div>
  );
};

export default App;
