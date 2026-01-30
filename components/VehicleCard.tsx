
import React, { useState, useMemo } from 'react';
import { Vehicle, Reservation } from '../types';
import { TRANSLATIONS, Language } from '../constants';
import { 
  CheckCircle2, Clock, Info, Calendar, 
  ShieldAlert, Settings2, Users, Fuel, Gauge, Zap,
  Cpu, Award, ShieldCheck, AlertTriangle, AlertCircle, Calculator, Wrench
} from 'lucide-react';
import AvailabilityCalendar from './AvailabilityCalendar';

interface VehicleCardProps {
  vehicle: Vehicle;
  exchangeRate: number;
  reservations: Reservation[];
  onSelect: (start?: Date, end?: Date) => void;
  isAdmin?: boolean;
  language?: Language;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, exchangeRate, reservations, onSelect, isAdmin, language = 'es' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  
  // Calculator State
  const [calcStart, setCalcStart] = useState('');
  const [calcEnd, setCalcEnd] = useState('');

  const t = TRANSLATIONS[language];
  const isAvailable = vehicle.estado === 'Disponible';
  const isRented = vehicle.estado === 'En Alquiler';
  const pricePYG = Math.round(vehicle.precio * exchangeRate);
  
  const getStatusStyle = () => {
    if (isAvailable) return {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
      icon: CheckCircle2,
      label: 'Disponible'
    };
    if (isRented) return {
      badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
      icon: Clock,
      label: 'En Alquiler'
    };
    return {
      badge: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
      icon: Wrench,
      label: 'En Taller'
    };
  };

  const statusStyle = getStatusStyle();
  const StatusIcon = statusStyle.icon;

  const estimatedCost = useMemo(() => {
    if (!calcStart || !calcEnd) return null;
    const s = new Date(calcStart);
    const e = new Date(calcEnd);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    if (diffDays < 1) return null;
    
    const totalBRL = diffDays * vehicle.precio;
    const totalPYG = totalBRL * exchangeRate;
    return { days: diffDays, brl: totalBRL, pyg: totalPYG };
  }, [calcStart, calcEnd, vehicle.precio, exchangeRate]);

