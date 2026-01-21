
import React, { useState, useMemo } from 'react';
import { Vehicle, Reservation, Gasto, Breakdown } from '../types';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { 
  FileText, RefreshCw, Car, 
  ShieldCheck, Trash2, TrendingUp, Wallet,
  Eye, Search, ArrowRight,
  Wrench, Database, ExternalLink, MessageSquare, Plus, AlertTriangle,
  Edit3, History, Save, X, Bell, CheckCircle2, Settings2, MailCheck, BellRing, Activity
} from 'lucide-react';
import ContractDocument from './ContractDocument';
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
  breakdowns: Breakdown[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  flota, 
  setFlota, 
  reservations, 
  setReservations, 
  exchangeRate,
  onSyncSheet,
  isSyncing,
  breakdowns
}) => {
  const [activeSection, setActiveSection] = useState<'resumen' | 'flota' | 'monitoreo' | 'registros' | 'sheet' | 'settings'>('resumen');
  const [selectedContract, setSelectedContract] = useState<{res: Reservation, veh: Vehicle} | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReservations = useMemo(() => {
    if (!searchTerm) return reservations;
    const lower = searchTerm.toLowerCase();
    return reservations.filter(r => 
      r.cliente.toLowerCase().includes(lower) ||
      r.ci.toLowerCase().includes(lower) ||
      r.auto.toLowerCase().includes(lower) ||
      r.id.toLowerCase().includes(lower)
    );
  }, [reservations, searchTerm]);

  const totalIngresos = reservations.reduce((acc, curr) => acc + curr.total, 0);

  const tabs = [
    { id: 'resumen', label: 'Dashboard', icon: TrendingUp },
    { id: 'flota', label: 'Unidades', icon: Car },
    { id: 'monitoreo', label: 'Estado Técnico', icon: Activity },
    { id: 'registros', label: 'Alquileres', icon: FileText },
    { id: 'sheet', label: 'Cloud DB', icon: Database },
    { id: 'settings', label: 'Ajustes', icon: Settings2 },
  ];

  if (selectedContract) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <button onClick={() => setSelectedContract(null)} className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-2xl text-bordeaux-800 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-gray-50 transition-all shadow-sm">
          <ArrowRight className="rotate-180" size={18} /> Volver
        </button>
        <ContractDocument vehicle={selectedContract.veh} data={selectedContract.res} days={3} totalPYG={selectedContract.res.total * exchangeRate} signature={`Admin JM - Verified Console`} />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fadeIn pb-32 max-w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-gray-100 pb-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-bordeaux-950 text-gold rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl">
            <ShieldCheck size={20} className="text-gold" /> JM CONSOLE HUB 2026
          </div>
          <h2 className="text-5xl lg:text-7xl font-serif font-bold text-bordeaux-950 tracking-tighter">Gestión Maestro</h2>
        </div>
        <button onClick={onSyncSheet} disabled={isSyncing} className="flex items-center gap-4 px-10 py-5 bg-white border border-gray-100 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-gray-50 active:scale-95 transition-all">
          <RefreshCw size={22} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Refrescar DB' : 'Refrescar DB'}
        </button>
      </div>

      <div className="flex bg-gray-50/50 p-2 rounded-[3rem] border border-gray-100 overflow-x-auto airbnb-scrollbar">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id as any)} className={`relative flex items-center gap-4 px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 whitespace-nowrap ${activeSection === tab.id ? 'text-white' : 'text-gray-400 hover:text-bordeaux-800'}`}>
            {activeSection === tab.id && <div className="absolute inset-0 bordeaux-gradient z-0 rounded-[2.5rem] shadow-xl animate-fadeIn"></div>}
            <tab.icon size={18} className="relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-12">
        {activeSection === 'resumen' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Ingresos Totales', val: `R$ ${totalIngresos.toLocaleString()}`, sub: `Gs. ${(totalIngresos * exchangeRate).toLocaleString()}`, icon: Wallet, color: 'text-bordeaux-800' },
              { label: 'Unidades Activas', val: flota.length, sub: 'Flota 2026', icon: Car, color: 'text-gold' },
              { label: 'Reservas Activas', val: reservations.length, sub: 'Contratos Vigentes', icon: FileText, color: 'text-bordeaux-950' },
              { label: 'Incidentes', val: breakdowns.length, sub: 'Taller / Soporte', icon: AlertTriangle, color: 'text-red-600' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-xl transition-all">
                <stat.icon className={`${stat.color}`} size={32} />
                <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{stat.label}</p>
                  <h4 className="text-3xl font-black text-bordeaux-950">{stat.val}</h4>
                  <p className="text-[10px] font-bold text-gold uppercase">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'flota' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slideUp">
            {flota.map(v => (
              <div key={v.id} className="bg-white rounded-[3.5rem] border border-gray-100 overflow-hidden shadow-sm flex flex-col md:flex-row hover:shadow-xl transition-all">
                <div className="md:w-2/5 aspect-video md:aspect-auto bg-gray-50 p-8 flex items-center justify-center">
                   <img src={v.img} className="max-w-[120%] object-contain mix-blend-multiply" alt={v.nombre} />
                </div>
                <div className="md:w-3/5 p-10 space-y-6">
                   <div>
                      <h4 className="text-2xl font-serif font-bold text-bordeaux-950">{v.nombre}</h4>
                      <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em]">{v.placa}</p>
                   </div>
                   <div className="flex gap-4">
                      <button className="flex-1 py-4 bg-gray-50 text-bordeaux-950 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-bordeaux-50 transition-all">Editar Ficha</button>
                      <button className="flex-1 py-4 bg-gray-50 text-bordeaux-950 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-bordeaux-50 transition-all">Ver Historial</button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'monitoreo' && (
          <div className="space-y-12 animate-slideUp">
             <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-2xl">
                <div className="flex items-center gap-6 mb-12">
                   <Activity size={40} className="text-bordeaux-800" />
                   <div>
                      <h3 className="text-3xl font-serif font-bold text-bordeaux-950">Monitoreo Técnico Maestro</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Alertas de Mantenimiento y Seguros</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                   {flota.map(v => (
                     <div key={v.id} className="flex items-center justify-between p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                        <div className="flex items-center gap-8">
                           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                              <img src={v.img} className="h-10 w-auto mix-blend-multiply" alt="V" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-bordeaux-950">{v.nombre}</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{v.placa}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-12">
                           <div className="text-right">
                              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Prox. Service</p>
                              <p className="text-sm font-bold text-bordeaux-800">{v.mantenimientoVence || 'Pendiente'}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Seguro Vence</p>
                              <p className="text-sm font-bold text-gold">{v.seguroVence || 'Pendiente'}</p>
                           </div>
                           <div className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${v.estado === 'Disponible' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {v.estado}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeSection === 'registros' && (
          <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden animate-slideUp">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">ID</th>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Titular</th>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Unidad</th>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Monto</th>
                    <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[12px] font-bold">
                  {filteredReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50/40 transition-all">
                      <td className="px-10 py-8 text-gray-300 uppercase font-black">#JM-{res.id.slice(-6)}</td>
                      <td className="px-10 py-8 uppercase text-bordeaux-950 font-black">{res.cliente}</td>
                      <td className="px-10 py-8 text-gold uppercase">{res.auto}</td>
                      <td className="px-10 py-8 text-bordeaux-800">R$ {res.total}</td>
                      <td className="px-10 py-8">
                        <div className="flex justify-center gap-3">
                          <button className="p-4 bg-bordeaux-50 text-bordeaux-800 rounded-2xl hover:bg-bordeaux-800 hover:text-white transition-all"><Eye size={18} /></button>
                          <button className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'sheet' && (
          <div className="bg-white rounded-[4.5rem] border-[12px] border-gray-50 shadow-2xl overflow-hidden h-[850px] w-full animate-fadeIn">
             <iframe src={`${GOOGLE_SHEET_EMBED_URL}&rm=minimal`} className="w-full h-full border-none" title="Google Sheets"></iframe>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
