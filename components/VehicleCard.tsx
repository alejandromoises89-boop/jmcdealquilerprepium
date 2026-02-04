
import React, { useState, useMemo } from 'react';
import { Vehicle, Reservation } from '../types';
import { TRANSLATIONS, Language } from '../constants';
import { 
  CheckCircle2, Clock, Info, Calendar, 
  Users, Fuel, Gauge, Award, ShieldCheck, 
  Wrench, Calculator, Zap,
  Smartphone, ChevronRight,
  Layers, Star, Activity, Heart, MapPin, Box,
  Key, AlertCircle, Settings2, Milestones
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

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, exchangeRate, reservations, onSelect, language = 'es' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  
  const [calcStart, setCalcStart] = useState('');
  const [calcEnd, setCalcEnd] = useState('');

  const isAvailable = vehicle.estado === 'Disponible';
  const pricePYG = Math.round(vehicle.precio * exchangeRate);

  const statusConfig = useMemo(() => {
    switch (vehicle.estado) {
      case 'Disponible':
        return {
          color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 shadow-emerald-100/20',
          icon: <CheckCircle2 size={12} className="animate-pulse" />,
          label: 'Disponible'
        };
      case 'En Alquiler':
        return {
          color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 shadow-amber-100/20',
          icon: <Clock size={12} />,
          label: 'En Alquiler'
        };
      case 'En Taller':
        return {
          color: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20 shadow-red-100/20',
          icon: <AlertCircle size={12} />,
          label: 'En Taller'
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-600 border-gray-100',
          icon: <Info size={12} />,
          label: vehicle.estado
        };
    }
  }, [vehicle.estado]);

  const estimatedCost = useMemo(() => {
    if (!calcStart || !calcEnd) return null;
    const s = new Date(calcStart);
    const e = new Date(calcEnd);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return { days: diffDays, brl: diffDays * vehicle.precio, pyg: diffDays * vehicle.precio * exchangeRate };
  }, [calcStart, calcEnd, vehicle.precio, exchangeRate]);

  const technicalSpecs = useMemo(() => [
    { icon: Gauge, label: 'Motorización', val: vehicle.specs[0] || 'Eficiencia VVT-i' },
    { icon: Box, label: 'Transmisión', val: vehicle.transmision || 'Automática' },
    { icon: Fuel, label: 'Combustible', val: vehicle.combustible || 'Nafta' },
    { icon: Users, label: 'Capacidad', val: `${vehicle.asientos || 5} Plazas` },
    { icon: ShieldCheck, label: 'Seguridad', val: 'Protocolo JM' },
    { icon: Award, label: 'Categoría', val: vehicle.tipo || 'Premium' }
  ], [vehicle]);

  return (
    <div 
      className={`group relative bg-white dark:bg-dark-card rounded-[4rem] overflow-hidden transition-all duration-700 cursor-pointer border-2 ${
        isHovered ? 'border-gold gold-glow scale-[1.01]' : 'border-gray-100 dark:border-white/5'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => isAvailable && onSelect()}
    >
      <div className="relative aspect-[16/9] bg-gray-50 dark:bg-dark-base flex items-center justify-center p-12 overflow-hidden">
        <img src={vehicle.img} className="w-[90%] h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.2)] transition-transform duration-1000 group-hover:scale-105" alt={vehicle.nombre} />
        <div className="absolute top-10 left-10 z-30">
          <div className={`px-6 py-2.5 rounded-full tracking-wide-label border backdrop-blur-md flex items-center gap-3 shadow-lg transition-all duration-500 ${statusConfig.color}`}>
            {statusConfig.icon} {statusConfig.label}
          </div>
        </div>
      </div>

      <div className="p-12 space-y-10">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <h3 className="text-4xl md:text-5xl font-robust text-bordeaux-950 dark:text-white italic leading-none">{vehicle.nombre}</h3>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-1.5 text-gold">
                  {[1,2,3,4,5].map(s => <Star key={s} size={11} fill="currentColor" />)}
               </div>
               <span className="tracking-wide-label text-gold italic">{vehicle.placa}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-5xl font-robust text-bordeaux-950 dark:text-white italic leading-none">R$ {vehicle.precio}</p>
            <p className="tracking-wide-label text-gold mt-3 italic">Gs. {pricePYG.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 px-8 py-5 bg-gray-50/50 dark:bg-dark-base/30 rounded-3xl border border-gray-100 dark:border-white/5">
           <div className="flex flex-col items-center gap-1">
              <Box size={14} className="text-gold" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{vehicle.transmision}</span>
           </div>
           <div className="flex flex-col items-center gap-1 border-x dark:border-white/10">
              <Fuel size={14} className="text-gold" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{vehicle.combustible}</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <Users size={14} className="text-gold" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{vehicle.asientos} Plazas</span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <button onClick={(e) => { e.stopPropagation(); setShowAvailability(!showAvailability); setShowDetails(false); }} 
            className={`py-6 rounded-[2rem] tracking-wide-label border-2 transition-all flex items-center justify-center gap-4 ${showAvailability ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-2xl' : 'bg-gray-50 dark:bg-dark-elevated text-gray-400 border-transparent hover:border-gold/30'}`}>
            <Calendar size={16} /> Agenda
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); setShowAvailability(false); }} 
            className={`py-6 rounded-[2rem] tracking-wide-label border-2 transition-all flex items-center justify-center gap-4 ${showDetails ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-2xl' : 'bg-gray-50 dark:bg-dark-elevated text-gray-400 border-transparent hover:border-gold/30'}`}>
            <Activity size={16} /> Detalles
          </button>
        </div>

        {showAvailability && (
          <div className="animate-slideUp mt-6">
            <AvailabilityCalendar vehicleName={vehicle.nombre} reservations={reservations} language={language} onDateRangeSelected={(start, end) => onSelect(start, end)} />
          </div>
        )}
        
        {showDetails && (
          <div className="space-y-12 animate-slideUp bg-gray-50/50 dark:bg-dark-base/50 p-12 rounded-[4rem] border-2 border-white dark:border-white/5 shadow-inner" onClick={(e) => e.stopPropagation()}>
             <div className="grid grid-cols-2 gap-6">
                {technicalSpecs.map((spec, i) => (
                  <div key={i} className="bg-white dark:bg-dark-card p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center text-center gap-3 group/item hover:border-gold/30 transition-all">
                    <div className="w-16 h-16 bg-bordeaux-50 dark:bg-bordeaux-900/20 rounded-2xl flex items-center justify-center text-bordeaux-800 dark:text-gold group-hover/item:bg-bordeaux-800 group-hover/item:text-white transition-all">
                      <spec.icon size={26} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="tracking-wide-label text-gray-400 opacity-60 mb-1">{spec.label}</p>
                      <p className="text-[11px] font-robust text-bordeaux-950 dark:text-white italic tracking-tight">{spec.val}</p>
                    </div>
                  </div>
                ))}
             </div>

             <div className="pt-12 border-t border-gray-200 dark:border-white/10 space-y-10">
                <h4 className="tracking-wide-label text-gold flex items-center justify-center gap-4 italic">
                   <Calculator size={18} /> Simulador JM Platinum
                </h4>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <label className="tracking-wide-label text-gray-400 ml-4 flex items-center gap-3 italic"><Calendar size={14}/> Inicio</label>
                     <input type="date" value={calcStart} onChange={e => setCalcStart(e.target.value)} className="w-full bg-white dark:bg-dark-card rounded-2xl px-8 py-5 font-black text-xs outline-none border-2 border-transparent focus:border-gold transition-all shadow-sm dark:text-white" />
                  </div>
                  <div className="space-y-4">
                     <label className="tracking-wide-label text-gray-400 ml-4 flex items-center gap-3 italic"><Clock size={14}/> Entrega</label>
                     <input type="date" value={calcEnd} onChange={e => setCalcEnd(e.target.value)} className="w-full bg-white dark:bg-dark-card rounded-2xl px-8 py-5 font-black text-xs outline-none border-2 border-transparent focus:border-gold transition-all shadow-sm dark:text-white" />
                  </div>
                </div>

                {estimatedCost && (
                  <div className="relative overflow-hidden bordeaux-gradient p-1 rounded-[4rem] shadow-2xl animate-slideUp border-2 border-gold/40">
                     <div className="bg-black/10 backdrop-blur-3xl p-12 rounded-[3.8rem] text-center space-y-8">
                         <div className="flex flex-col items-center gap-2">
                             <p className="tracking-wide-label text-gold italic">{estimatedCost.days} Días de Alquiler</p>
                             <div className="w-24 h-0.5 bg-gold/20 rounded-full"></div>
                         </div>
                         <div className="flex flex-col gap-5">
                            <div className="flex items-baseline justify-center gap-5">
                               <span className="text-4xl font-robust italic text-gold">R$</span>
                               <h3 className="text-7xl font-robust text-white italic tracking-tighter leading-none">{estimatedCost.brl.toLocaleString()}</h3>
                            </div>
                            <div className="bg-black/30 py-5 px-12 rounded-full inline-block mx-auto border border-white/10 shadow-2xl backdrop-blur-md">
                               <p className="text-base font-robust text-gold tracking-widest italic">Gs. {estimatedCost.pyg.toLocaleString()}</p>
                             </div>
                         </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        <button 
          onClick={() => isAvailable && onSelect()} 
          disabled={!isAvailable}
          className={`w-full py-9 rounded-[3rem] tracking-ultra text-[13px] font-robust shadow-2xl transition-all relative overflow-hidden group/btn ${
            isAvailable 
              ? 'bordeaux-gradient text-white active:scale-95' 
              : 'bg-gray-100 dark:bg-dark-elevated text-gray-300 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-white/5'
          }`}
        >
          {isAvailable && <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>}
          <span className="relative z-10 flex items-center justify-center gap-6 italic">
            {isAvailable ? (
              <>RESERVAR UNIDAD JM <ChevronRight size={22} className="group-hover/btn:translate-x-3 transition-transform" /></>
            ) : (
              <>{statusConfig.icon} NO DISPONIBLE</>
            )}
          </span>
        </button>
      </div>
    </div>
  );
};

export default VehicleCard;
