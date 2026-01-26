
import React, { useState, useMemo, useRef } from 'react';
import { Vehicle, Reservation, Gasto, Breakdown, ChecklistLog } from '../types';
import { 
  RefreshCw, Car, ShieldCheck, Search, 
  Trash2, X, Calendar, PieChart, 
  Save, Settings2, Gauge, ShieldAlert, CreditCard, FileText, Plus, Edit3,
  CheckCircle2, AlertCircle, Wrench, Droplets, Filter, Disc, ChevronRight, Sparkles,
  ClipboardCheck, LogOut, LogIn, Fuel, Brush, UserCheck, PackageOpen, ImageIcon, Type, Clock, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

interface AdminPanelProps {
  flota: Vehicle[];
  setFlota: (flota: Vehicle[]) => void;
  reservations: Reservation[];
  setReservations: (res: Reservation[]) => void;
  onDeleteReservation?: (id: string) => void;
  gastos: Gasto[];
  setGastos: (gastos: Gasto[]) => void;
  exchangeRate: number;
  onSyncSheet: () => Promise<void>;
  isSyncing: boolean;
  breakdowns: Breakdown[];
  setBreakdowns: (b: Breakdown[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  flota, setFlota, reservations, setReservations, onDeleteReservation, exchangeRate, onSyncSheet, isSyncing
}) => {
  const [activeSection, setActiveSection] = useState<'finanzas' | 'flota' | 'reservas' | 'contratos'>('finanzas');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  const [opModal, setOpModal] = useState<{resId: string, type: 'delivery' | 'reception'} | null>(null);
  const [opLog, setOpLog] = useState<ChecklistLog | null>(null);

  const stats = useMemo(() => {
    const list = reservations || [];
    const validRes = list.filter(r => r.status !== 'Cancelled');
    const totalBRL = validRes.reduce((sum, r) => sum + (r.total || 0), 0);
    return { totalBRL };
  }, [reservations]);

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    const newFlota = flota.map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
    setFlota(newFlota);
    setEditingVehicle(null);
  };

  const handleOpenOpModal = (resId: string, type: 'delivery' | 'reception') => {
    const res = reservations.find(r => r.id === resId);
    const existingLog = type === 'delivery' ? res?.deliveryLog : res?.receptionLog;
    
    setOpLog(existingLog || {
      fecha: new Date().toISOString(),
      responsable: '',
      combustible: '1/2',
      limpiezaInterior: false,
      limpiezaExterior: false,
      auxilio: { gato: true, llaveRueda: true, triangulo: true, extintor: true, auxiliar: true },
      observaciones: ''
    });
    setOpModal({ resId, type });
  };

  const handleSaveOpLog = () => {
    if (!opModal || !opLog) return;
    const newReservations = reservations.map(r => {
      if (r.id === opModal.resId) {
        return {
          ...r,
          [opModal.type === 'delivery' ? 'deliveryLog' : 'receptionLog']: opLog,
          status: opModal.type === 'reception' ? 'Completed' : 'Confirmed'
        };
      }
      return r;
    });
    setReservations(newReservations);
    setOpModal(null);
  };

  const toggleChecklist = (key: keyof Required<Vehicle>['serviceChecklist']) => {
    if (!editingVehicle) return;
    const currentChecklist = editingVehicle.serviceChecklist || {
      aceite: false, filtroAceite: false, filtroAire: false, frenos: false, alineacion: false, limpieza: false
    };
    setEditingVehicle({
      ...editingVehicle,
      serviceChecklist: { ...currentChecklist, [key]: !currentChecklist[key] }
    });
  };

  const chartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months.map((month, index) => ({
      name: month,
      ingresos: (reservations || []).filter(r => {
        const parts = r.inicio.split(' ')[0].split(/[/-]/);
        let m = -1;
        if (parts.length === 3) m = parseInt(parts[1]) - 1;
        return m === index && r.status !== 'Cancelled';
      }).reduce((sum, r) => sum + (r.total || 0), 0)
    }));
  }, [reservations]);

  const safeParseDate = (s: string): Date => {
    if (!s) return new Date();
    try {
      const datePart = s.split(' ')[0];
      const parts = datePart.split(/[/-]/);
      let d, m, y;
      if (parts.length !== 3) return new Date();
      if (parts[0].length === 4) { y = parseInt(parts[0]); m = parseInt(parts[1]) - 1; d = parseInt(parts[2]); }
      else { d = parseInt(parts[0]); m = parseInt(parts[1]) - 1; y = parseInt(parts[2]); if (y < 100) y += 2000; }
      const dt = new Date(y, m, d);
      return isNaN(dt.getTime()) ? new Date() : dt;
    } catch (e) {
      return new Date();
    }
  };

  return (
    <div className="space-y-6 animate-slideUp pb-24">
      {/* HEADER ADMIN */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-dark-card p-5 rounded-3xl border dark:border-gold/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-bordeaux-950 text-gold rounded-2xl border border-gold/20 shadow-xl"><ShieldCheck size={20}/></div>
          <div><h2 className="text-2xl font-robust font-speed dark:text-white leading-none italic uppercase tracking-tight">Central <span className="text-gold">Maestra</span></h2><p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.4em] mt-1.5 leading-none">Terminal Protocolo 2026</p></div>
        </div>
        <button onClick={onSyncSheet} disabled={isSyncing} className="px-5 py-2.5 bordeaux-gradient text-white rounded-xl font-robust text-[9px] flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50">
          <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={14}/> {isSyncing ? 'SYNC NUBE' : 'ACTUALIZAR NUBE'}
        </button>
      </div>

      {/* TABS MENU */}
      <div className="flex bg-white dark:bg-dark-elevated p-1 rounded-2xl border dark:border-white/5 overflow-x-auto gap-1 shadow-inner">
        {[
          { id: 'finanzas', label: 'BALANCE', icon: PieChart },
          { id: 'flota', label: 'FICHA TÉCNICA', icon: Car },
          { id: 'reservas', label: 'LIBRO VIP', icon: Calendar },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id as any)} 
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-robust transition-all whitespace-nowrap ${
              activeSection === tab.id ? 'bg-bordeaux-950 text-white shadow-md' : 'text-gray-400 hover:text-bordeaux-800 dark:hover:text-gold'
            }`}>
            <tab.icon size={12} /> {tab.label}
          </button>
        ))}
      </div>

      {/* SECCIÓN: RESERVAS (LIBRO VIP) */}
      {activeSection === 'reservas' && (
        <div className="bg-white dark:bg-dark-card rounded-2xl border dark:border-gold/10 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-4 border-b dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-dark-elevated">
            <h3 className="text-xs font-robust dark:text-white italic uppercase tracking-widest">Libro de Reservas VIP</h3>
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="SOCIO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-white dark:bg-dark-base rounded-xl text-[9px] font-bold outline-none border dark:border-gold/10 focus:border-gold w-40 md:w-64" /></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left compact-table">
              <thead><tr className="bg-gray-50 dark:bg-bordeaux-950/40 text-bordeaux-800 dark:text-gold border-b dark:border-gold/10">
                <th className="py-4 px-5">IDENTIFICACIÓN</th>
                <th className="py-4 px-5">PERIODO ALQUILADO</th>
                <th className="py-4 px-5 text-center">OPERATIVA</th>
                <th className="py-4 px-5 text-center">ACCIONES</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {(reservations || []).filter(r => r.cliente.toLowerCase().includes(searchTerm.toLowerCase())).map(res => {
                  const isCloud = res.id.startsWith('CLOUD-R98-');
                  return (
                    <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-gold/5 transition-all">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          {isCloud && <div className="w-2.5 h-2.5 bg-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,1)]"></div>}
                          <div>
                              <p className="font-robust text-[11px] uppercase dark:text-white leading-none mb-1">{res.cliente}</p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{res.auto}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-tight text-gray-600 dark:text-white bg-gray-50 dark:bg-dark-elevated px-4 py-2 rounded-xl border dark:border-white/5 inline-flex">
                           <Calendar size={12} className="text-gold/50" />
                           <span>{res.inicio.split(' ')[0]}</span>
                           <ArrowRight size={10} className="text-gold" />
                           <span>{res.fin.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex justify-center gap-2">
                           <button onClick={() => handleOpenOpModal(res.id, 'delivery')} className={`p-2.5 rounded-xl border transition-all ${res.deliveryLog ? 'bg-green-500/10 border-green-500 text-green-500 shadow-sm' : 'bg-gray-50 dark:bg-dark-elevated border-gray-100 dark:border-white/5 text-gray-400 hover:text-gold'}`} title="Entrega">
                             <LogOut size={16}/>
                           </button>
                           <button onClick={() => handleOpenOpModal(res.id, 'reception')} className={`p-2.5 rounded-xl border transition-all ${res.receptionLog ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-sm' : 'bg-gray-50 dark:bg-dark-elevated border-gray-100 dark:border-white/5 text-gray-400 hover:text-gold'}`} title="Recepción">
                             <LogIn size={16}/>
                           </button>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button onClick={() => onDeleteReservation?.(res.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL OPERATIVO */}
      {opModal && opLog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-base/90 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-dark-card w-full max-w-2xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-2 border-gold/20">
            <div className="p-6 border-b dark:border-gold/10 flex justify-between items-center bg-white dark:bg-dark-card">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${opModal.type === 'delivery' ? 'bg-bordeaux-800 text-white' : 'bg-blue-600 text-white'}`}>
                  {opModal.type === 'delivery' ? <LogOut size={24}/> : <LogIn size={24}/>}
                </div>
                <div>
                  <h3 className="text-xl font-robust text-bordeaux-950 dark:text-white uppercase italic">{opModal.type === 'delivery' ? 'Acta de Entrega' : 'Acta de Recepción'}</h3>
                  <p className="text-[9px] font-black text-gold uppercase tracking-widest">Protocolo Maestro JM Asociados</p>
                </div>
              </div>
              <button onClick={() => setOpModal(null)} className="p-3 text-gray-400"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2"><UserCheck size={12}/> Responsable Operativo</label>
                    <input type="text" placeholder="NOMBRE DEL OPERADOR" value={opLog.responsable} onChange={e => setOpLog({...opLog, responsable: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2"><Fuel size={12}/> Nivel de Combustible</label>
                    <div className="grid grid-cols-5 gap-1">
                      {['1/8', '1/4', '1/2', '3/4', 'Full'].map(f => (
                        <button key={f} onClick={() => setOpLog({...opLog, combustible: f as any})} className={`py-3 rounded-lg text-[9px] font-robust border transition-all ${opLog.combustible === f ? 'bg-gold border-gold text-dark-base shadow-lg scale-105' : 'bg-gray-50 dark:bg-dark-elevated border-gray-100 dark:border-white/5 text-gray-400'}`}>{f}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[8px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2"><Brush size={12}/> Higiene y Limpieza</label>
                   <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setOpLog({...opLog, limpiezaInterior: !opLog.limpiezaInterior})} className={`flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${opLog.limpiezaInterior ? 'bg-green-500/10 border-green-500 text-green-600' : 'bg-gray-50 dark:bg-dark-elevated border-gray-100 dark:border-white/5 text-gray-400'}`}>
                        {opLog.limpiezaInterior ? <CheckCircle2 size={14}/> : <Sparkles size={14}/>}
                        <span className="text-[9px] font-black uppercase">Interior</span>
                      </button>
                      <button onClick={() => setOpLog({...opLog, limpiezaExterior: !opLog.limpiezaExterior})} className={`flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${opLog.limpiezaExterior ? 'bg-green-500/10 border-green-500 text-green-600' : 'bg-gray-50 dark:bg-dark-elevated border-gray-100 dark:border-white/5 text-gray-400'}`}>
                        {opLog.limpiezaExterior ? <CheckCircle2 size={14}/> : <Droplets size={14}/>}
                        <span className="text-[9px] font-black uppercase">Exterior</span>
                      </button>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[8px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2"><PackageOpen size={12}/> Kit de Auxilio y Accesorios</label>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(opLog.auxilio).map(([key, val]) => (
                      <button key={key} onClick={() => setOpLog({...opLog, auxilio: {...opLog.auxilio, [key]: !val}})} className={`py-3 rounded-xl border text-[8px] font-black uppercase transition-all ${val ? 'bg-green-500/10 border-green-500 text-green-600' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
                        {key.replace(/([A-Z])/g, ' $1')}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2"><FileText size={12}/> Observaciones / Daños Detectados</label>
                <textarea value={opLog.observaciones} onChange={e => setOpLog({...opLog, observaciones: e.target.value})} placeholder="Describa rayones, ruidos o faltantes..." className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-3xl px-6 py-4 text-xs font-bold outline-none border dark:border-white/5 min-h-[100px]" />
              </div>
            </div>

            <div className="p-8 border-t dark:border-gold/10 bg-gray-50/50 dark:bg-dark-base">
              <button onClick={handleSaveOpLog} className={`w-full py-5 rounded-[2rem] font-robust text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${opLog.responsable ? 'bordeaux-gradient text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                <Save size={18}/> Finalizar Acta Operativa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN: FICHA TÉCNICA */}
      {activeSection === 'flota' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
          {flota.map(v => (
            <div key={v.id} className="bg-white dark:bg-dark-card rounded-3xl border dark:border-gold/10 p-5 space-y-4 shadow-sm relative group overflow-hidden">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-dark-base rounded-2xl p-2 border dark:border-white/5 flex items-center justify-center shrink-0 shadow-inner"><img src={v.img} className="max-w-full max-h-full object-contain" /></div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-robust font-speed text-bordeaux-950 dark:text-white uppercase italic truncate leading-none">{v.nombre}</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{v.placa}</p>
                  <div className="flex items-center gap-2 mt-2"><span className="text-[8px] font-black text-gold uppercase px-2 py-0.5 bg-gold/10 rounded-full">{v.kilometrajeActual?.toLocaleString() || 0} KM</span></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-gray-500 uppercase">
                 <div className="p-2 bg-gray-50 dark:bg-dark-elevated rounded-xl border dark:border-white/5"><p className="text-gray-400">Precio Diaria</p><p className="text-bordeaux-800 dark:text-gold">R$ {v.precio.toFixed(2)}</p></div>
                 <div className="p-2 bg-gray-50 dark:bg-dark-elevated rounded-xl border dark:border-white/5"><p className="text-gray-400">Seguro Vence</p><p className="text-bordeaux-800 dark:text-gold">{v.seguroVence || '---'}</p></div>
              </div>
              <button onClick={() => setEditingVehicle(v)} className="w-full flex items-center justify-center gap-2 py-3 bg-bordeaux-950 text-gold rounded-xl text-[9px] font-robust border border-gold/20 active:scale-95 transition-all"><Wrench size={12}/> AJUSTES TÉCNICOS</button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL AJUSTES TÉCNICOS */}
      {editingVehicle && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-base/90 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-dark-card w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border-2 border-gold/20">
            <div className="p-6 border-b dark:border-gold/10 flex justify-between items-center bg-white dark:bg-dark-card">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gold/10 text-gold rounded-2xl"><Settings2 size={24}/></div>
                <div>
                  <h3 className="text-xl font-robust text-bordeaux-950 dark:text-white uppercase italic">Configuración de Unidad</h3>
                  <p className="text-[9px] font-black text-gold uppercase tracking-widest">Editor de Activos Maestro</p>
                </div>
              </div>
              <button onClick={() => setEditingVehicle(null)} className="p-3 text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-bordeaux-800 dark:text-gold uppercase tracking-[0.4em] border-b pb-2 flex items-center gap-2"><Type size={14}/> Datos Principales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase ml-2">Nombre de la Unidad</label>
                    <input type="text" value={editingVehicle.nombre} onChange={e => setEditingVehicle({...editingVehicle, nombre: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase ml-2">Precio Diaria (BRL)</label>
                    <input type="number" step="0.01" value={editingVehicle.precio} onChange={e => setEditingVehicle({...editingVehicle, precio: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase ml-2">Placa de Identificación</label>
                    <input type="text" value={editingVehicle.placa} onChange={e => setEditingVehicle({...editingVehicle, placa: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase ml-2">URL Imagen del Vehículo</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                      <input type="text" value={editingVehicle.img} onChange={e => setEditingVehicle({...editingVehicle, img: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-bordeaux-800 dark:text-gold uppercase tracking-[0.4em] border-b pb-2 flex items-center gap-2"><CreditCard size={14}/> Finanzas y Tiempos</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-2">KM Actual</label><input type="number" value={editingVehicle.kilometrajeActual || 0} onChange={e => setEditingVehicle({...editingVehicle, kilometrajeActual: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" /></div>
                      <div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-2">Service (KM)</label><input type="number" value={editingVehicle.mantenimientoKM || 0} onChange={e => setEditingVehicle({...editingVehicle, mantenimientoKM: parseInt(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-2">Seguro Vence</label><input type="date" value={editingVehicle.seguroVence || ''} onChange={e => setEditingVehicle({...editingVehicle, seguroVence: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" /></div>
                      <div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-2">Cuota Vence</label><input type="date" value={editingVehicle.vencimientoCuota || ''} onChange={e => setEditingVehicle({...editingVehicle, vencimientoCuota: e.target.value})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-2">Cuota Seguro ($)</label><input type="number" value={editingVehicle.cuotaSeguro || 0} onChange={e => setEditingVehicle({...editingVehicle, cuotaSeguro: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" /></div>
                      <div className="space-y-1"><label className="text-[8px] font-black text-gray-400 uppercase ml-2">Cuota Manto. ($)</label><input type="number" value={editingVehicle.cuotaMantenimiento || 0} onChange={e => setEditingVehicle({...editingVehicle, cuotaMantenimiento: parseFloat(e.target.value)})} className="w-full bg-gray-50 dark:bg-dark-elevated dark:text-white rounded-2xl px-6 py-4 text-xs font-bold outline-none" /></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-bordeaux-800 dark:text-gold uppercase tracking-[0.4em] border-b pb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Protocolo Servicio</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: 'aceite', label: 'Cambio de Aceite', icon: Droplets },
                      { key: 'filtroAceite', label: 'Filtro de Aceite', icon: Filter },
                      { key: 'filtroAire', label: 'Filtro Aire/Cabina', icon: Filter },
                      { key: 'frenos', label: 'Pastillas Freno', icon: Disc },
                      { key: 'alineacion', label: 'Alineación', icon: Gauge },
                      { key: 'limpieza', label: 'Higiene Total', icon: Sparkles }
                    ].map((item) => {
                      const isChecked = editingVehicle.serviceChecklist?.[item.key as keyof Required<Vehicle>['serviceChecklist']];
                      return (
                        <button key={item.key} onClick={() => toggleChecklist(item.key as any)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isChecked ? 'bg-green-500/10 border-green-500 text-green-600 shadow-sm' : 'bg-gray-50 dark:bg-dark-elevated border-gray-100 dark:border-white/5 text-gray-400'}`}>
                          <div className="flex items-center gap-3"><item.icon size={16} /><span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span></div>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-white/10'}`}>{isChecked && <CheckCircle2 size={14} />}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t dark:border-gold/10 bg-gray-50/50 dark:bg-dark-base flex gap-4">
              <button onClick={() => handleUpdateVehicle(editingVehicle)} className="flex-1 bordeaux-gradient text-white py-5 rounded-[2rem] font-robust text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                <Save size={18}/> Guardar Cambios Técnicos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN: BALANCE FINANCIERO */}
      {activeSection === 'finanzas' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border-l-8 border-l-bordeaux-800 shadow-sm"><p className="text-[8px] font-bold text-gray-400 uppercase mb-1">BRUTO TOTAL (BRL)</p><h4 className="text-2xl font-robust text-bordeaux-950 dark:text-white leading-none">R$ {stats.totalBRL.toFixed(2)}</h4></div>
            <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border-l-8 border-l-gold shadow-sm"><p className="text-[8px] font-bold text-gray-400 uppercase mb-1">BALANCE GS (DNIT)</p><h4 className="text-2xl font-robust text-gold leading-none">Gs. {(stats.totalBRL * exchangeRate).toLocaleString()}</h4></div>
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-[2.5rem] border dark:border-gold/10 h-[300px] shadow-sm">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                 <XAxis dataKey="name" axisLine={false} tick={{ fill: '#D4AF37', fontSize: 10, fontWeight: '900' }} />
                 <YAxis hide />
                 <Tooltip cursor={{ fill: '#D4AF3710' }} contentStyle={{ borderRadius: '15px', backgroundColor: '#0a0101', border: '1px solid #D4AF37', color: '#fff', fontSize: '9px', fontWeight: 'bold' }} />
                 <Bar dataKey="ingresos" fill="#800000" radius={[10, 10, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