  return (
    <div 
      className={`group relative bg-white dark:bg-dark-card rounded-[3.8rem] overflow-hidden transition-all duration-700 cursor-pointer border-2 ${
        isHovered ? 'border-gold shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] scale-[1.01]' : 'border-gray-100 dark:border-white/5 shadow-2xl'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => isAvailable && onSelect()}
    >
      {/* IMAGEN PRINCIPAL */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-50 dark:bg-dark-base flex items-center justify-center p-8">
        <img src={vehicle.img} className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-transform duration-1000 group-hover:scale-110" alt={vehicle.nombre} />
        
        {/* Badge de Estado Superior */}
        <div className="absolute top-8 left-8 z-30 flex flex-col gap-2">
          <div className={`px-5 py-2 rounded-2xl text-[9px] font-robust border backdrop-blur-md flex items-center gap-3 uppercase tracking-[0.2em] shadow-xl ${statusStyle.badge}`}>
            <StatusIcon size={14} className="animate-pulse" />
            {statusStyle.label}
          </div>
          
          {/* Mantenimiento Alert Badge - Improved Visibility */}
          {vehicle.maintenanceStatus === 'critical' && (
             <div className="px-5 py-2 rounded-2xl text-[9px] font-robust border bg-red-600 text-white border-red-500 backdrop-blur-md flex items-center gap-3 uppercase tracking-[0.2em] shadow-xl animate-pulse">
                <AlertTriangle size={14} className="fill-white/20" /> 
                <span>
                  {vehicle.maintenanceKMLeft !== undefined && vehicle.maintenanceKMLeft <= 300 ? `${vehicle.maintenanceKMLeft} KM RESTANTES` : 
                   vehicle.maintenanceDaysLeft !== undefined && vehicle.maintenanceDaysLeft <= 5 ? `${vehicle.maintenanceDaysLeft} DÍAS RESTANTES` : "MANT. URGENTE"}
                </span>
             </div>
          )}
          {vehicle.maintenanceStatus === 'warning' && (
             <div className="px-5 py-2 rounded-2xl text-[9px] font-robust border bg-gold text-white border-yellow-500 backdrop-blur-md flex items-center gap-3 uppercase tracking-[0.2em] shadow-xl">
                <AlertCircle size={14} className="fill-white/20" />
                <span>
                  {vehicle.maintenanceKMLeft !== undefined && vehicle.maintenanceKMLeft <= 1000 ? `${vehicle.maintenanceKMLeft} KM PRÓXIMOS` : 
                   vehicle.maintenanceDaysLeft !== undefined && vehicle.maintenanceDaysLeft <= 15 ? `${vehicle.maintenanceDaysLeft} DÍAS PRÓXIMOS` : "MANT. PRÓXIMO"}
                </span>
             </div>
          )}
        </div>

        {/* Marca de Agua Gold */}
        <div className="absolute bottom-6 right-8 opacity-20 group-hover:opacity-100 transition-opacity">
           <Award size={60} className="text-gold" strokeWidth={1} />
        </div>
      </div>

      <div className="p-10 space-y-8">
        {/* TÍTULO Y PRECIO */}
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h3 className="text-3xl font-robust text-bordeaux-950 dark:text-white uppercase italic leading-none tracking-tighter">{vehicle.nombre}</h3>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em] italic border-b border-gold/20 pb-0.5">{vehicle.placa}</span>
               <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{vehicle.color}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-robust text-bordeaux-950 dark:text-white italic leading-none tracking-tighter">R$ {vehicle.precio}</p>
            <p className="text-[11px] font-black text-gold mt-2 uppercase tracking-widest italic">Gs. {pricePYG.toLocaleString()}</p>
          </div>
        </div>

        {/* VISUAL SPECS SUMMARY STRIP (ICONOS MEJORADOS) */}
        <div className="flex justify-around items-center py-4 border-y border-gray-100 dark:border-white/5 mx-2 bg-gray-50/50 dark:bg-white/5 rounded-2xl">
           <div className="flex flex-col items-center gap-1.5 group/icon">
              <div className="p-2 bg-white dark:bg-dark-elevated rounded-full shadow-sm text-gold group-hover/icon:scale-110 transition-transform">
                 <Users size={16} />
              </div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{vehicle.asientos || 5} PAS.</span>
           </div>
           <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>
           <div className="flex flex-col items-center gap-1.5 group/icon">
              <div className="p-2 bg-white dark:bg-dark-elevated rounded-full shadow-sm text-gold group-hover/icon:scale-110 transition-transform">
                 <Fuel size={16} />
              </div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{vehicle.combustible || 'NAFTA'}</span>
           </div>
           <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>
           <div className="flex flex-col items-center gap-1.5 group/icon">
              <div className="p-2 bg-white dark:bg-dark-elevated rounded-full shadow-sm text-gold group-hover/icon:scale-110 transition-transform">
                 <Gauge size={16} />
              </div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{vehicle.transmision || 'AUT.'}</span>
           </div>
        </div>

        {/* ACCIONES DE FICHA */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={(e) => { e.stopPropagation(); setShowAvailability(!showAvailability); setShowDetails(false); }} 
            className={`py-5 rounded-2xl text-[9px] font-robust uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${showAvailability ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-2xl' : 'bg-gray-50 dark:bg-dark-elevated text-gray-400 border-transparent hover:border-gold/30'}`}>
            <Calendar size={14} /> Agenda de Salidas
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); setShowAvailability(false); }} 
            className={`py-5 rounded-2xl text-[9px] font-robust uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${showDetails ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-2xl' : 'bg-gray-50 dark:bg-dark-elevated text-gray-400 border-transparent hover:border-gold/30'}`}>
            <Info size={14} /> Ficha Técnica JM
          </button>
        </div>

        {/* CALENDARIO EXPANDIBLE */}
        {showAvailability && (
          <div className="animate-fadeIn">
            <AvailabilityCalendar vehicleName={vehicle.nombre} reservations={reservations} language={language} onDateRangeSelected={(start, end) => onSelect(start, end)} />
          </div>
        )}
        
