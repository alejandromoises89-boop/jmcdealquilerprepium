
import React, { useState, useMemo } from 'react';
import { Vehicle, Reservation, Gasto, Breakdown } from '../types';
import { 
  RefreshCw, Car, ShieldCheck, TrendingUp, Search, 
  Activity, Settings2, CheckCircle2, 
  Wrench, Key, DollarSign, Tag, Trash2, Edit3, Save, X,
  Calendar, CreditCard, HeartPulse, AlertCircle, Sparkles,
  ChevronRight, ArrowUpRight, Receipt, PieChart, FileText
} from 'lucide-react';

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
  const [activeSection, setActiveSection] = useState<'finanzas' | 'flota' | 'reservas' | 'gastos'>('finanzas');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [tempVehicleData, setTempVehicleData] = useState<Partial<Vehicle>>({});

  // Auxiliares para manejo de fechas
  const toInputDate = (str?: string) => {
    if (!str) return "";
    if (str.includes('-') && str.split('-')[0].length === 4) return str;
    const parts = str.split(/[/-]/);
    if (parts.length !== 3) return "";
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const toDisplayDate = (str?: string) => {
    if (!str) return "";
    if (str.includes('/') && str.split('/')[2].length === 4) return str;
    const parts = str.split(/[/-]/);
    if (parts.length !== 3) return "";
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  };

  const filteredReservations = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return reservations.filter(r => 
      r.cliente.toLowerCase().includes(lower) || 
      r.auto.toLowerCase().includes(lower) ||
      r.id.toLowerCase().includes(lower)
    );
  }, [reservations, searchTerm]);

  const filteredGastos = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return gastos.filter(g => 
      g.concepto.toLowerCase().includes(lower) || 
      g.categoria.toLowerCase().includes(lower)
    );
  }, [gastos, searchTerm]);

  const totalIngresos = reservations.reduce((acc, curr) => acc + (curr.status === 'Cancelled' ? 0 : curr.total), 0);
  const totalGastos = gastos.reduce((acc, curr) => acc + curr.monto, 0);
  const balanceNeto = totalIngresos - totalGastos;

  const calculateDesgaste = (vehicleName: string) => {
    const simpleTarget = vehicleName.toLowerCase().replace(/toyota|hyundai|blanco|negro|gris/g, '').trim();
    const vehicleRes = reservations.filter(r => (r.auto || "").toLowerCase().includes(simpleTarget) && r.status !== 'Cancelled');
    
    let totalDays = 0;
    vehicleRes.forEach(r => {
      const partsStart = r.inicio.split(' ')[0].split(/[/-]/);
      const partsEnd = r.fin.split(' ')[0].split(/[/-]/);
      
      const start = partsStart[0].length === 4 
        ? new Date(parseInt(partsStart[0]), parseInt(partsStart[1]) - 1, parseInt(partsStart[2]))
        : new Date(parseInt(partsStart[2]), parseInt(partsStart[1]) - 1, parseInt(partsStart[0]));
        
      const end = partsEnd[0].length === 4 
        ? new Date(parseInt(partsEnd[0]), parseInt(partsEnd[1]) - 1, parseInt(partsEnd[2]))
        : new Date(parseInt(partsEnd[2]), parseInt(partsEnd[1]) - 1, parseInt(partsEnd[0]));

      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += Math.max(1, diff);
    });

    return Math.min(100, Math.round((totalDays / 50) * 100));
  };

  const handleStatusChange = (vehicleId: string, newStatus: Vehicle['estado']) => {
    const updatedFlota = flota.map(v => v.id === vehicleId ? { ...v, estado: newStatus } : v);
    setFlota(updatedFlota);
  };

  const startEditing = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setTempVehicleData({ ...vehicle });
  };

  const saveVehicleChanges = () => {
    if (!editingVehicleId) return;
    const updatedFlota = flota.map(v => v.id === editingVehicleId ? { ...v, ...tempVehicleData } as Vehicle : v);
    setFlota(updatedFlota);
    setEditingVehicleId(null);
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-8 mt-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bordeaux-950 text-gold rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl">
            <ShieldCheck size={14}/> JM INTELLIGENCE HUB
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-bordeaux-950 tracking-tight italic">
            Gestión <span className="text-gold">Corporativa</span>
          </h2>
        </div>
        <button 
          onClick={onSyncSheet} 
          disabled={isSyncing} 
          className="px-8 py-4 bg-bordeaux-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-bordeaux-950 transition-all shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={16}/> 
          {isSyncing ? 'Sincronizando...' : 'Actualizar Nodo Cloud'}
        </button>
      </div>

      {/* Navigation Tabs - Estética de Lujo */}
      <div className="flex bg-gray-50/80 backdrop-blur-md p-2 rounded-[2.5rem] border border-gray-100 overflow-x-auto scrollbar-hide shadow-inner">
        {[
          { id: 'finanzas', label: 'Resumen Financiero', icon: PieChart },
          { id: 'flota', label: 'Estatus Unidades', icon: Car },
          { id: 'reservas', label: 'Registro Reservas', icon: Calendar },
          { id: 'gastos', label: 'Control Gastos', icon: Receipt }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveSection(tab.id as any)} 
            className={`relative flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
              activeSection === tab.id ? 'text-white' : 'text-gray-400 hover:text-bordeaux-800'
            }`}
          >
            {activeSection === tab.id && (
              <div className="absolute inset-0 bordeaux-gradient rounded-[2rem] shadow-lg animate-fadeIn"></div>
            )}
            <tab.icon size={16} className="relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {activeSection === 'finanzas' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-4 hover:shadow-2xl transition-all border-l-4 border-l-green-500">
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingresos Brutos</p>
                   <ArrowUpRight className="text-green-500" size={20} />
                </div>
                <h4 className="text-4xl font-black text-bordeaux-950 tracking-tighter">R$ {totalIngresos.toLocaleString()}</h4>
                <p className="text-xs font-bold text-gold">Gs. {(totalIngresos * exchangeRate).toLocaleString()}</p>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-4 hover:shadow-2xl transition-all border-l-4 border-l-red-500">
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gastos Operativos</p>
                   <TrendingUp className="text-red-500 rotate-180" size={20} />
                </div>
                <h4 className="text-4xl font-black text-bordeaux-950 tracking-tighter">R$ {totalGastos.toLocaleString()}</h4>
                <p className="text-xs font-bold text-gold">Gs. {(totalGastos * exchangeRate).toLocaleString()}</p>
              </div>
              <div className="bordeaux-gradient p-10 rounded-[3rem] shadow-2xl space-y-4 hover:scale-[1.02] transition-all">
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black text-gold/60 uppercase tracking-widest">Balance Neto</p>
                   <Sparkles className="text-gold" size={20} />
                </div>
                <h4 className="text-4xl font-black text-white tracking-tighter">R$ {balanceNeto.toLocaleString()}</h4>
                <p className="text-xs font-bold text-gold/80">Rendimiento Mensual VIP</p>
              </div>
            </div>

            {/* Sub-Resumen Gráfico o Informativo */}
            <div className="bg-gray-50 p-10 rounded-[4rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-gold shadow-lg">
                     <Activity size={32} />
                  </div>
                  <div className="space-y-1">
                     <h5 className="text-xl font-serif font-bold text-bordeaux-950">Salud de la Flota</h5>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monitoreo de disponibilidad en tiempo real</p>
                  </div>
               </div>
               <div className="flex gap-10">
                  <div className="text-center">
                     <p className="text-3xl font-black text-bordeaux-950">{flota.filter(v => v.estado === 'Disponible').length}</p>
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Disponibles</p>
                  </div>
                  <div className="text-center">
                     <p className="text-3xl font-black text-gold">{flota.filter(v => v.estado === 'En Alquiler').length}</p>
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">En Ruta</p>
                  </div>
                  <div className="text-center">
                     <p className="text-3xl font-black text-red-600">{flota.filter(v => v.estado === 'En Taller').length}</p>
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mantenimiento</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeSection === 'flota' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            {flota.map((vehicle) => {
              const desgaste = calculateDesgaste(vehicle.nombre);
              return (
                <div key={vehicle.id} className="bg-white rounded-[3.5rem] border border-gray-100 shadow-xl overflow-hidden p-10 space-y-8 group hover:border-gold/20 transition-all duration-700">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-48 h-48 bg-gray-50 rounded-[3rem] p-6 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-700">
                      <img src={vehicle.img} alt={vehicle.nombre} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    </div>
                    
                    <div className="flex-1 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="text-3xl font-serif font-bold text-bordeaux-950 tracking-tight">{vehicle.nombre}</h3>
                          <div className="flex items-center gap-2">
                             <div className="px-3 py-1 bg-bordeaux-50 text-bordeaux-800 rounded-lg text-[9px] font-black uppercase tracking-widest">
                               {vehicle.placa}
                             </div>
                             <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{vehicle.color}</span>
                          </div>
                        </div>
                        <button onClick={() => startEditing(vehicle)} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-bordeaux-800 hover:bg-white hover:shadow-lg transition-all active:scale-90">
                          <Edit3 size={18} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                           <span className="flex items-center gap-2 text-gray-400"><HeartPulse size={14} className="text-red-500" /> Fatiga de Unidad</span>
                           <span className={desgaste > 80 ? 'text-red-600' : 'text-bordeaux-800'}>{desgaste}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                           <div 
                              className={`h-full transition-all duration-1000 ${desgaste > 80 ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]' : desgaste > 50 ? 'bg-orange-500' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]'}`} 
                              style={{ width: `${desgaste}%` }}
                           />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {['Disponible', 'En Taller', 'En Alquiler'].map((st) => (
                          <button 
                            key={st} 
                            onClick={() => handleStatusChange(vehicle.id, st as any)}
                            className={`flex-1 py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                              vehicle.estado === st 
                              ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-xl scale-105' 
                              : 'bg-white text-gray-300 border-gray-100 hover:bg-gray-50 hover:text-bordeaux-800'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {editingVehicleId === vehicle.id ? (
                    <div className="bg-gray-50/50 p-8 rounded-[2.5rem] space-y-8 animate-slideDown border border-gray-100">
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Seguro Expira</label>
                            <input 
                              type="date" 
                              value={toInputDate(tempVehicleData.seguroVence)} 
                              onChange={(e) => setTempVehicleData({...tempVehicleData, seguroVence: toDisplayDate(e.target.value)})} 
                              className="w-full px-5 py-4 rounded-2xl border-0 bg-white text-[11px] font-bold shadow-sm outline-none focus:ring-4 focus:ring-gold/10 transition-all" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Fee Seguro</label>
                            <input 
                              type="number" 
                              value={tempVehicleData.cuotaSeguro || 0} 
                              onChange={(e) => setTempVehicleData({...tempVehicleData, cuotaSeguro: parseFloat(e.target.value)})} 
                              className="w-full px-5 py-4 rounded-2xl border-0 bg-white text-[11px] font-bold shadow-sm outline-none focus:ring-4 focus:ring-gold/10 transition-all" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Próx. Service</label>
                            <input 
                              type="date" 
                              value={toInputDate(tempVehicleData.mantenimientoVence)} 
                              onChange={(e) => setTempVehicleData({...tempVehicleData, mantenimientoVence: toDisplayDate(e.target.value)})} 
                              className="w-full px-5 py-4 rounded-2xl border-0 bg-white text-[11px] font-bold shadow-sm outline-none focus:ring-4 focus:ring-gold/10 transition-all" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Costo Mant.</label>
                            <input 
                              type="number" 
                              value={tempVehicleData.cuotaMantenimiento || 0} 
                              onChange={(e) => setTempVehicleData({...tempVehicleData, cuotaMantenimiento: parseFloat(e.target.value)})} 
                              className="w-full px-5 py-4 rounded-2xl border-0 bg-white text-[11px] font-bold shadow-sm outline-none focus:ring-4 focus:ring-gold/10 transition-all" 
                            />
                          </div>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={saveVehicleChanges} className="flex-1 bordeaux-gradient text-white py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"><Save size={18} /> Consolidar Cambios</button>
                          <button onClick={() => setEditingVehicleId(null)} className="px-10 bg-white border border-gray-100 text-gray-400 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-all">Cancelar</button>
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-2 hover:bg-white transition-colors">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Seguro Vence</p>
                          <p className="text-[11px] font-bold text-bordeaux-950 flex items-center gap-2"><Calendar size={14} className="text-gold" /> {vehicle.seguroVence || '---'}</p>
                       </div>
                       <div className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-2 hover:bg-white transition-colors">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cuota Seguro</p>
                          <p className="text-[11px] font-bold text-bordeaux-950 flex items-center gap-2"><CreditCard size={14} className="text-gold" /> Gs. {vehicle.cuotaSeguro?.toLocaleString() || 0}</p>
                       </div>
                       <div className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-2 hover:bg-white transition-colors">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Próx. Mant.</p>
                          <p className="text-[11px] font-bold text-bordeaux-950 flex items-center gap-2"><Wrench size={14} className="text-gold" /> {vehicle.mantenimientoVence || 'Pendiente'}</p>
                       </div>
                       <div className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-2 hover:bg-white transition-colors">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Costo Mant.</p>
                          <p className="text-[11px] font-bold text-bordeaux-950 flex items-center gap-2"><DollarSign size={14} className="text-gold" /> Gs. {vehicle.cuotaMantenimiento?.toLocaleString() || 0}</p>
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TABLA DE RESERVAS PREMIUM */}
        {activeSection === 'reservas' && (
          <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-10 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/30">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-2xl font-serif font-bold text-bordeaux-950 italic">Libro de Reservas VIP</h3>
                <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em]">Protocolo de Clientes Platinum</p>
              </div>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gold transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Filtrar por nombre, auto o ID..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-14 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] outline-none text-[11px] font-black uppercase tracking-widest w-full md:w-80 shadow-sm focus:ring-4 focus:ring-gold/5 transition-all" 
                />
              </div>
            </div>
            <div className="overflow-x-auto airbnb-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bordeaux-gradient text-gold text-[10px] font-black uppercase tracking-[0.3em]">
                    <th className="px-10 py-7 rounded-tl-[3.5rem]">Expediente / Cliente</th>
                    <th className="px-10 py-7">Unidad Asignada</th>
                    <th className="px-10 py-7">Cronograma VIP</th>
                    <th className="px-10 py-7">Canon Arrendamiento</th>
                    <th className="px-10 py-7 rounded-tr-[3.5rem] text-center">Protocolo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredReservations.map(res => (
                    <tr key={res.id} className="group hover:bg-bordeaux-50/40 transition-all duration-500">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-bordeaux-800 font-black text-[10px] group-hover:bg-white shadow-sm border border-transparent group-hover:border-gold/20 transition-all">
                             {res.cliente.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-bordeaux-950 uppercase tracking-widest text-[11px] mb-0.5">{res.cliente}</p>
                            <p className="text-[9px] text-gray-400 font-bold">ID: {res.id} &bull; CI: {res.ci}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex items-center gap-3">
                            <Car size={16} className="text-gold opacity-50" />
                            <span className="font-black uppercase text-gray-600 tracking-wider text-[11px]">{res.auto}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-1">
                          <p className="font-black text-bordeaux-950 text-[10px] flex items-center gap-2">
                             <Calendar size={12} className="text-gold" /> {res.inicio}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 pl-5">Hasta: {res.fin}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-1">
                           <p className="font-black text-bordeaux-800 text-[12px]">R$ {res.total.toLocaleString()}</p>
                           <p className="text-[9px] font-bold text-gray-300">Gs. {(res.total * exchangeRate).toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                          res.status === 'Confirmed' || res.status === 'Requested' 
                          ? 'bg-green-50 text-green-600 border border-green-100' 
                          : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredReservations.length === 0 && (
                    <tr>
                       <td colSpan={5} className="px-10 py-32 text-center">
                          <div className="space-y-4">
                             <FileText size={48} className="mx-auto text-gray-100" />
                             <p className="text-gray-300 font-black uppercase tracking-[0.5em] text-[10px]">Sin expedientes registrados</p>
                          </div>
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABLA DE GASTOS PREMIUM */}
        {activeSection === 'gastos' && (
          <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-10 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/30">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-2xl font-serif font-bold text-bordeaux-950 italic">Control de Egresos</h3>
                <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em]">Auditoría de Gastos Operativos</p>
              </div>
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gold transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar por concepto o categoría..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-14 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] outline-none text-[11px] font-black uppercase tracking-widest w-full md:w-80 shadow-sm focus:ring-4 focus:ring-gold/5 transition-all" 
                />
              </div>
            </div>
            <div className="overflow-x-auto airbnb-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-gold text-[10px] font-black uppercase tracking-[0.3em]">
                    <th className="px-10 py-7">Concepto de Gasto</th>
                    <th className="px-10 py-7">Categoría Corporativa</th>
                    <th className="px-10 py-7">Fecha Registro</th>
                    <th className="px-10 py-7 text-right">Importe BRL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredGastos.map(g => (
                    <tr key={g.id} className="group hover:bg-gray-50 transition-all duration-300">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm">
                             <Receipt size={18} />
                          </div>
                          <p className="font-black text-bordeaux-950 uppercase tracking-widest text-[11px]">{g.concepto}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                         <span className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            {g.categoria}
                         </span>
                      </td>
                      <td className="px-10 py-8 font-bold text-gray-400 text-[10px]">
                        {g.fecha}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="space-y-0.5">
                           <p className="font-black text-red-600 text-[12px]">- R$ {g.monto.toLocaleString()}</p>
                           <p className="text-[9px] font-bold text-gray-300">Gs. {(g.monto * exchangeRate).toLocaleString()}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGastos.length === 0 && (
                    <tr>
                       <td colSpan={4} className="px-10 py-32 text-center">
                          <div className="space-y-4">
                             <Receipt size={48} className="mx-auto text-gray-100" />
                             <p className="text-gray-300 font-black uppercase tracking-[0.5em] text-[10px]">No se registran egresos en este nodo</p>
                          </div>
                       </td>
                    </tr>
                  )}
                </tbody>
                {filteredGastos.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50/50">
                       <td colSpan={3} className="px-10 py-8 text-right font-black text-bordeaux-950 uppercase tracking-[0.2em] text-[10px]">Total Egresos:</td>
                       <td className="px-10 py-8 text-right font-black text-red-600 text-lg">R$ {totalGastos.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
