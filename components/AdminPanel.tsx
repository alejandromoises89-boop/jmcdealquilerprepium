
import React, { useState, useMemo, useEffect } from 'react';
import { Vehicle, Reservation, Gasto } from '../types';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { 
  FileText, RefreshCw, Car, 
  ShieldCheck, Trash2, TrendingUp, Wallet,
  Download, Eye, Search, Info, ArrowRight,
  Wrench, Bell, Database, ExternalLink, MessageSquare, Plus, AlertTriangle
} from 'lucide-react';
import ContractDocument from './ContractDocument';
import VehicleCard from './VehicleCard';
import { GOOGLE_SHEET_EMBED_URL } from '../constants';

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
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  flota, 
  setFlota, 
  reservations, 
  setReservations, 
  exchangeRate,
  onSyncSheet,
  isSyncing 
}) => {
  const [activeSection, setActiveSection] = useState<'resumen' | 'flota' | 'registros' | 'mantenimiento' | 'sheet'>('resumen');
  const [selectedContract, setSelectedContract] = useState<{res: Reservation, veh: Vehicle} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState(true);

  const totalIngresos = reservations.reduce((acc, curr) => acc + curr.total, 0);

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => 
      r.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.auto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ci.includes(searchTerm)
    ).sort((a,b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
  }, [reservations, searchTerm]);

  const updateVehicleStatus = (id: string, newStatus: Vehicle['estado']) => {
    const updatedFlota = flota.map(v => v.id === id ? { ...v, estado: newStatus } : v);
    setFlota(updatedFlota);
    localStorage.setItem('jm_flota', JSON.stringify(updatedFlota));
  };

  const handleManualDateUpdate = (id: string, field: 'mantenimientoVence' | 'seguroVence', value: string) => {
    const updatedFlota = flota.map(v => v.id === id ? { ...v, [field]: value } : v);
    setFlota(updatedFlota);
    localStorage.setItem('jm_flota', JSON.stringify(updatedFlota));
  };

  const handleDeleteReservation = (id: string) => {
    if (window.confirm("¿Confirma la eliminación definitiva de este registro de alquiler?")) {
      const updated = reservations.filter(r => r.id !== id);
      setReservations(updated);
      localStorage.setItem('jm_reservations', JSON.stringify(updated));
    }
  };

  const tabs = [
    { id: 'resumen', label: 'Dashboard', icon: TrendingUp },
    { id: 'flota', label: 'Inventario', icon: Car },
    { id: 'registros', label: 'Contratos', icon: FileText },
    { id: 'mantenimiento', label: 'Técnico', icon: Wrench },
    { id: 'sheet', label: 'Live Data', icon: Database },
  ];

  if (selectedContract) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <button 
          onClick={() => setSelectedContract(null)} 
          className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-2xl text-bordeaux-800 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-gray-50 transition-all shadow-sm"
        >
          <ArrowRight className="rotate-180" size={18} /> Volver al Listado
        </button>
        <ContractDocument 
          vehicle={selectedContract.veh} 
          data={selectedContract.res} 
          days={3} 
          totalPYG={selectedContract.res.total * exchangeRate} 
          signature={`Admin JM - Verified Console`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-fadeIn pb-32 max-w-full overflow-hidden">
      {/* Admin Header Elite */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-12 border-b border-gray-100">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-bordeaux-950 text-gold rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl border border-white/5">
            <ShieldCheck size={20} className="animate-pulse" /> JM CONSOLE HUB 2026
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl lg:text-7xl font-serif font-bold text-bordeaux-950 tracking-tighter leading-none">Gestión Maestro</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.4em]">Control Operativo de Flota de Lujo</p>
          </div>
        </div>
        
        <button 
          onClick={onSyncSheet} 
          disabled={isSyncing} 
          className="flex items-center justify-center gap-4 px-12 py-6 bg-white border border-gray-100 text-bordeaux-800 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all hover:bg-gray-50"
        >
          <RefreshCw size={22} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Sincronizando...' : 'Refrescar Planilla Corporativa'}
        </button>
      </div>

      {/* Styled Tabs */}
      <div className="flex bg-gray-50/50 p-2 rounded-[3rem] border border-gray-100 max-w-full overflow-x-auto airbnb-scrollbar shadow-inner">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveSection(tab.id as any)} 
            className={`relative flex items-center gap-4 px-12 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-700 whitespace-nowrap ${
              activeSection === tab.id ? 'text-white' : 'text-gray-400 hover:text-bordeaux-800'
            }`}
          >
            {activeSection === tab.id && (
              <div className="absolute inset-0 bordeaux-gradient z-0 rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(128,0,0,0.4)] animate-fadeIn"></div>
            )}
            <tab.icon size={18} className="relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-16">
        {activeSection === 'resumen' && (
          <div className="space-y-16 animate-slideUp">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Ingresos Acumulados', val: `R$ ${totalIngresos.toLocaleString()}`, sub: `Gs. ${(totalIngresos * exchangeRate).toLocaleString()}`, icon: Wallet, color: 'text-bordeaux-800' },
                { label: 'Unidades Activas', val: flota.length, sub: 'Flota 100% JM', icon: Car, color: 'text-gold' },
                { label: 'Registros Totales', val: reservations.length, sub: 'Histórico 2026', icon: FileText, color: 'text-blue-600' },
                { label: 'Estado Técnico', val: flota.filter(v => v.estado === 'En Taller').length, sub: 'Unidades en Taller', icon: AlertTriangle, color: 'text-orange-600' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-5 hover:shadow-xl transition-all">
                  <stat.icon className={`${stat.color}`} size={36} />
                  <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{stat.label}</p>
                    <h4 className="text-3xl font-black text-bordeaux-950">{stat.val}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-widest">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-10 lg:p-16 rounded-[4.5rem] border border-gray-100 shadow-sm space-y-10 overflow-hidden">
               <h4 className="text-[11px] font-black text-bordeaux-950 uppercase tracking-[0.6em] flex items-center gap-5"><TrendingUp size={24} className="text-gold" /> Desempeño Financiero Corporativo</h4>
               <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Semana 1', total: totalIngresos * 0.15 },
                      { name: 'Semana 2', total: totalIngresos * 0.45 },
                      { name: 'Semana 3', total: totalIngresos * 0.75 },
                      { name: 'Semana 4', total: totalIngresos },
                    ]}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#800000" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#800000" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '25px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="total" stroke="#800000" strokeWidth={5} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        )}

        {activeSection === 'flota' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-slideUp">
            {flota.map(v => (
              <VehicleCard 
                key={v.id} 
                vehicle={v} 
                exchangeRate={exchangeRate} 
                reservations={reservations} 
                onSelect={() => {}} 
                isAdmin={true} 
              />
            ))}
          </div>
        )}

        {activeSection === 'registros' && (
          <div className="space-y-12 animate-slideUp">
            <div className="relative group max-w-2xl">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="Filtrar por nombre, CI o vehículo asignado..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-20 pr-10 py-7 bg-white border border-gray-100 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-bordeaux-50 shadow-sm font-bold text-lg"
              />
            </div>

            <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto airbnb-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Titular</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Unidad</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Periodo</th>
                      <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-[12px] font-bold">
                    {filteredReservations.map((res) => {
                      const veh = flota.find(v => v.nombre.toLowerCase().includes(res.auto.toLowerCase()) || res.auto.toLowerCase().includes(v.nombre.toLowerCase())) || flota[0];
                      return (
                        <tr key={res.id} className="hover:bg-gray-50/40 transition-all">
                          <td className="px-10 py-8 text-gray-300 uppercase font-black">#JM-{res.id.slice(-6)}</td>
                          <td className="px-10 py-8 uppercase text-bordeaux-950 font-black">{res.cliente} <span className="block text-[10px] text-gray-400 font-bold">{res.ci}</span></td>
                          <td className="px-10 py-8 text-gold uppercase">{res.auto}</td>
                          <td className="px-10 py-8 text-gray-500">{res.inicio.split(' ')[0]} al {res.fin.split(' ')[0]}</td>
                          <td className="px-10 py-8">
                            <div className="flex justify-center gap-3">
                              <button 
                                onClick={() => setSelectedContract({res, veh})}
                                className="p-4 bg-bordeaux-50 text-bordeaux-800 rounded-2xl hover:bg-bordeaux-800 hover:text-white transition-all shadow-sm"
                              >
                                <Eye size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteReservation(res.id)}
                                className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'mantenimiento' && (
           <div className="space-y-10 animate-slideUp">
             <div className="bg-white p-10 lg:p-16 rounded-[4.5rem] border border-gray-100 shadow-2xl space-y-12">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                   <div className="space-y-3 text-center lg:text-left">
                      <h4 className="text-[12px] font-black text-bordeaux-950 uppercase tracking-[0.5em] flex items-center justify-center lg:justify-start gap-4"><Wrench size={28} className="text-gold" /> Mantenimiento Corporativo</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gestión técnica exclusiva para personal administrativo JM.</p>
                   </div>
                   <div className="flex items-center gap-5 bg-gray-50 px-8 py-5 rounded-[2rem] border border-gray-100 shadow-inner">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alertas Auto</span>
                      <button 
                        onClick={() => setAutoNotifyEnabled(!autoNotifyEnabled)}
                        className={`w-14 h-7 rounded-full transition-all relative ${autoNotifyEnabled ? 'bg-green-600 shadow-[0_0_15px_rgba(22,163,74,0.4)]' : 'bg-gray-300'}`}
                      >
                         <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${autoNotifyEnabled ? 'left-8' : 'left-1'}`}></div>
                      </button>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {flota.map(v => (
                      <div key={v.id} className="bg-gray-50/50 p-10 rounded-[3.5rem] border border-gray-100 space-y-10 group hover:bg-white hover:shadow-2xl transition-all duration-700">
                         <div className="flex items-center justify-between border-b border-gray-100/50 pb-8">
                            <div className="flex items-center gap-6">
                               <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                  <img src={v.img} className="w-14 h-14 object-contain mix-blend-multiply" alt="" />
                               </div>
                               <div>
                                  <p className="text-base font-black text-bordeaux-950">{v.nombre}</p>
                                  <p className="text-[11px] font-black text-gold uppercase tracking-[0.3em]">{v.placa}</p>
                               </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                               <select 
                                 value={v.estado}
                                 onChange={(e) => updateVehicleStatus(v.id, e.target.value as any)}
                                 className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border transition-all shadow-sm ${
                                   v.estado === 'Disponible' ? 'bg-green-50 text-green-600 border-green-200' : v.estado === 'En Taller' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-red-50 text-red-600 border-red-200'
                                 }`}
                               >
                                  <option value="Disponible">Disponible</option>
                                  <option value="En Taller">Taller</option>
                                  <option value="En Alquiler">Alquiler</option>
                               </select>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] ml-3 flex items-center gap-2"><Wrench size={14}/> Service Vence</label>
                               <input 
                                 type="text" 
                                 value={v.mantenimientoVence} 
                                 onChange={(e) => handleManualDateUpdate(v.id, 'mantenimientoVence', e.target.value)}
                                 className="w-full px-6 py-5 bg-white border border-gray-100 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-bordeaux-800 shadow-inner"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] ml-3 flex items-center gap-2"><ShieldCheck size={14}/> Seguro Vence</label>
                               <input 
                                 type="text" 
                                 value={v.seguroVence} 
                                 onChange={(e) => handleManualDateUpdate(v.id, 'seguroVence', e.target.value)}
                                 className="w-full px-6 py-5 bg-white border border-gray-100 rounded-2xl font-black text-xs outline-none focus:ring-2 focus:ring-bordeaux-800 shadow-inner"
                               />
                            </div>
                         </div>
                         
                         <button 
                           onClick={() => alert(`Reporte técnico enviado para la unidad ${v.nombre} al WhatsApp oficial JM...`)}
                           className="w-full py-5 bg-bordeaux-950 text-white rounded-[2rem] flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-black transition-all shadow-xl"
                         >
                            <MessageSquare size={18} className="text-gold" /> Notificar WhatsApp
                         </button>
                      </div>
                   ))}
                </div>
             </div>
           </div>
        )}

        {activeSection === 'sheet' && (
           <div className="space-y-12 animate-fadeIn">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                 <div className="space-y-3 text-center lg:text-left">
                    <h3 className="text-3xl font-serif font-bold text-bordeaux-950">Vista Base de Datos Corporativa</h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center lg:justify-start gap-4">
                       <Database size={20} className="text-gold" /> Sincronización Directa con Google Sheets (Reservas)
                    </p>
                 </div>
                 <a 
                    href={GOOGLE_SHEET_EMBED_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 px-12 py-6 bg-bordeaux-800 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl hover:bg-bordeaux-950 transition-all active:scale-95"
                 >
                    <ExternalLink size={22} /> Editar Planilla Maestra
                 </a>
              </div>
              <div className="bg-white rounded-[4.5rem] border-[12px] border-gray-50 shadow-2xl overflow-hidden h-[850px] w-full relative">
                 <iframe 
                    src={`${GOOGLE_SHEET_EMBED_URL}&rm=minimal`} 
                    className="w-full h-full border-none"
                    title="Google Sheets Database"
                 ></iframe>
                 <div className="absolute top-0 left-0 right-0 h-1.5 gold-shine opacity-30"></div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
