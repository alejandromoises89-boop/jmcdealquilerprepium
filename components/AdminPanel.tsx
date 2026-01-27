
import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, Reservation, Gasto, MaintenanceRecord, ExpirationRecord, ChecklistLog, InspectionItem } from '../types';
import { 
  Landmark, FileText, Wrench, Search, Plus, Trash2, Printer, 
  CheckCircle2, AlertTriangle, UserPlus, Download, TrendingUp, TrendingDown,
  ArrowRight, PieChart as PieChartIcon, BarChart3, ClipboardList, 
  Car, MessageCircle, FileSpreadsheet, ShieldCheck, 
  Edit3, X, Settings, User, CreditCard, Check, AlertCircle, Bell
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

interface AdminPanelProps {
  flota: Vehicle[];
  setFlota: (flota: Vehicle[]) => void;
  reservations: Reservation[];
  setReservations: (res: Reservation[]) => void;
  onDeleteReservation?: (id: string) => void;
  gastos: Gasto[];
  setGastos: (gastos: Gasto[]) => void;
  mantenimientos: MaintenanceRecord[];
  setMantenimientos: (records: MaintenanceRecord[]) => void;
  vencimientos: ExpirationRecord[];
  setVencimientos: (records: ExpirationRecord[]) => void;
  exchangeRate: number;
  language?: string;
}

// Subcomponente para Notificaciones Flotantes
const NotificationCenter: React.FC<{ alerts: string[] }> = ({ alerts }) => {
  if (alerts.length === 0) return null;
  return (
    <div className="fixed top-24 right-6 z-[150] space-y-3 animate-slideUp pointer-events-none">
      {alerts.map((alert, idx) => (
        <div key={idx} className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border-l-4 border-rose-500 flex items-start gap-3 w-80 pointer-events-auto">
          <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-full text-rose-600">
             <AlertTriangle size={16} />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Atención Requerida</h4>
            <p className="text-xs font-bold dark:text-gray-200 leading-tight mt-1">{alert}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  flota = [], setFlota, reservations = [], setReservations, onDeleteReservation, 
  exchangeRate, gastos = [], setGastos, mantenimientos = [], setMantenimientos, 
  vencimientos = [], setVencimientos
}) => {
  const [activeTab, setActiveTab] = useState<'finanzas' | 'contratos' | 'taller' | 'checklists'>('finanzas');
  const [finanzasFilter, setFinanzasFilter] = useState({ start: '', end: '', vehicle: '' });
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Reservation | null>(null);
  const [manualRes, setManualRes] = useState({ cliente: '', auto: '', inicio: '', fin: '', total: 0 });
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNewChecklist, setShowNewChecklist] = useState<string | null>(null); // vehicleId for modal

  // --- LOGIC: FINANZAS ---
  const stats = useMemo(() => {
    const filteredRes = reservations.filter(r => {
      const matchV = finanzasFilter.vehicle ? r.auto === finanzasFilter.vehicle : true;
      const matchD = (finanzasFilter.start && finanzasFilter.end) 
        ? (new Date(r.inicio) >= new Date(finanzasFilter.start) && new Date(r.inicio) <= new Date(finanzasFilter.end))
        : true;
      return matchV && matchD;
    });

    const filteredGastos = gastos.filter(g => {
      const matchV = finanzasFilter.vehicle ? g.vehicleId === finanzasFilter.vehicle : true;
      const matchD = (finanzasFilter.start && finanzasFilter.end)
        ? (new Date(g.fecha) >= new Date(finanzasFilter.start) && new Date(g.fecha) <= new Date(finanzasFilter.end))
        : true;
      return matchV && matchD;
    });

    const income = filteredRes.reduce((s, r) => s + (r.total || 0), 0);
    const expense = filteredGastos.reduce((s, g) => s + (g.monto || 0), 0) + mantenimientos.reduce((s, m) => s + m.monto, 0);
    
    const barData = [
      { name: 'Ingresos', val: income, fill: '#10b981' },
      { name: 'Egresos', val: expense, fill: '#ef4444' }
    ];

    const pieData = [
      { name: 'Operativo', value: filteredGastos.filter(g => g.categoria === 'Operativo').reduce((s, g) => s + g.monto, 0) },
      { name: 'Taller', value: mantenimientos.reduce((s, m) => s + m.monto, 0) },
      { name: 'Seguros', value: filteredGastos.filter(g => g.categoria === 'Seguros').reduce((s, g) => s + g.monto, 0) },
      { name: 'Cuotas', value: filteredGastos.filter(g => g.categoria === 'Cuotas').reduce((s, g) => s + g.monto, 0) }
    ].filter(v => v.value > 0);

    return { income, expense, balance: income - expense, barData, pieData };
  }, [reservations, gastos, mantenimientos, finanzasFilter]);

  // --- LOGIC: NOTIFICATIONS ---
  useEffect(() => {
    const alerts: string[] = [];
    flota.forEach(v => {
      const logs = mantenimientos.filter(m => m.vehicleId === v.id);
      // Check last maintenance record for expiration
      const lastService = logs.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
      
      if (lastService) {
        if (lastService.vencimientoKM && v.kilometrajeActual >= lastService.vencimientoKM) {
          alerts.push(`Mantenimiento Vencido (KM): ${v.nombre} superó los ${lastService.vencimientoKM} KM.`);
        } else if (lastService.vencimientoKM && (lastService.vencimientoKM - v.kilometrajeActual <= 500)) {
           alerts.push(`Mantenimiento Próximo (KM): ${v.nombre} a ${lastService.vencimientoKM - v.kilometrajeActual} KM.`);
        }

        if (lastService.vencimientoFecha) {
          const today = new Date();
          const dueDate = new Date(lastService.vencimientoFecha);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          if (diffDays <= 0) {
            alerts.push(`Mantenimiento Vencido (Fecha): ${v.nombre} venció el ${lastService.vencimientoFecha}.`);
          } else if (diffDays <= 7) {
            alerts.push(`Mantenimiento Próximo (Fecha): ${v.nombre} vence en ${diffDays} días.`);
          }
        }
      }
    });
    setNotifications(alerts);
  }, [flota, mantenimientos]);

  const exportCSV = (type: string) => {
    let headers = "ID,Cliente,Auto,Fecha,Total BRL\n";
    let rows = reservations.map(r => `${r.id},${r.cliente},${r.auto},${r.inicio},${r.total}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `JM_${type}_${Date.now()}.csv`;
    link.click();
  };

  const COLORS = ['#800000', '#D4AF37', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-8 animate-slideUp pb-40 max-w-full overflow-x-hidden relative">
      <NotificationCenter alerts={notifications} />

      {/* HEADER */}
      <div className="px-4 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-robust text-bordeaux-950 dark:text-white italic tracking-tighter leading-none">TERMINAL MASTER v3.6</h2>
          <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
            <ShieldCheck size={14}/> Centro de Inteligencia Operativa
          </p>
        </div>
        <div className="flex gap-2 relative">
           <button onClick={() => window.print()} className="p-4 bg-gray-950 text-white rounded-[1.5rem] shadow-2xl"><Printer size={20}/></button>
           {notifications.length > 0 && (
             <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-bounce shadow-lg">{notifications.length}</span>
           )}
        </div>
      </div>

      {/* TABS MENU */}
      <div className="flex bg-white dark:bg-dark-elevated p-2 rounded-[3rem] border-2 dark:border-white/5 overflow-x-auto gap-2 scrollbar-hide shadow-xl">
        {[
          {id:'finanzas', icon: Landmark, label: 'Finanzas'},
          {id:'contratos', icon: FileText, label: 'Contratos'},
          {id:'taller', icon: Wrench, label: 'Taller & Alertas'},
          {id:'checklists', icon: ClipboardList, label: 'Inspección Pro'}
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
            className={`flex flex-col items-center justify-center gap-1.5 min-w-[100px] py-5 rounded-[2.2rem] transition-all ${
              activeTab === tab.id ? 'bg-bordeaux-950 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-bordeaux-800'
            }`}>
            <tab.icon size={18} />
            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* --- FINANZAS --- */}
      {activeTab === 'finanzas' && (
        <div className="space-y-6 animate-fadeIn px-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] border-b-8 border-emerald-500 shadow-xl">
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Ingresos</p>
                <h3 className="text-4xl font-robust dark:text-white italic">R$ {stats.income.toLocaleString()}</h3>
                <p className="text-[11px] font-bold text-gray-400 mt-2 italic">Gs. {(stats.income * exchangeRate).toLocaleString()}</p>
             </div>
             <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] border-b-8 border-rose-500 shadow-xl">
                <p className="text-[9px] font-black text-rose-600 uppercase mb-2">Egresos</p>
                <h3 className="text-4xl font-robust dark:text-white italic">R$ {stats.expense.toLocaleString()}</h3>
                <p className="text-[11px] font-bold text-gray-400 mt-2 italic">Gs. {(stats.expense * exchangeRate).toLocaleString()}</p>
             </div>
             <div className="bg-bordeaux-950 p-8 rounded-[3rem] border-2 border-gold/20 shadow-xl">
                <p className="text-[9px] font-black text-gold uppercase mb-2">Neto</p>
                <h3 className="text-4xl font-robust text-white italic">R$ {stats.balance.toLocaleString()}</h3>
                <p className="text-[11px] font-bold text-gold/40 mt-2 italic">Gs. {(stats.balance * exchangeRate).toLocaleString()}</p>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] shadow-xl h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={stats.barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                      <Tooltip />
                      <Bar dataKey="val" radius={[15, 15, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] shadow-xl h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={stats.pieData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                         {stats.pieData.map((_, i) => <Cell key={`c-${i}`} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {/* --- CONTRATOS --- */}
      {activeTab === 'contratos' && (
        <div className="space-y-6 px-2 animate-fadeIn">
           <button onClick={() => setShowManualBooking(!showManualBooking)} className="w-full py-6 bg-gold/10 border-4 border-dashed border-gold text-gold rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-gold/20 transition-all">
              <UserPlus size={24}/> Nuevo Contrato Directo (Confirmar y Bloquear)
           </button>

           {showManualBooking && (
             <form onSubmit={(e) => {
               e.preventDefault();
               const res: Reservation = {
                 id: `JM-MAN-${Date.now()}`, cliente: manualRes.cliente.toUpperCase(), email: 'manual@jmasociados.com', ci: 'MANUAL', documentType: 'CI', celular: '---', auto: manualRes.auto, inicio: manualRes.inicio, fin: manualRes.fin, total: manualRes.total, status: 'Confirmed', includeInCalendar: true
               };
               setReservations([res, ...reservations]);
               setShowManualBooking(false);
               alert("Fechas bloqueadas en el calendario.");
             }} className="bg-white dark:bg-dark-card p-10 rounded-[3.5rem] border-2 border-gold shadow-2xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <input type="text" placeholder="Cliente" required value={manualRes.cliente} onChange={e => setManualRes({...manualRes, cliente: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                   <select required value={manualRes.auto} onChange={e => setManualRes({...manualRes, auto: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0">
                      <option value="">Seleccionar Auto...</option>
                      {flota.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <input type="date" required value={manualRes.inicio} onChange={e => setManualRes({...manualRes, inicio: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                   <input type="date" required value={manualRes.fin} onChange={e => setManualRes({...manualRes, fin: e.target.value})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                   <input type="number" placeholder="Total BRL" required value={manualRes.total} onChange={e => setManualRes({...manualRes, total: Number(e.target.value)})} className="bg-gray-50 dark:bg-dark-base rounded-2xl px-6 py-4 font-bold border-0" />
                </div>
                <button type="submit" className="w-full py-6 bordeaux-gradient text-white rounded-[2rem] font-black uppercase tracking-widest">Confirmar Bloqueo de Fechas</button>
             </form>
           )}

           <div className="space-y-4">
             {reservations.map(r => (
               <div key={r.id} onClick={() => setSelectedContract(r)} className="bg-white dark:bg-dark-card p-6 rounded-[2.5rem] border dark:border-white/5 flex justify-between items-center group hover:border-gold cursor-pointer transition-all">
                  <div className="flex items-center gap-4">
                     <FileText size={20} className="text-bordeaux-800"/>
                     <div>
                        <p className="text-sm font-black dark:text-white uppercase italic leading-none">{r.cliente}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{r.auto} | {r.inicio}</p>
                     </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                     <p className="text-lg font-robust dark:text-white">R$ {r.total}</p>
                     <button onClick={(e) => { e.stopPropagation(); onDeleteReservation?.(r.id); }} className="p-3 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* --- TALLER (MEJORADO CON ALERTAS INTEGRADAS) --- */}
      {activeTab === 'taller' && (
        <div className="space-y-8 px-2 animate-fadeIn">
           {flota.map(v => {
             const logs = mantenimientos.filter(m => m.vehicleId === v.id);
             // Verificar estado de alerta para este vehículo
             const lastService = logs.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
             let alertStatus = 'OK';
             if (lastService) {
                if ((lastService.vencimientoKM && v.kilometrajeActual >= lastService.vencimientoKM) || (lastService.vencimientoFecha && new Date() >= new Date(lastService.vencimientoFecha))) {
                   alertStatus = 'VENCIDO';
                } else if ((lastService.vencimientoKM && lastService.vencimientoKM - v.kilometrajeActual <= 500)) {
                   alertStatus = 'PROXIMO';
                }
             }

             return (
               <div key={v.id} className={`bg-white dark:bg-dark-card p-8 rounded-[3.5rem] border-2 shadow-xl space-y-6 relative overflow-hidden transition-all ${alertStatus === 'VENCIDO' ? 'border-red-500 shadow-red-500/20' : alertStatus === 'PROXIMO' ? 'border-gold shadow-gold/20' : 'border-gray-100 dark:border-white/5'}`}>
                  {/* Etiqueta de Alerta */}
                  {alertStatus !== 'OK' && (
                    <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-[2.5rem] font-black text-[10px] uppercase tracking-widest text-white ${alertStatus === 'VENCIDO' ? 'bg-red-500' : 'bg-gold'}`}>
                       {alertStatus === 'VENCIDO' ? 'MANTENIMIENTO VENCIDO' : 'MANTENIMIENTO PRÓXIMO'}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row items-center gap-8 border-b dark:border-white/5 pb-6">
                     <div className="w-full md:w-48 h-32 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 relative group">
                        <img src={v.img} className="w-full h-full object-contain p-2 transition-transform group-hover:scale-110"/>
                     </div>
                     <div className="flex-1 text-center md:text-left space-y-2">
                        <h4 className="text-2xl font-robust dark:text-white uppercase italic">{v.nombre}</h4>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                           <span className="bg-gray-100 dark:bg-dark-elevated px-3 py-1 rounded-lg text-[9px] font-black text-gray-500 uppercase">Placa: {v.placa}</span>
                           <span className="bg-gray-100 dark:bg-dark-elevated px-3 py-1 rounded-lg text-[9px] font-black text-bordeaux-800 uppercase">KM Actual: {v.kilometrajeActual}</span>
                        </div>
                     </div>
                     <button onClick={() => {
                       const newM: MaintenanceRecord = { 
                          id: `M-${Date.now()}`, 
                          vehicleId: v.id, 
                          vehicleName: v.nombre, 
                          fecha: new Date().toISOString().split('T')[0], 
                          kilometraje: v.kilometrajeActual, 
                          descripcion: 'Nuevo Mantenimiento', 
                          monto: 0,
                          tipo: 'Preventivo',
                          vencimientoKM: v.kilometrajeActual + 5000,
                          vencimientoFecha: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().split('T')[0],
                          realizado: true
                       };
                       setMantenimientos([...mantenimientos, newM]);
                     }} className="p-4 bg-bordeaux-950 text-white rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                        <Plus size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Nuevo Registro</span>
                     </button>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Historial Técnico & Vencimientos</p>
                    {logs.map(log => (
                      <div key={log.id} className="bg-gray-50 dark:bg-dark-base p-6 rounded-[2.5rem] border border-gray-200 dark:border-white/5 space-y-4 hover:border-gold/30 transition-all">
                         <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                               <p className="text-[8px] font-black text-gray-400 uppercase">Descripción del Trabajo</p>
                               <input type="text" value={log.descripcion} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, descripcion: e.target.value} : m))} className="w-full bg-transparent border-b border-gray-300 text-sm font-bold dark:text-white outline-none focus:border-gold" />
                            </div>
                            <div className="w-full md:w-32 space-y-2">
                               <p className="text-[8px] font-black text-gray-400 uppercase">Monto BRL</p>
                               <input type="number" value={log.monto} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, monto: Number(e.target.value)} : m))} className="w-full bg-transparent border-b border-gray-300 text-sm font-black text-bordeaux-800 text-right outline-none focus:border-gold" />
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-dark-elevated p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="space-y-1">
                               <p className="text-[7px] font-black text-gray-400 uppercase">Fecha Realizado</p>
                               <input type="date" value={log.fecha} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, fecha: e.target.value} : m))} className="bg-transparent text-[10px] font-bold w-full" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[7px] font-black text-gray-400 uppercase">KM Realizado</p>
                               <input type="number" value={log.kilometraje} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, kilometraje: Number(e.target.value)} : m))} className="bg-transparent text-[10px] font-bold w-full" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[7px] font-black text-rose-500 uppercase">Vence (Fecha)</p>
                               <input type="date" value={log.vencimientoFecha} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, vencimientoFecha: e.target.value} : m))} className="bg-transparent text-[10px] font-bold w-full text-rose-600" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[7px] font-black text-rose-500 uppercase">Vence (KM)</p>
                               <input type="number" value={log.vencimientoKM} onChange={e => setMantenimientos(mantenimientos.map(m => m.id === log.id ? {...m, vencimientoKM: Number(e.target.value)} : m))} className="bg-transparent text-[10px] font-bold w-full text-rose-600" />
                            </div>
                         </div>
                         <div className="flex justify-end">
                            <button onClick={() => setMantenimientos(mantenimientos.filter(x => x.id !== log.id))} className="text-[9px] font-black text-gray-300 hover:text-red-500 uppercase tracking-widest flex items-center gap-1"><Trash2 size={12}/> Eliminar Registro</button>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {/* --- INSPECCIÓN PROFESIONAL --- */}
      {activeTab === 'checklists' && (
        <div className="space-y-6 px-2 animate-fadeIn">
           {flota.map(v => (
             <div key={v.id} className="bg-white dark:bg-dark-card p-8 rounded-[3.5rem] border dark:border-white/5 shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden"><img src={v.img} className="w-full h-full object-contain"/></div>
                      <h4 className="text-xl font-robust dark:text-white uppercase italic">{v.nombre}</h4>
                   </div>
                   <button onClick={() => setShowNewChecklist(v.id)} className="p-3 bg-bordeaux-950 text-gold rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                     <Plus size={18}/> <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">Nueva Inspección</span>
                   </button>
                </div>

                {/* Lista de Inspecciones */}
                <div className="space-y-3">
                   {(v.checklists || []).length === 0 && <p className="text-center text-[10px] text-gray-300 font-bold uppercase py-4">Sin inspecciones registradas</p>}
                   {(v.checklists || []).map((c) => (
                     <div key={c.id} className="bg-gray-50 dark:bg-dark-base p-6 rounded-[2rem] border dark:border-white/5 relative group hover:border-gold/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white ${c.tipo === 'Check-In' ? 'bg-emerald-500' : 'bg-blue-500'}`}>{c.tipo}</span>
                              <p className="text-[10px] font-bold text-gray-500 mt-2">{c.fecha} • {c.responsable} • {c.kilometraje} KM</p>
                           </div>
                           <button onClick={() => {
                              if(confirm('¿Borrar inspección permanentemente?')) {
                                 const updatedFlota = flota.map(veh => veh.id === v.id ? {...veh, checklists: veh.checklists?.filter(ck => ck.id !== c.id)} : veh);
                                 setFlota(updatedFlota);
                              }
                           }} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                        
                        {/* Resumen Visual */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                           {['Exterior', 'Interior', 'Mecánica', 'Docs'].map((cat, i) => {
                              const items = i === 0 ? c.exterior : i === 1 ? c.interior : i === 2 ? c.mecanica : c.documentacion;
                              const issues = (items || []).filter(x => x.status === 'bad').length;
                              return (
                                 <div key={i} className={`p-2 rounded-xl text-center border ${issues > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                    <p className="text-[7px] font-black uppercase">{cat}</p>
                                    <p className="text-[9px] font-bold">{issues > 0 ? `${issues} Alertas` : 'OK'}</p>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           ))}

           {/* Modal Nueva Inspección */}
           {showNewChecklist && (
             <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-base/90 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-dark-card w-full max-w-2xl h-[90vh] rounded-[3rem] p-8 overflow-y-auto shadow-2xl border-4 border-gold relative animate-slideUp">
                   <button onClick={() => setShowNewChecklist(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-all"><X size={20}/></button>
                   <h3 className="text-2xl font-serif font-bold text-bordeaux-950 mb-6 text-center">Inspección Profesional</h3>
                   <InspectionForm 
                      vehicleId={showNewChecklist}
                      flota={flota}
                      setFlota={setFlota}
                      onClose={() => setShowNewChecklist(null)}
                   />
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

// Subcomponente Formulario Inspección
const InspectionForm: React.FC<{ vehicleId: string, flota: Vehicle[], setFlota: (f: Vehicle[]) => void, onClose: () => void }> = ({ vehicleId, flota, setFlota, onClose }) => {
   const vehicle = flota.find(v => v.id === vehicleId);
   const [data, setData] = useState<ChecklistLog>({
      id: `C-${Date.now()}`,
      tipo: 'Check-In',
      fecha: new Date().toISOString().split('T')[0],
      responsable: '',
      kilometraje: vehicle?.kilometrajeActual || 0,
      combustible: 'Full',
      exterior: [
         { label: 'Paragolpes Delantero', status: 'ok' },
         { label: 'Paragolpes Trasero', status: 'ok' },
         { label: 'Puertas Laterales', status: 'ok' },
         { label: 'Capó y Techo', status: 'ok' },
         { label: 'Cristales/Espejos', status: 'ok' }
      ],
      interior: [
         { label: 'Tapizado', status: 'ok' },
         { label: 'Tablero/Instrumentos', status: 'ok' },
         { label: 'Limpieza General', status: 'ok' }
      ],
      mecanica: [
         { label: 'Luces', status: 'ok' },
         { label: 'Neumáticos', status: 'ok' },
         { label: 'Niveles (Agua/Aceite)', status: 'ok' }
      ],
      documentacion: [
         { label: 'Cédula Verde', status: 'ok' },
         { label: 'Habilitación', status: 'ok' },
         { label: 'Seguro al Día', status: 'ok' }
      ],
      observacionesGlobales: '',
      firmado: false
   });

   const toggleItem = (category: 'exterior' | 'interior' | 'mecanica' | 'documentacion', idx: number) => {
      const items = [...data[category]];
      items[idx].status = items[idx].status === 'ok' ? 'bad' : 'ok';
      setData({...data, [category]: items});
   };

   const handleSubmit = () => {
      const updatedFlota = flota.map(v => v.id === vehicleId ? {...v, checklists: [data, ...(v.checklists || [])]} : v);
      setFlota(updatedFlota);
      onClose();
   };

   return (
      <div className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-gray-400">Tipo Movimiento</label>
               <select value={data.tipo} onChange={e => setData({...data, tipo: e.target.value as any})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold border-0">
                  <option value="Check-In">Entrada (Check-In)</option>
                  <option value="Check-Out">Salida (Check-Out)</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-gray-400">Responsable</label>
               <input type="text" value={data.responsable} onChange={e => setData({...data, responsable: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold border-0" placeholder="Nombre..." />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-gray-400">Kilometraje</label>
               <input type="number" value={data.kilometraje} onChange={e => setData({...data, kilometraje: Number(e.target.value)})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold border-0" />
            </div>
            <div className="space-y-1">
               <label className="text-[9px] font-black uppercase text-gray-400">Combustible</label>
               <select value={data.combustible} onChange={e => setData({...data, combustible: e.target.value as any})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-bold border-0">
                  <option value="Full">Lleno (Full)</option>
                  <option value="3/4">3/4 Tanque</option>
                  <option value="1/2">1/2 Tanque</option>
                  <option value="1/4">1/4 Tanque</option>
                  <option value="1/8">Reserva</option>
               </select>
            </div>
         </div>

         {/* Categorías Dinámicas */}
         {['exterior', 'interior', 'mecanica', 'documentacion'].map((cat) => (
            <div key={cat} className="bg-gray-50 p-4 rounded-2xl">
               <h5 className="text-[10px] font-black uppercase text-bordeaux-800 mb-3 tracking-widest border-b border-gray-200 pb-1">{cat}</h5>
               <div className="space-y-2">
                  {(data[cat as keyof ChecklistLog] as InspectionItem[]).map((item, idx) => (
                     <div key={idx} onClick={() => toggleItem(cat as any, idx)} className="flex justify-between items-center p-2 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50">
                        <span className="text-[10px] font-bold uppercase">{item.label}</span>
                        <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-colors ${item.status === 'ok' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                           {item.status === 'ok' ? 'APROBADO' : 'OBSERVADO'}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         ))}

         <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-gray-400">Observaciones Generales</label>
            <textarea value={data.observacionesGlobales} onChange={e => setData({...data, observacionesGlobales: e.target.value})} className="w-full bg-gray-50 rounded-xl p-3 text-xs font-medium border-0 min-h-[80px]" placeholder="Detalles adicionales..." />
         </div>

         <button onClick={handleSubmit} className="w-full py-4 bg-bordeaux-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform">
            Guardar Inspección
         </button>
      </div>
   );
};

export default AdminPanel;
