
import React, { useState } from 'react';
import { Vehicle, Reservation } from '../types';
import { TRANSLATIONS, Language } from '../constants';
import { 
  CheckCircle2, Clock, Info, Calendar, 
  ShieldAlert, Settings2, Users, Fuel, Gauge, Zap,
  Cpu, Award, ShieldCheck
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

  const t = TRANSLATIONS[language];
  const isAvailable = vehicle.estado === 'Disponible';
  const isRented = vehicle.estado === 'En Alquiler';
  const pricePYG = Math.round(vehicle.precio * exchangeRate);
  
  const getStatusStyle = () => {
    if (isAvailable) return {
      badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/30',
      icon: CheckCircle2,
      label: 'Disponible'
    };
    if (isRented) return {
      badge: 'bg-gold/10 text-gold border-gold/20',
      icon: Clock,
      label: 'En Alquiler'
    };
    return {
      badge: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-500/30',
      icon: ShieldAlert,
      label: 'En Taller'
    };
  };

  const statusStyle = getStatusStyle();
  const StatusIcon = statusStyle.icon;

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
        <div className="absolute top-8 left-8 z-30">
          <div className={`px-5 py-2 rounded-2xl text-[9px] font-robust border backdrop-blur-md flex items-center gap-3 uppercase tracking-[0.2em] shadow-xl ${statusStyle.badge}`}>
            <StatusIcon size={14} className="animate-pulse" />
            {statusStyle.label}
          </div>
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
        
        {/* DETALLES EXPANDIBLES (DISEÑO PREMIUM) */}
        {showDetails && (
          <div className="space-y-6 animate-fadeIn bg-gray-50/50 dark:bg-dark-base/40 p-8 rounded-[3rem] border-2 dark:border-white/5 relative overflow-hidden group/details">
             <ShieldCheck size={120} className="absolute -bottom-10 -right-10 text-gold/5 group-hover/details:scale-110 transition-transform" />
             
             <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-dark-elevated rounded-xl flex items-center justify-center text-gold shadow-md"><Users size={18} /></div>
                   <div><p className="text-[7px] font-black text-gray-400 uppercase">Capacidad</p><p className="text-[11px] font-black dark:text-white uppercase italic">{vehicle.asientos || 5} Pasajeros</p></div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-dark-elevated rounded-xl flex items-center justify-center text-gold shadow-md"><Fuel size={18} /></div>
                   <div><p className="text-[7px] font-black text-gray-400 uppercase">Motorización</p><p className="text-[11px] font-black dark:text-white uppercase italic">{vehicle.combustible || 'Nafta'}</p></div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-dark-elevated rounded-xl flex items-center justify-center text-gold shadow-md"><Gauge size={18} /></div>
                   <div><p className="text-[7px] font-black text-gray-400 uppercase">Transmisión</p><p className="text-[11px] font-black dark:text-white uppercase italic">{vehicle.transmision || 'Automático'}</p></div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-dark-elevated rounded-xl flex items-center justify-center text-gold shadow-md"><Cpu size={18} /></div>
                   <div><p className="text-[7px] font-black text-gray-400 uppercase">Categoría</p><p className="text-[11px] font-black dark:text-white uppercase italic">{vehicle.tipo || 'Luxury'}</p></div>
                </div>
             </div>

             <div className="pt-6 border-t dark:border-white/5">
                <p className="text-[8px] font-black text-gold uppercase tracking-[0.3em] mb-4">Equipamiento Incluido</p>
                <div className="flex flex-wrap gap-2">
                   {vehicle.specs.map((s, i) => (
                     <span key={i} className="text-[8px] font-black uppercase bg-white dark:bg-dark-elevated px-4 py-1.5 rounded-xl border dark:border-white/10 text-gray-500 shadow-sm">{s}</span>
                   ))}
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
