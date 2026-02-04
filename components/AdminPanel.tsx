
import React, { useState, useMemo } from 'react';
import { Vehicle, Reservation, Gasto, MaintenanceRecord, ExpirationRecord, MaintenanceThresholds, ChecklistLog, InspectionItem } from '../types';
// Added Banknote to the imports from lucide-react
import { 
  Landmark, FileText, Wrench, Plus, Trash2, Search, 
  Car, ShieldCheck, Edit3, Bell, Check,
  Calendar, History, CheckCircle, TrendingUp, 
  Settings2, BadgeCheck, ClipboardCheck, X,
  ArrowUpRight, ArrowDownLeft, Info, AlertCircle, Zap,
  Save, Image as ImageIcon, Layers, Activity, Gauge, Filter, Eye,
  Banknote
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

interface AdminPanelProps {
  flota: Vehicle[];
  setFlota: (flota: Vehicle[]) => void;
  reservations: Reservation[];
  setReservations: (res: Reservation[]) => void;
  gastos: Gasto[];
  setGastos: (gastos: Gasto[]) => void;
  mantenimientos: MaintenanceRecord[];
  setMantenimientos: (records: MaintenanceRecord[]) => void;
  vencimientos: ExpirationRecord[];
  setVencimientos: (records: ExpirationRecord[]) => void;
  checklists: ChecklistLog[];
  setChecklists: (logs: ChecklistLog[]) => void;
  thresholds: MaintenanceThresholds;
  setThresholds: (t: MaintenanceThresholds) => void;
  exchangeRate: number;
  language?: string;
}

const COLORS = ['#800000', '#D4AF37', '#1a1a1a', '#4a0606', '#d4c59f'];

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  flota = [], setFlota, reservations = [], setReservations, 
  exchangeRate, gastos = [], setGastos, mantenimientos = [], setMantenimientos, 
  vencimientos = [], setVencimientos, thresholds, setThresholds, checklists = [], setChecklists
}) => {
  const [activeTab, setActiveTab] = useState<'finanzas' | 'contratos' | 'flota' | 'taller' | 'vencimientos' | 'inspecciones'>('flota');
  const [fleetFilter, setFleetFilter] = useState('');
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  // Filtros Finanzas
  const [finanzasFilterVehicle, setFinanzasFilterVehicle] = useState('all');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0] 
  });

  // Alertas Globales (Taller y Vencimientos)
  const globalAlerts = useMemo(() => {
    const alerts = [];
    // KM Alerts
    flota.forEach(v => {
      if (v.mantenimientoKM) {
        const kmRemaining = v.mantenimientoKM - v.kilometrajeActual;
        if (kmRemaining < thresholds.kmThreshold) {
          alerts.push({ 
            id: `km-${v.id}`, 
            type: 'maint', 
            msg: `${v.nombre}: Mantenimiento en ${kmRemaining} KM`, 
            severity: kmRemaining < 200 ? 'critical' : 'high',
            icon: Wrench
          });
        }
      }
    });
    // Date Alerts (Vencimientos)
    vencimientos.forEach(v => {
      const daysLeft = (new Date(v.vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      if (!v.pagado && daysLeft < thresholds.daysThreshold) {
        alerts.push({ 
          id: `exp-${v.id}`, 
          type: 'expire', 
          msg: `${v.vehicleName}: Vence ${v.tipo} en ${Math.ceil(daysLeft)} días`, 
          severity: daysLeft < 3 ? 'critical' : 'medium',
          icon: Bell
        });
      }
    });
    return alerts;
  }, [flota, vencimientos, thresholds]);

  // Finanzas Logic
  const stats = useMemo(() => {
    let filteredRes = reservations.filter(r => {
      const rDate = new Date(r.inicio);
      return rDate >= new Date(dateRange.start) && rDate <= new Date(dateRange.end);
    });
    let filteredGastos = gastos.filter(g => {
      const gDate = new Date(g.fecha);
      return gDate >= new Date(dateRange.start) && gDate <= new Date(dateRange.end);
    });

    if (finanzasFilterVehicle !== 'all') {
      filteredRes = filteredRes.filter(r => r.auto.includes(finanzasFilterVehicle));
      filteredGastos = filteredGastos.filter(g => {
        const v = flota.find(fl => fl.id === g.vehicleId);
        return v && v.nombre.includes(finanzasFilterVehicle);
      });
    }

    const totalIngresos = filteredRes.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const totalGastos = filteredGastos.reduce((acc, curr) => acc + (curr.monto || 0), 0);
    
    const chartData = [
      { name: 'Ingresos', valor: totalIngresos, fill: '#800000' },
      { name: 'Gastos', valor: totalGastos, fill: '#D4AF37' }
    ];

    const categoryData = Object.entries(
      filteredGastos.reduce((acc: any, curr) => {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.monto;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    return { totalIngresos, totalGastos, chartData, categoryData, filteredGastos };
  }, [reservations, gastos, finanzasFilterVehicle, dateRange, flota]);

  const saveVehicleChanges = (v: Vehicle) => {
    setFlota(flota.map(item => item.id === v.id ? v : item));
    setEditingVehicle(null);
  };

  const markVencimientoPagado = (id: string) => {
    setVencimientos(vencimientos.map(v => v.id === id ? { ...v, pagado: true } : v));
  };

  const toggleVehicleStatus = (id: string) => {
    setFlota(flota.map(v => v.id === id ? { ...v, estado: v.estado === 'En Taller' ? 'Disponible' : 'En Taller' } : v));
  };

  const updateInspectionItem = (logId: string, category: 'exterior' | 'interior' | 'mecanica', itemIdx: number, updates: Partial<InspectionItem>) => {
    setChecklists(checklists.map(log => {
      if (log.id === logId) {
        const newCat = [...log[category]];
        newCat[itemIdx] = { ...newCat[itemIdx], ...updates };
        return { ...log, [category]: newCat };
      }
      return log;
    }));
  };

  return (
    <div className="space-y-12 animate-fadeIn font-sans pb-20">
      
      {/* Platinum Global Alerts Bar */}
      {globalAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-8 border-red-600 p-8 rounded-[2.5rem] shadow-2xl animate-slideUp">
          <div className="flex items-center gap-6 mb-6">
             <Bell className="text-red-600 animate-tada" size={28} />
             <h4 className="text-xl font-robust text-red-950 dark:text-red-200 uppercase tracking-tight italic">Centro de Alertas Platinum</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {globalAlerts.map((alert) => (
               <div key={alert.id} className="flex items-center justify-between bg-white/80 dark:bg-black/40 backdrop-blur-md p-5 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm group hover:scale-[1.02] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${alert.severity === 'critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-100 text-amber-600'}`}>
                        <alert.icon size={18}/>
                    </div>
                    <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 italic">{alert.msg}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${alert.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {alert.severity}
                  </span>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Admin Panel Tabs Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-2">
           <div className="flex items-center gap-4">
             <div className="p-4 bordeaux-gradient rounded-[2.5rem] shadow-xl ring-4 ring-gold/10">
                <ShieldCheck className="text-gold" size={36} />
             </div>
             <div>
                <h2 className="text-5xl font-robust text-bordeaux-950 dark:text-white italic uppercase tracking-tighter leading-none">Terminal Maestro</h2>
                <p className="text-[10px] font-black text-gold uppercase tracking-[0.5em] italic mt-1">Gestión Centralizada 2026</p>
             </div>
           </div>
        </div>
        <div className="flex flex-wrap bg-gray-100 dark:bg-dark-elevated p-2 rounded-[3.5rem] border border-gray-200 dark:border-white/5 shadow-inner">
           {[
             { id: 'flota', label: 'Flota', icon: Car },
             { id: 'taller', label: 'Taller', icon: Wrench },
             { id: 'inspecciones', label: 'Inspecciones', icon: ClipboardCheck },
             { id: 'vencimientos', label: 'Vencimientos', icon: Bell },
             { id: 'finanzas', label: 'Finanzas', icon: Landmark }
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
               className={`relative flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-700 ${
                 activeTab === tab.id ? 'bg-bordeaux-950 text-white shadow-2xl scale-105' : 'text-gray-400 hover:text-bordeaux-800'
               }`}>
               <tab.icon size={16} className={activeTab === tab.id ? 'text-gold' : ''} />
               <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      <div className="min-h-[700px]">
        
        {/* FINANZAS SECTION */}
        {activeTab === 'finanzas' && (
          <div className="space-y-12 animate-slideUp">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white dark:bg-dark-card p-10 rounded-[4rem] shadow-xl border dark:border-white/5">
                <div className="space-y-4">
                   <label className="text-[9px] font-black text-gold uppercase tracking-[0.2em] ml-4 italic flex items-center gap-2"><Car size={12}/> Unidad</label>
                   <select 
                     value={finanzasFilterVehicle} 
                     onChange={e => setFinanzasFilterVehicle(e.target.value)}
                     className="w-full bg-gray-50 dark:bg-dark-base rounded-full px-8 py-5 font-bold text-[10px] uppercase tracking-widest outline-none border border-transparent focus:border-gold/30"
                   >
                     <option value="all">Todas las Unidades</option>
                     {flota.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
                   </select>
                </div>
                <div className="space-y-4">
                   <label className="text-[9px] font-black text-gold uppercase tracking-[0.2em] ml-4 italic flex items-center gap-2"><Calendar size={12}/> Desde</label>
                   <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-full px-8 py-5 font-bold text-[10px] uppercase tracking-widest outline-none border border-transparent focus:border-gold/30" />
                </div>
                <div className="space-y-4">
                   <label className="text-[9px] font-black text-gold uppercase tracking-[0.2em] ml-4 italic flex items-center gap-2"><Calendar size={12}/> Hasta</label>
                   <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-full px-8 py-5 font-bold text-[10px] uppercase tracking-widest outline-none border border-transparent focus:border-gold/30" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="bg-white dark:bg-dark-card p-10 rounded-[4rem] shadow-2xl border dark:border-white/5 space-y-8 min-h-[450px]">
                  <h3 className="text-2xl font-robust dark:text-white uppercase italic tracking-tight">Balance de Operaciones</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#666' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#666' }} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '25px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }} />
                      <Bar dataKey="valor" radius={[15, 15, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>

               <div className="bg-white dark:bg-dark-card p-10 rounded-[4rem] shadow-2xl border dark:border-white/5 flex flex-col">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-robust dark:text-white uppercase italic tracking-tight">Registro de Egresos</h3>
                    <div className="flex gap-4">
                       <button className="p-4 bg-gray-50 dark:bg-dark-base rounded-2xl text-gold border border-gold/10 hover:scale-110 transition-all shadow-sm"><Filter size={18}/></button>
                       <button className="p-4 bordeaux-gradient text-white rounded-2xl shadow-xl hover:scale-110 transition-all"><Plus size={18}/></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[400px] pr-4 scrollbar-thin">
                     <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead>
                           <tr className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                              <th className="px-4 pb-2">Concepto</th>
                              <th className="px-4 pb-2">Categoría</th>
                              <th className="px-4 pb-2 text-right">Monto (R$)</th>
                           </tr>
                        </thead>
                        <tbody>
                           {stats.filteredGastos.map(g => (
                             <tr key={g.id} className="bg-gray-50/50 dark:bg-dark-base/50 group transition-all hover:bg-gold/5 rounded-[2rem]">
                                <td className="py-5 px-6 rounded-l-[2rem]">
                                    <p className="text-[11px] font-bold text-bordeaux-950 dark:text-white uppercase tracking-tight">{g.concepto}</p>
                                    <p className="text-[8px] text-gray-400 mt-1 font-black italic">{g.fecha}</p>
                                </td>
                                <td className="py-5 px-4">
                                    <span className="px-4 py-1.5 bg-white dark:bg-dark-card text-gold rounded-full border border-gold/10 text-[9px] font-black uppercase tracking-widest">{g.categoria}</span>
                                </td>
                                <td className="py-5 px-6 text-right rounded-r-[2rem]">
                                    <p className="text-sm font-robust text-bordeaux-950 dark:text-gold italic">R$ {g.monto.toLocaleString()}</p>
                                </td>
                             </tr>
                           ))}
                           {stats.filteredGastos.length === 0 && (
                             <tr>
                               <td colSpan={3} className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.5em] italic">Sin Movimientos</td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* FLOTA SECTION */}
        {activeTab === 'flota' && (
          <div className="space-y-10 animate-slideUp">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-dark-card p-8 rounded-[3.5rem] shadow-2xl border dark:border-white/5">
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input 
                    type="text" 
                    placeholder="Filtrar placa, modelo o socio..." 
                    value={fleetFilter} 
                    onChange={e => setFleetFilter(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-dark-base rounded-full pl-20 pr-10 py-6 font-bold text-sm outline-none focus:ring-4 focus:ring-gold/10 transition-all border border-transparent focus:border-gold/20"
                  />
               </div>
               <button className="px-12 py-6 bordeaux-gradient text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all flex items-center gap-4">
                 <Plus size={18}/> Unidad JM Platinum
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {flota.filter(v => v.nombre.toLowerCase().includes(fleetFilter.toLowerCase()) || v.placa.toLowerCase().includes(fleetFilter.toLowerCase())).map(v => (
                <div key={v.id} className="bg-white dark:bg-dark-card rounded-[4rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-xl flex flex-col group hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] transition-all">
                  <div className="relative aspect-video bg-gray-50 dark:bg-dark-base p-10 flex items-center justify-center overflow-hidden">
                    <img src={v.img} className="w-[85%] h-auto object-contain drop-shadow-2xl transition-transform duration-1000 group-hover:scale-110" alt={v.nombre} />
                    <div className="absolute top-8 left-8 flex flex-col gap-3">
                       <span className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl ring-4 ring-white/10 ${
                         v.estado === 'Disponible' ? 'bg-emerald-500 text-white' : v.estado === 'En Taller' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                       }`}>{v.estado}</span>
                       <span className="px-5 py-2 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black text-bordeaux-950 uppercase tracking-widest shadow-xl border border-gold/20">{v.placa}</span>
                    </div>
                    <button onClick={() => setEditingVehicle(v)} className="absolute bottom-8 right-8 p-5 bg-bordeaux-950 text-gold rounded-[1.5rem] shadow-2xl ring-2 ring-gold/20 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <Settings2 size={20}/>
                    </button>
                  </div>
                  <div className="p-10 space-y-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                       <div>
                         <h4 className="text-3xl font-robust text-bordeaux-950 dark:text-white uppercase italic tracking-tighter leading-none">{v.nombre}</h4>
                         <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mt-3 italic">{v.tipo || 'Luxury Division'}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase italic mb-1">Odómetro</p>
                          <p className="text-2xl font-robust text-bordeaux-950 dark:text-white italic leading-none">{v.kilometrajeActual.toLocaleString()} <span className="text-xs">KM</span></p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t dark:border-white/5">
                       <button onClick={() => setEditingVehicle(v)} className="py-5 bg-gray-50 dark:bg-dark-base rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gold/10 transition-all"><Edit3 size={16}/> Editar</button>
                       <button className="p-5 bg-red-50 dark:bg-red-900/10 text-red-300 rounded-[1.8rem] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vehicle Editor Modal */}
            {editingVehicle && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-base/90 backdrop-blur-xl p-6">
                    <div className="bg-white dark:bg-dark-card w-full max-w-3xl rounded-[4rem] shadow-2xl border-t-[10px] border-gold p-12 space-y-10 animate-slideUp overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-4xl font-robust dark:text-white italic tracking-tighter uppercase">Configuración de Unidad</h3>
                                <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] italic mt-1">Ref Protocolo: {editingVehicle.id}</p>
                            </div>
                            <button onClick={() => setEditingVehicle(null)} className="p-5 bg-gray-100 dark:bg-dark-base rounded-2xl text-gray-400 hover:text-red-500 transition-all shadow-sm"><X size={20}/></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic flex items-center gap-2"><ImageIcon size={14} className="text-gold"/> URL Fotografía</label>
                                    <input type="text" value={editingVehicle.img} onChange={e => setEditingVehicle({...editingVehicle, img: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-3xl px-8 py-5 font-bold text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic flex items-center gap-2"><Car size={14} className="text-gold"/> Denominación Modelo</label>
                                    <input type="text" value={editingVehicle.nombre} onChange={e => setEditingVehicle({...editingVehicle, nombre: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-3xl px-8 py-5 font-bold text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic flex items-center gap-2"><BadgeCheck size={14} className="text-gold"/> Chapa / Matrícula</label>
                                    <input type="text" value={editingVehicle.placa} onChange={e => setEditingVehicle({...editingVehicle, placa: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-base rounded-3xl px-8 py-5 font-bold text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner" />
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic flex items-center gap-2"><Gauge size={14} className="text-gold"/> Odómetro</label>
                                        <input type="number" value={editingVehicle.kilometrajeActual} onChange={e => setEditingVehicle({...editingVehicle, kilometrajeActual: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-3xl px-6 py-5 font-bold text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic flex items-center gap-2"><Wrench size={14} className="text-gold"/> Próx. Service</label>
                                        <input type="number" value={editingVehicle.mantenimientoKM || 0} onChange={e => setEditingVehicle({...editingVehicle, mantenimientoKM: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-3xl px-6 py-5 font-bold text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic flex items-center gap-2"><TrendingUp size={14} className="text-gold"/> Arancel Diario (R$)</label>
                                    <input type="number" value={editingVehicle.precio} onChange={e => setEditingVehicle({...editingVehicle, precio: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-3xl px-8 py-5 font-bold text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic flex items-center gap-2"><Activity size={14} className="text-gold"/> Estado Operacional</label>
                                    <select value={editingVehicle.estado} onChange={e => setEditingVehicle({...editingVehicle, estado: e.target.value as any})} className="w-full bg-gray-50 dark:bg-dark-base rounded-3xl px-8 py-5 font-bold text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner">
                                        <option value="Disponible">Disponible</option>
                                        <option value="En Alquiler">En Alquiler</option>
                                        <option value="En Taller">En Taller</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic flex items-center gap-2"><Layers size={14} className="text-gold"/> Especificaciones (Separar por comas)</label>
                            <textarea value={editingVehicle.specs.join(', ')} onChange={e => setEditingVehicle({...editingVehicle, specs: e.target.value.split(',').map(s => s.trim())})} className="w-full bg-gray-50 dark:bg-dark-base rounded-[2.5rem] px-8 py-6 font-bold text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner min-h-[120px]" />
                        </div>

                        <div className="flex gap-8 pt-10">
                            <button onClick={() => saveVehicleChanges(editingVehicle)} className="flex-1 bordeaux-gradient text-white py-7 rounded-full font-robust text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:scale-[1.03] transition-all flex items-center justify-center gap-4 group">
                                <Save size={20} className="group-hover:animate-bounce"/> Validar y Guardar Cambios
                            </button>
                            <button onClick={() => setEditingVehicle(null)} className="px-12 bg-gray-100 dark:bg-dark-elevated text-gray-400 rounded-full font-black text-[10px] uppercase tracking-widest hover:text-bordeaux-800 transition-colors">Descartar</button>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* INSPECCIONES SECTION - Fixed Blank View */}
        {activeTab === 'inspecciones' && (
          <div className="space-y-12 animate-slideUp">
             <div className="bg-white dark:bg-dark-card rounded-[4rem] border dark:border-white/5 shadow-2xl overflow-hidden">
                <div className="p-12 border-b dark:border-white/5 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-8">
                   <div>
                      <h3 className="text-4xl font-robust dark:text-white uppercase italic tracking-tight">Registro de Inspecciones</h3>
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic mt-2">Protocolos de Recepción y Entrega Platinum</p>
                   </div>
                   <button className="px-12 py-5 bordeaux-gradient text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl flex items-center gap-4 hover:scale-105 transition-all"><Plus size={18}/> Nuevo Protocolo</button>
                </div>
                
                <div className="p-12 space-y-12">
                   {checklists.length > 0 ? checklists.map(log => (
                      <div key={log.id} className="bg-gray-50 dark:bg-dark-base rounded-[3.5rem] border border-gray-100 dark:border-white/5 p-12 space-y-10 shadow-inner">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-6">
                               <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl ${log.tipo === 'Check-Out' ? 'bg-bordeaux-800' : 'bg-emerald-600'}`}>
                                  {log.tipo === 'Check-Out' ? <ArrowUpRight size={36}/> : <ArrowDownLeft size={36}/>}
                               </div>
                               <div>
                                  <h4 className="text-3xl font-robust text-bordeaux-950 dark:text-white uppercase italic leading-none">{log.tipo} Protocolo</h4>
                                  <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2"><Calendar size={12}/> {log.fecha}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Responsable</p>
                               <p className="text-base font-black text-bordeaux-950 dark:text-white uppercase tracking-tighter">{log.responsable}</p>
                               <div className="flex items-center gap-3 mt-4 bg-white dark:bg-dark-card px-4 py-2 rounded-full border border-gray-100 dark:border-white/5 shadow-sm">
                                  <Gauge size={14} className="text-gold" />
                                  <span className="text-[10px] font-bold text-gray-500 uppercase italic">{log.kilometraje.toLocaleString()} KM</span>
                               </div>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {(['exterior', 'interior', 'mecanica'] as const).map(cat => (
                               <div key={cat} className="bg-white dark:bg-dark-card p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-white/5">
                                  <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mb-6 border-b border-gold/10 pb-2 italic">{cat}</p>
                                  <div className="space-y-4">
                                     {log[cat].map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group/item">
                                           <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{item.label}</span>
                                           <div className="flex gap-2">
                                              {(['ok', 'bad', 'na'] as const).map(st => (
                                                <button 
                                                  key={st}
                                                  onClick={() => updateInspectionItem(log.id, cat, idx, { status: st })}
                                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                                    item.status === st 
                                                      ? st === 'ok' ? 'bg-emerald-500 text-white shadow-lg' : st === 'bad' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-400 text-white shadow-lg'
                                                      : 'bg-gray-100 dark:bg-dark-base text-gray-300 hover:text-gold'
                                                  }`}
                                                >
                                                  {st === 'ok' ? <Check size={14}/> : st === 'bad' ? <X size={14}/> : <Info size={14}/>}
                                                </button>
                                              ))}
                                           </div>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            ))}
                         </div>
                         <div className="bg-white dark:bg-dark-card p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 flex items-start gap-8 shadow-sm">
                             <div className="p-4 bg-gold/10 rounded-2xl text-gold shadow-sm"><Activity size={28}/></div>
                             <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic">Análisis Global & Observaciones</p>
                                <textarea 
                                  value={log.observacionesGlobales}
                                  onChange={(e) => setChecklists(checklists.map(cl => cl.id === log.id ? { ...cl, observacionesGlobales: e.target.value } : cl))}
                                  className="w-full bg-gray-50 dark:bg-dark-base p-6 rounded-3xl text-[11px] text-gray-600 italic font-medium leading-relaxed border-transparent focus:border-gold/30 outline-none transition-all"
                                  placeholder="Ingresar hallazgos del protocolo..."
                                />
                             </div>
                             <div className="flex flex-col gap-4">
                                <button className="p-5 bg-gray-50 dark:bg-dark-base text-gray-400 hover:text-gold rounded-3xl transition-all shadow-sm"><Edit3 size={20}/></button>
                                <button className="p-5 bg-gray-50 dark:bg-dark-base text-gray-400 hover:text-red-500 rounded-3xl transition-all shadow-sm"><Trash2 size={20}/></button>
                             </div>
                         </div>
                      </div>
                   )) : (
                     <div className="py-40 text-center opacity-30 flex flex-col items-center">
                        <History size={80} className="mb-6" strokeWidth={1}/>
                        <p className="text-2xl font-robust italic uppercase tracking-widest">Sin Protocolos Digitales</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* TALLER SECTION */}
        {activeTab === 'taller' && (
          <div className="space-y-12 animate-slideUp">
            <div className="flex justify-between items-center bg-white dark:bg-dark-card p-8 rounded-[3.5rem] shadow-xl border dark:border-white/5">
                <div>
                  <h3 className="text-3xl font-robust dark:text-white uppercase italic tracking-tight">Mantenimiento Predictivo</h3>
                  <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] italic mt-1">Alertas según Protocolo JM</p>
                </div>
                <div className="flex gap-6">
                    <button onClick={() => setShowThresholdConfig(!showThresholdConfig)} className="px-10 py-5 bg-gray-50 dark:bg-dark-base border-2 border-gold/20 text-gold rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-4 hover:bg-gold/5 transition-all">
                        <Settings2 size={18}/> Umbrales JM
                    </button>
                    <button className="px-12 py-5 bordeaux-gradient text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all flex items-center gap-4">
                        <Plus size={18}/> Nueva Intervención
                    </button>
                </div>
            </div>

            {showThresholdConfig && (
                <div className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] border-2 border-gold/30 shadow-2xl animate-slideUp grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic">Alerta de Service (KM antes)</label>
                        <input type="number" value={thresholds.kmThreshold} onChange={e => setThresholds({...thresholds, kmThreshold: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-3xl px-8 py-5 font-black text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner" />
                        <p className="text-[8px] text-gray-400 italic ml-4">El sistema alertará cuando falten menos de estos KM para el service programado.</p>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 italic">Alerta de Tributo (Días antes)</label>
                        <input type="number" value={thresholds.daysThreshold} onChange={e => setThresholds({...thresholds, daysThreshold: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-base rounded-3xl px-8 py-5 font-black text-sm outline-none border border-transparent focus:border-gold/30 shadow-inner" />
                        <p className="text-[8px] text-gray-400 italic ml-4">Notificación prioritaria para seguros, patentes y cuotas bancarias.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {flota.map(v => {
                const kmRemaining = v.mantenimientoKM ? (v.mantenimientoKM - v.kilometrajeActual) : null;
                const isWarning = kmRemaining !== null && kmRemaining < thresholds.kmThreshold;
                const isCritical = kmRemaining !== null && kmRemaining < 200;

                return (
                  <div key={v.id} className={`bg-white dark:bg-dark-card rounded-[4rem] overflow-hidden border-2 transition-all duration-500 shadow-xl flex flex-col group ${
                    isCritical ? 'border-red-600 shadow-red-100 ring-8 ring-red-500/5' : isWarning ? 'border-amber-400 shadow-amber-100 ring-8 ring-amber-400/5' : 'border-gray-100 dark:border-white/5'
                  }`}>
                    <div className="relative aspect-video bg-gray-50 dark:bg-dark-base p-10 flex items-center justify-center overflow-hidden">
                      <img src={v.img} className="w-[85%] h-auto object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" alt="" />
                      {isWarning && (
                        <div className="absolute top-6 right-6 bg-red-600 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl animate-pulse flex items-center gap-2">
                           <AlertCircle size={10} /> {isCritical ? 'MANTENIMIENTO CRÍTICO' : 'ATENCIÓN REQUERIDA'}
                        </div>
                      )}
                      <div className="absolute top-6 left-6 flex flex-col gap-2">
                         <span className="px-5 py-2 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black text-bordeaux-950 uppercase tracking-widest shadow-lg border border-gold/10">{v.placa}</span>
                      </div>
                    </div>
                    <div className="p-10 space-y-8 flex-1 flex flex-col">
                       <h4 className="text-3xl font-robust text-bordeaux-950 dark:text-white uppercase italic tracking-tighter leading-none">{v.nombre}</h4>
                       
                       <div className="bg-gray-50 dark:bg-dark-base p-8 rounded-[2.5rem] space-y-6 shadow-inner border border-gray-100 dark:border-white/5">
                          <div className="flex justify-between items-center">
                             <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">Odómetro</p>
                             <p className="text-xl font-robust text-bordeaux-950 dark:text-white italic">{v.kilometrajeActual.toLocaleString()} KM</p>
                          </div>
                          <div className="flex justify-between items-center border-t border-gray-200 dark:border-white/10 pt-4">
                             <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">Próx. Service</p>
                             <p className={`text-xl font-robust italic ${isWarning ? 'text-red-600' : 'text-emerald-600'}`}>{v.mantenimientoKM?.toLocaleString() || '---'} KM</p>
                          </div>
                       </div>
                       
                       {kmRemaining !== null && (
                         <div className="space-y-3">
                            <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">
                                <span>Ciclo de Vida Aceite</span>
                                <span className={isWarning ? 'text-red-600' : 'text-emerald-600'}>{kmRemaining.toLocaleString()} KM RESTANTES</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 dark:bg-dark-base rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${Math.max(0, Math.min(100, (kmRemaining / 10000) * 100))}%` }}
                                ></div>
                            </div>
                         </div>
                       )}

                       <button onClick={() => toggleVehicleStatus(v.id)} className="w-full py-6 bordeaux-gradient text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn">
                          <Zap size={18} className="group-hover/btn:animate-pulse" /> Ingresar a Taller Maestro
                       </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VENCIMIENTOS SECTION - Styled Professional Alerts */}
        {activeTab === 'vencimientos' && (
          <div className="animate-slideUp space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-dark-card p-10 rounded-[4.5rem] shadow-xl border dark:border-white/5">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-gold/10 rounded-3xl text-gold shadow-sm"><Banknote size={32}/></div>
                    <div>
                        <h3 className="text-4xl font-robust dark:text-white uppercase italic tracking-tight">Vencimientos & Tributos</h3>
                        <p className="text-[11px] font-black text-gold uppercase tracking-[0.4em] italic mt-1">Control de Impuestos y Seguros Platinum</p>
                    </div>
                </div>
                <div className="flex gap-6">
                    <div className="bg-gray-50 dark:bg-dark-base px-8 py-5 rounded-3xl border border-gray-100 dark:border-white/5 text-center shadow-inner">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cargos Pendientes</p>
                        <p className="text-2xl font-robust text-bordeaux-800 italic">{vencimientos.filter(v => !v.pagado).length}</p>
                    </div>
                    <button className="px-12 py-5 bordeaux-gradient text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4"><Plus size={18}/> Nuevo Tributo</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {vencimientos.map(v => {
                  const daysLeft = Math.ceil((new Date(v.vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isSoon = !v.pagado && daysLeft < thresholds.daysThreshold;

                  return (
                    <div key={v.id} className={`bg-white dark:bg-dark-card p-12 rounded-[5rem] border shadow-2xl relative overflow-hidden transition-all duration-700 group flex flex-col ${
                        v.pagado ? 'opacity-50 border-emerald-100 grayscale-[0.3]' : isSoon ? 'border-red-100 shadow-red-100/30' : 'border-gray-50 dark:border-white/5 hover:border-gold/30'
                    }`}>
                        {v.pagado && <div className="absolute top-[-15%] right-[-15%] w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px]"></div>}
                        
                        <div className="flex justify-between items-start mb-12">
                           <div className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-3 ${
                             v.pagado ? 'bg-emerald-500 text-white' : isSoon ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-900 text-white'
                           }`}>
                             {v.pagado ? <CheckCircle size={14}/> : isSoon ? <AlertCircle size={14}/> : <History size={14}/>}
                             {v.pagado ? 'Liquidado' : isSoon ? 'Vencimiento Próximo' : 'En Fecha'}
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-gray-400 uppercase italic mb-1">Fecha Límite</p>
                              <p className="text-sm font-robust text-bordeaux-950 dark:text-white italic tracking-tighter">{v.vencimiento}</p>
                           </div>
                        </div>
                        
                        <div className="space-y-3 mb-12">
                            <h4 className="text-3xl font-robust text-bordeaux-950 dark:text-white italic uppercase tracking-tighter leading-none group-hover:text-gold transition-colors">{v.vehicleName}</h4>
                            <div className="flex items-center gap-4">
                               <div className="h-[2px] w-8 bg-gold/50"></div>
                               <p className="text-[12px] font-black text-gold uppercase tracking-[0.4em] italic">{v.tipo}</p>
                            </div>
                            {v.referencia && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2">Ref: {v.referencia}</p>}
                        </div>

                        <div className="mt-auto pt-10 border-t dark:border-white/5 flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest italic">Monto de Tributo</p>
                              <p className="text-4xl font-robust text-bordeaux-950 dark:text-white italic tracking-tighter leading-none">R$ {v.monto.toLocaleString()}</p>
                           </div>
                           {!v.pagado && (
                             <button onClick={() => markVencimientoPagado(v.id)} className="p-7 bordeaux-gradient text-white rounded-[2.5rem] shadow-2xl hover:scale-110 active:scale-90 transition-all ring-8 ring-gold/5 group/pay">
                                <Check size={32} strokeWidth={4} className="group-hover/pay:rotate-12 transition-transform" />
                             </button>
                           )}
                        </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Tab Placeholder for Unimplemented/Generic Modules */}
        {(activeTab === 'contratos') && (
          <div className="animate-slideUp py-40 text-center space-y-10 opacity-30 flex flex-col items-center">
             <div className="p-10 bg-gray-50 dark:bg-dark-elevated rounded-[4rem] shadow-inner">
                <History size={100} strokeWidth={0.5} />
             </div>
             <div className="space-y-4">
                <p className="text-3xl font-robust italic uppercase tracking-[0.5em]">Módulo Platinum {activeTab}</p>
                <p className="text-[12px] font-black text-gold uppercase tracking-[0.3em] italic">Sincronización de Base de Datos Maestro 2026</p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;
