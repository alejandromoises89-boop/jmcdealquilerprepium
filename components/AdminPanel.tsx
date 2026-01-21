
import React, { useState, useMemo } from 'react';
import { Vehicle, Reservation, Gasto, Breakdown } from '../types';
import { 
  FileText, RefreshCw, Car, 
  ShieldCheck, Trash2, TrendingUp, Wallet,
  Search, ArrowRight,
  AlertTriangle, Edit3, Save, Activity, Receipt,
  UserCheck, UserX, MessageCircle, Calendar, Sparkles, CheckCircle2, ToggleLeft, ToggleRight, 
  ArrowLeftRight, Clock, Landmark, BarChart3, PieChart as PieIcon, LineChart as LineIcon,
  CreditCard, DollarSign, CalendarDays, PlusCircle, X
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import ContractDocument from './ContractDocument';
import { saveReservationToSheet } from '../services/googleSheetService';

interface AdminPanelProps {
  flota: Vehicle[];
  setFlota: (flota: Vehicle[]) => void;
  reservations: Reservation[];
  setReservations: (res: Reservation[]) => void;
  gastos: Gasto[];
  setGastos: (gastos: Gasto[]) => void;
  exchangeRate: number;
  onSyncSheet: () => Promise<void>;
  isSyncing: boolean;
  breakdowns: Breakdown[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  flota, setFlota, reservations, setReservations, gastos, setGastos, exchangeRate, onSyncSheet, isSyncing, breakdowns
}) => {
  const [activeSection, setActiveSection] = useState<'resumen' | 'flota' | 'registros'>('resumen');
  const [selectedContract, setSelectedContract] = useState<{res: Reservation, veh: Vehicle} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [swappingResId, setSwappingResId] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualData, setManualData] = useState({ cliente: '', ci: '', celular: '', auto: '', inicio: '', fin: '', total: '' });

  // --- LÓGICA DE ELIMINACIÓN ---
  const deleteReservation = (id: string) => {
    if (window.confirm("¿Desea eliminar esta reserva permanentemente? Esta acción liberará las fechas en el calendario.")) {
      const updated = reservations.filter(r => r.id !== id);
      setReservations(updated);
      localStorage.setItem('jm_reservations', JSON.stringify(updated));
    }
  };

  // --- LÓGICA DE CARGA MANUAL ---
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de Choque de Fechas
    const start = new Date(manualData.inicio);
    const end = new Date(manualData.fin);
    
    const hasConflict = reservations.find(r => {
      if (r.auto !== manualData.auto || r.status === 'Cancelled') return false;
      const rStart = new Date(r.inicio.split(' ')[0]);
      const rEnd = new Date(r.fin.split(' ')[0]);
      return start < rEnd && end > rStart;
    });

    if (hasConflict) {
      alert(`⚠️ CONFLICTO DE LOGÍSTICA: La unidad "${manualData.auto}" ya tiene una reserva activa para este periodo con el cliente: ${hasConflict.cliente}.`);
      return;
    }

    const newRes: Reservation = {
      id: `MANUAL-${Math.floor(Math.random() * 1000)}`,
      cliente: manualData.cliente,
      ci: manualData.ci,
      celular: manualData.celular,
      auto: manualData.auto,
      inicio: manualData.inicio,
      fin: manualData.fin,
      total: parseFloat(manualData.total) || 0,
      status: 'Confirmed',
      admissionStatus: 'Approved',
      includeInCalendar: true
    };

    const updated = [newRes, ...reservations];
    setReservations(updated);
    localStorage.setItem('jm_reservations', JSON.stringify(updated));
    setShowManualEntry(false);
    setManualData({ cliente: '', ci: '', celular: '', auto: '', inicio: '', fin: '', total: '' });
  };

  // --- LÓGICA FINANCIERA ---
  const totalIngresos = reservations.reduce((acc, curr) => acc + (curr.status === 'Cancelled' ? 0 : curr.total), 0);
  const totalGastos = gastos.reduce((acc, curr) => acc + curr.monto, 0);
  const utilidadNeta = totalIngresos - totalGastos;
  const margenUtilidad = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;

  // --- PREPARACIÓN DE DATOS PARA GRÁFICOS ---
  const revenueByVehicleData = flota.map(v => {
    const rev = reservations
      .filter(r => r.auto.toLowerCase().includes(v.nombre.toLowerCase()) && r.status !== 'Cancelled')
      .reduce((sum, r) => sum + r.total, 0);
    return { name: v.nombre.split(' ')[1] || v.nombre, value: rev, full: v.nombre };
  }).sort((a, b) => b.value - a.value);

  const COLORS = ['#800000', '#D4AF37', '#3a0b0b', '#6a1d1d', '#972929', '#d14d4d'];

  const performanceTrendData = [
    { name: 'Sem 1', ingresos: totalIngresos * 0.2, gastos: totalGastos * 0.25 },
    { name: 'Sem 2', ingresos: totalIngresos * 0.3, gastos: totalGastos * 0.15 },
    { name: 'Sem 3', ingresos: totalIngresos * 0.25, gastos: totalGastos * 0.3 },
    { name: 'Sem 4', ingresos: totalIngresos * 0.25, gastos: totalGastos * 0.3 },
  ];

  // --- LÓGICA DE DESGASTE ---
  const calculateWearIndex = (vehicle: Vehicle) => {
    let wear = 0;
    const resCount = reservations.filter(r => r.auto.toLowerCase().includes(vehicle.nombre.toLowerCase()) && r.status === 'Confirmed').length;
    wear += Math.min(resCount * 3, 45);

    if (vehicle.mantenimientoVence) {
      const parts = vehicle.mantenimientoVence.split('/');
      if (parts.length === 3) {
        const mntDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        const diffDays = Math.ceil((mntDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) wear += 40;
        else if (diffDays < 15) wear += 25;
      }
    }

    const activeBreakdowns = breakdowns.filter(b => b.vehicleId === vehicle.id && !b.resuelta).length;
    wear += activeBreakdowns * 15;

    return Math.min(wear, 100);
  };

  const getWearColor = (index: number) => {
    if (index > 75) return 'bg-red-600';
    if (index > 40) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const filteredReservations = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return reservations.filter(r => 
      r.cliente.toLowerCase().includes(lower) || 
      r.auto.toLowerCase().includes(lower) ||
      r.id.toLowerCase().includes(lower)
    );
  }, [reservations, searchTerm]);

  const updateResStatus = async (id: string, status: Reservation['status'], admission: Reservation['admissionStatus'], includeInCalendar?: boolean) => {
    const currentRes = reservations.find(r => r.id === id);
    if (!currentRes) return;
    const updatedRes = { ...currentRes, status, admissionStatus: admission, includeInCalendar: includeInCalendar !== undefined ? includeInCalendar : (currentRes.includeInCalendar ?? true) };
    const updatedList = reservations.map(r => r.id === id ? updatedRes : r);
    setReservations(updatedList);
    localStorage.setItem('jm_reservations', JSON.stringify(updatedList));
    if (admission === 'Approved') await saveReservationToSheet(updatedRes);
  };

  const swapVehicle = (resId: string, newVehicleName: string) => {
    const updatedList = reservations.map(r => r.id === resId ? { ...r, auto: newVehicleName } : r);
    setReservations(updatedList);
    localStorage.setItem('jm_reservations', JSON.stringify(updatedList));
    setSwappingResId(null);
  };

  const handleUpdateVehicle = (id: string, updates: Partial<Vehicle>) => {
    const updated = flota.map(v => v.id === id ? { ...v, ...updates } : v);
    setFlota(updated);
    localStorage.setItem('jm_flota', JSON.stringify(updated));
    setEditingId(null);
  };

  const sendTechnicalAlert = (vehicle: Vehicle, type: string) => {
    const wear = calculateWearIndex(vehicle);
    const waText = `*JM ASOCIADOS - REPORTE DE STATUS VIP*\n\n🚗 *Unidad:* ${vehicle.nombre}\n🆔 *Placa:* ${vehicle.placa}\n📊 *Desgaste:* ${wear}%\n\n🛡️ *CUOTA SEGURO:* ${vehicle.cuotaSeguro || 'Pendiente'}\n📅 Vence Seguro: ${vehicle.seguroVence || 'N/D'}\n\n🔧 *CUOTA MANTENIMIENTO:* ${vehicle.cuotaMantenimiento || 'Pendiente'}\n📅 Vence Mantenimiento: ${vehicle.mantenimientoVence || 'N/D'}\n\n⚠️ *Reporte:* ${type}\n\n_Favor moderador validar estas cuotas y vencimientos._`;
    window.open(`https://wa.me/595993471667?text=${encodeURIComponent(waText)}`, '_blank');
  };

  if (selectedContract) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <button onClick={() => setSelectedContract(null)} className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-xl text-bordeaux-800 font-bold text-[10px] uppercase"><ArrowRight className="rotate-180" size={16}/> Volver</button>
        <ContractDocument vehicle={selectedContract.veh} data={selectedContract.res} days={1} totalPYG={selectedContract.res.total * exchangeRate} />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {/* Modal Carga Manual */}
      {showManualEntry && (
        <div className="fixed inset-0 z-[160] bg-bordeaux-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <form onSubmit={handleManualSubmit} className="bg-white rounded-[3rem] w-full max-w-xl p-10 space-y-6 animate-slideUp border border-white/20 shadow-2xl relative">
             <button type="button" onClick={() => setShowManualEntry(false)} className="absolute top-8 right-8 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-red-600"><X size={20}/></button>
             <h3 className="text-2xl font-serif font-bold text-bordeaux-950">Cargar Contrato Manual</h3>
             <div className="space-y-4">
                <input required type="text" placeholder="Nombre Cliente" value={manualData.cliente} onChange={e => setManualData({...manualData, cliente: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none focus:ring-2 focus:ring-bordeaux-800" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="CI / Documento" value={manualData.ci} onChange={e => setManualData({...manualData, ci: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none" />
                  <input type="tel" placeholder="WhatsApp" value={manualData.celular} onChange={e => setManualData({...manualData, celular: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none" />
                </div>
                <select required value={manualData.auto} onChange={e => setManualData({...manualData, auto: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none">
                  <option value="">Seleccionar Unidad...</option>
                  {flota.map(v => <option key={v.id} value={v.nombre}>{v.nombre} ({v.placa})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Salida</label>
                    <input required type="date" value={manualData.inicio} onChange={e => setManualData({...manualData, inicio: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Retorno</label>
                    <input required type="date" value={manualData.fin} onChange={e => setManualData({...manualData, fin: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none" />
                  </div>
                </div>
                <input type="number" placeholder="Monto Total (R$)" value={manualData.total} onChange={e => setManualData({...manualData, total: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-0 font-bold outline-none" />
             </div>
             <button type="submit" className="w-full py-5 bg-bordeaux-800 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-bordeaux-950 shadow-xl transition-all">Validar y Bloquear Calendario</button>
          </form>
        </div>
      )}

      {/* Modal de Intercambio */}
      {swappingResId && (
        <div className="fixed inset-0 z-[150] bg-bordeaux-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 space-y-8 animate-slideUp border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-serif font-bold text-bordeaux-950">Seleccionar Nueva Unidad</h3>
               <button onClick={() => setSwappingResId(null)} className="p-2 bg-gray-50 rounded-full"><UserX size={20}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto airbnb-scrollbar">
               {flota.map(v => (
                 <button key={v.id} onClick={() => swapVehicle(swappingResId, v.nombre)} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-bordeaux-800 hover:text-white transition-all group border border-gray-100">
                    <img src={v.img} className="w-16 h-12 object-contain group-hover:invert transition-all" />
                    <div className="text-left">
                       <p className="font-bold text-xs uppercase">{v.nombre}</p>
                       <p className="text-[10px] opacity-60 uppercase">{v.placa}</p>
                    </div>
                 </button>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-bordeaux-950 text-gold rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl"><ShieldCheck size={16}/> JM INTELLIGENCE HUB</div>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-bordeaux-950">Master Console</h2>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setShowManualEntry(true)} className="px-8 py-4 bg-white border-2 border-bordeaux-800 text-bordeaux-800 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 hover:bg-bordeaux-50 shadow-xl transition-all">
            <PlusCircle size={18}/> Cargar Histórico
          </button>
          <button onClick={onSyncSheet} disabled={isSyncing} className="px-8 py-4 bg-bordeaux-800 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 hover:bg-bordeaux-950 shadow-xl transition-all">
            <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={18}/> {isSyncing ? 'Sincronizando...' : 'Actualizar Cloud'}
          </button>
        </div>
      </div>

      {/* Navegación Panel */}
      <div className="flex bg-gray-50 p-1.5 rounded-[2.5rem] border border-gray-100 overflow-x-auto airbnb-scrollbar">
        {[
          { id: 'resumen', label: 'Dashboard', icon: TrendingUp },
          { id: 'flota', label: 'Status & Desgaste', icon: Car },
          { id: 'registros', label: 'Admisión VIP', icon: ShieldCheck }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id as any)} className={`relative flex items-center gap-4 px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === tab.id ? 'text-white' : 'text-gray-400 hover:text-bordeaux-800'}`}>
            {activeSection === tab.id && <div className="absolute inset-0 bordeaux-gradient rounded-[2rem] shadow-lg animate-fadeIn"></div>}
            <tab.icon size={18} className="relative z-10" /><span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeSection === 'resumen' && (
          <div className="space-y-12">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-6 group hover:-translate-y-2 transition-transform">
                <div className="w-14 h-14 bg-bordeaux-50 rounded-2xl flex items-center justify-center text-bordeaux-800 group-hover:bg-bordeaux-800 group-hover:text-white transition-colors"><Wallet size={28} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Ingresos Totales (BRL/PYG)</p>
                  <h4 className="text-3xl font-black text-bordeaux-950">R$ {totalIngresos.toLocaleString()}</h4>
                  <p className="text-sm font-bold text-gold">Gs. {(totalIngresos * exchangeRate).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-6 group hover:-translate-y-2 transition-transform">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors"><Activity size={28} /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Flota Operativa</p>
                  <h4 className="text-3xl font-black text-red-950">{flota.length} Unidades</h4>
                  <p className="text-sm font-bold text-red-400">Control de Desgaste Activo</p>
                </div>
              </div>

              <div className="bg-bordeaux-950 p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-6 group hover:-translate-y-2 transition-transform">
                <div className="w-14 h-14 bg-gold rounded-2xl flex items-center justify-center text-bordeaux-950 group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
                <div className="text-white">
                  <p className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">Margen de Operación</p>
                  <h4 className="text-3xl font-black">{margenUtilidad.toFixed(1)}%</h4>
                  <p className="text-sm font-bold opacity-60">Optimización Premium</p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-serif font-bold text-bordeaux-950 flex items-center gap-3"><LineIcon size={20} className="text-gold"/> Rendimiento Mensual</h3>
                   <span className="text-[10px] font-black text-gray-300 uppercase">Valores en R$</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceTrendData}>
                      <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#800000" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#800000" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                      <Area type="monotone" dataKey="ingresos" stroke="#800000" fillOpacity={1} fill="url(#colorIngresos)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-serif font-bold text-bordeaux-950 flex items-center gap-3"><PieIcon size={20} className="text-gold"/> Profit Share por Unidad</h3>
                   <span className="text-[10px] font-black text-gray-300 uppercase">Cash Flow Distribution</span>
                </div>
                <div className="h-[300px] w-full flex flex-col md:flex-row items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={revenueByVehicleData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {revenueByVehicleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 min-w-[150px]">
                     {revenueByVehicleData.slice(0, 4).map((item, idx) => (
                       <div key={idx} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx]}}></div>
                          <p className="text-[10px] font-black uppercase text-gray-500">{item.name}</p>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'flota' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {flota.map(v => {
              const wear = calculateWearIndex(v);
              const totalVehRev = reservations.filter(r => r.auto.toLowerCase().includes(v.nombre.toLowerCase()) && r.status !== 'Cancelled').reduce((s, r) => s + r.total, 0);
              return (
                <div key={v.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl space-y-6 relative overflow-hidden group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <img src={v.img} className="w-20 h-20 object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="font-bold text-xl text-bordeaux-950">{v.nombre}</h4>
                        <span className="text-[10px] font-black text-gold tracking-[0.4em] uppercase">{v.placa}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-gray-300 uppercase">Rentabilidad</p>
                       <p className="text-sm font-black text-green-600">R$ {totalVehRev.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Monitor de Desgaste Visual */}
                  <div className="space-y-3 bg-gray-50 p-6 rounded-3xl">
                    <div className="flex justify-between items-center">
                       <p className="text-[9px] font-black text-bordeaux-950 uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-gold"/> Índice de Desgaste Operativo</p>
                       <span className={`text-[10px] font-black ${wear > 75 ? 'text-red-600' : 'text-bordeaux-800'}`}>{wear}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${getWearColor(wear)}`} style={{width: `${wear}%`}}></div>
                    </div>
                  </div>

                  {/* Edición de Cuotas y Vencimientos */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* SEGURO */}
                    <div className="p-4 rounded-2xl border border-gray-100 space-y-3 bg-bordeaux-50/30">
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><CreditCard size={10}/> Seguro</p>
                      
                      {/* Monto Cuota Seguro */}
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Monto Cuota</p>
                        <div className="flex items-center justify-between">
                           {editingId === `cseg-${v.id}` ? (
                             <input type="text" defaultValue={v.cuotaSeguro} onBlur={(e) => handleUpdateVehicle(v.id, {cuotaSeguro: e.target.value})} className="w-full text-xs font-black bg-transparent border-b border-gold outline-none" autoFocus />
                           ) : (
                             <p className="text-xs font-black text-bordeaux-950 cursor-pointer" onClick={() => setEditingId(`cseg-${v.id}`)}>{v.cuotaSeguro || 'Definir...'}</p>
                           )}
                           <Edit3 size={10} className="opacity-30" />
                        </div>
                      </div>

                      {/* Vencimiento Seguro */}
                      <div className="space-y-1 pt-1 border-t border-bordeaux-100/50">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1"><CalendarDays size={8}/> Vencimiento</p>
                        <div className="flex items-center justify-between">
                           {editingId === `vseg-${v.id}` ? (
                             <input type="text" placeholder="DD/MM/YYYY" defaultValue={v.seguroVence} onBlur={(e) => handleUpdateVehicle(v.id, {seguroVence: e.target.value})} className="w-full text-[10px] font-black bg-transparent border-b border-gold outline-none" autoFocus />
                           ) : (
                             <p className="text-[10px] font-bold text-bordeaux-800 cursor-pointer" onClick={() => setEditingId(`vseg-${v.id}`)}>{v.seguroVence || 'N/D'}</p>
                           )}
                           <Edit3 size={10} className="opacity-30" />
                        </div>
                      </div>
                    </div>

                    {/* MANTENIMIENTO */}
                    <div className="p-4 rounded-2xl border border-gray-100 space-y-3 bg-gray-50/50">
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><DollarSign size={10}/> Mantenimiento</p>
                      
                      {/* Monto Cuota Mant */}
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Monto Cuota</p>
                        <div className="flex items-center justify-between">
                           {editingId === `cmnt-${v.id}` ? (
                             <input type="text" defaultValue={v.cuotaMantenimiento} onBlur={(e) => handleUpdateVehicle(v.id, {cuotaMantenimiento: e.target.value})} className="w-full text-xs font-black bg-transparent border-b border-gold outline-none" autoFocus />
                           ) : (
                             <p className="text-xs font-black text-bordeaux-950 cursor-pointer" onClick={() => setEditingId(`cmnt-${v.id}`)}>{v.cuotaMantenimiento || 'Definir...'}</p>
                           )}
                           <Edit3 size={10} className="opacity-30" />
                        </div>
                      </div>

                      {/* Vencimiento Mant */}
                      <div className="space-y-1 pt-1 border-t border-gray-200">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1"><CalendarDays size={8}/> Vencimiento</p>
                        <div className="flex items-center justify-between">
                           {editingId === `vmnt-${v.id}` ? (
                             <input type="text" placeholder="DD/MM/YYYY" defaultValue={v.mantenimientoVence} onBlur={(e) => handleUpdateVehicle(v.id, {mantenimientoVence: e.target.value})} className="w-full text-[10px] font-black bg-transparent border-b border-gold outline-none" autoFocus />
                           ) : (
                             <p className="text-[10px] font-bold text-bordeaux-800 cursor-pointer" onClick={() => setEditingId(`vmnt-${v.id}`)}>{v.mantenimientoVence || 'N/D'}</p>
                           )}
                           <Edit3 size={10} className="opacity-30" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => sendTechnicalAlert(v, 'Actualización de Status, Cuotas y Vencimientos')} className="w-full py-4 bg-bordeaux-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-lg hover:bg-bordeaux-950 transition-all">Reportar al Moderador</button>
                </div>
              );
            })}
          </div>
        )}

        {activeSection === 'registros' && (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-gray-100 bg-bordeaux-50/20 flex justify-between items-center">
              <div><h3 className="text-2xl font-serif font-bold text-bordeaux-950">Admisión VIP & Calendario</h3><p className="text-[10px] font-black text-gold uppercase tracking-[0.4em]">Gestión de flota e intercambios</p></div>
              <div className="relative flex items-center gap-4">
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input type="text" placeholder="Buscar cliente o unidad..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold w-64 shadow-inner" />
                 </div>
              </div>
            </div>
            <div className="overflow-x-auto airbnb-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-bordeaux-950 text-gold text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6">ID / Cliente</th>
                    <th className="px-8 py-6">Unidad</th>
                    <th className="px-8 py-6">Entrega</th>
                    <th className="px-8 py-6">Retorno</th>
                    <th className="px-8 py-6 text-center">Calendario</th>
                    <th className="px-8 py-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReservations.map(res => (
                    <tr key={res.id} className="hover:bg-bordeaux-50 transition-all group">
                      <td className="px-8 py-6">
                        <p className="text-[9px] font-black text-gold mb-1">#{res.id}</p>
                        <p className="font-bold text-gray-900 uppercase">{res.cliente}</p>
                        <p className="text-[10px] text-gray-400">{res.ci}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <p className="text-sm font-black text-bordeaux-900 uppercase">{res.auto}</p>
                           <button onClick={() => setSwappingResId(res.id)} className="p-2 bg-white rounded-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-all text-bordeaux-800 hover:bg-bordeaux-800 hover:text-white shadow-sm" title="Cambiar Unidad"><ArrowLeftRight size={14} /></button>
                        </div>
                      </td>
                      <td className="px-8 py-6"><div className="flex items-center gap-2 text-gray-700 font-bold text-xs uppercase"><Clock size={12} className="text-gold" /> {res.inicio}</div></td>
                      <td className="px-8 py-6"><div className="flex items-center gap-2 text-gray-700 font-bold text-xs uppercase"><Clock size={12} className="text-gold" /> {res.fin}</div></td>
                      <td className="px-8 py-6 text-center">
                        <button onClick={() => updateResStatus(res.id, res.status, res.admissionStatus!, !(res.includeInCalendar ?? true))} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${res.includeInCalendar ?? true ? 'bg-bordeaux-800 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                          {res.includeInCalendar ?? true ? <><ToggleRight size={18}/> Cargado</> : <><ToggleLeft size={18}/> No Cargar</>}
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => updateResStatus(res.id, 'Confirmed', 'Approved')} className={`p-3 rounded-xl transition-all ${res.status === 'Confirmed' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300 hover:text-green-600'}`} title="Aprobar"><UserCheck size={18}/></button>
                          <button onClick={() => deleteReservation(res.id)} className="p-3 rounded-xl bg-gray-50 text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all" title="Eliminar Permanente"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