        {/* DETALLES EXPANDIBLES (DISEÑO PREMIUM CARD) */}
        {showDetails && (
          <div className="space-y-6 animate-fadeIn bg-gradient-to-br from-gray-50 to-white dark:from-dark-elevated dark:to-dark-base p-8 rounded-[3rem] border-2 dark:border-white/5 relative overflow-hidden group/details shadow-inner" onClick={(e) => e.stopPropagation()}>
             <ShieldCheck size={120} className="absolute -bottom-10 -right-10 text-gold/5 group-hover/details:scale-110 transition-transform" />
             
             <div className="relative z-10">
                <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-6 border-b border-gold/10 pb-2">Especificaciones Técnicas</h4>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white dark:bg-black/20 rounded-lg flex items-center justify-center text-bordeaux-800 shadow-sm"><Users size={14} /></div>
                      <div><p className="text-[7px] font-bold text-gray-400 uppercase">Capacidad</p><p className="text-[10px] font-black dark:text-white uppercase">{vehicle.asientos || 5} Pax</p></div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white dark:bg-black/20 rounded-lg flex items-center justify-center text-bordeaux-800 shadow-sm"><Fuel size={14} /></div>
                      <div><p className="text-[7px] font-bold text-gray-400 uppercase">Motor</p><p className="text-[10px] font-black dark:text-white uppercase">{vehicle.combustible || 'Nafta'}</p></div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white dark:bg-black/20 rounded-lg flex items-center justify-center text-bordeaux-800 shadow-sm"><Gauge size={14} /></div>
                      <div><p className="text-[7px] font-bold text-gray-400 uppercase">Caja</p><p className="text-[10px] font-black dark:text-white uppercase">{vehicle.transmision || 'Automático'}</p></div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white dark:bg-black/20 rounded-lg flex items-center justify-center text-bordeaux-800 shadow-sm"><Cpu size={14} /></div>
                      <div><p className="text-[7px] font-bold text-gray-400 uppercase">Clase</p><p className="text-[10px] font-black dark:text-white uppercase">{vehicle.tipo || 'Luxury'}</p></div>
                   </div>
                </div>

                <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Equipamiento</p>
                   <div className="flex flex-wrap gap-2">
                      {vehicle.specs.map((s, i) => (
                        <span key={i} className="text-[8px] font-bold uppercase bg-white dark:bg-black/20 px-3 py-1 rounded-lg border border-gray-100 dark:border-white/5 text-gray-500 shadow-sm">{s}</span>
                      ))}
                   </div>
                </div>

                {/* CALCULADORA DE PRECIO */}
                <div className="mt-8 bg-bordeaux-950/5 dark:bg-white/5 rounded-3xl p-6 border border-gold/10">
                   <h4 className="text-[9px] font-black text-bordeaux-800 dark:text-gold uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Calculator size={14}/> Simulador de Costo</h4>
                   <div className="grid grid-cols-2 gap-3 mb-4">
                      <div><p className="text-[7px] font-bold uppercase text-gray-400 mb-1">Inicio</p><input type="date" value={calcStart} onChange={e => setCalcStart(e.target.value)} className="w-full bg-white dark:bg-dark-base rounded-xl px-3 py-2 text-[10px] font-bold border-0 outline-none shadow-sm" /></div>
                      <div><p className="text-[7px] font-bold uppercase text-gray-400 mb-1">Fin</p><input type="date" value={calcEnd} onChange={e => setCalcEnd(e.target.value)} className="w-full bg-white dark:bg-dark-base rounded-xl px-3 py-2 text-[10px] font-bold border-0 outline-none shadow-sm" /></div>
                   </div>
                   {estimatedCost ? (
                      <div className="bg-white dark:bg-dark-elevated rounded-2xl p-4 text-center shadow-lg border border-gold/20">
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{estimatedCost.days} Días Estimados</p>
                         <div className="flex justify-center items-center gap-4">
                            <div><p className="text-[12px] font-robust text-bordeaux-950 dark:text-white italic">R$ {estimatedCost.brl}</p></div>
                            <div className="w-px h-6 bg-gray-200 dark:bg-white/10"></div>
                            <div><p className="text-[12px] font-robust text-gold italic">Gs. {estimatedCost.pyg.toLocaleString()}</p></div>
                         </div>
                      </div>
                   ) : (
                      <div className="text-center py-2"><p className="text-[8px] font-bold text-gray-400 italic">Seleccione fechas para calcular</p></div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* BOTÓN DE ACCIÓN PRINCIPAL */}
        <button className={`w-full py-6 rounded-[2rem] font-robust text-[13px] uppercase tracking-[0.4em] shadow-2xl transition-all relative overflow-hidden group/btn ${isAvailable ? 'bordeaux-gradient text-white active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
          <div className="absolute inset-0 bg-gold/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
          {isAvailable ? 'PROCEDER AL ALQUILER' : vehicle.estado.toUpperCase()}
        </button>
      </div>
    </div>
  );
};

export default VehicleCard;
