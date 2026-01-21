
import React, { useState } from 'react';
import { Vehicle, Reservation } from '../types';
import { 
  ArrowRight, Share2, Check, Star, 
  ChevronDown, ChevronUp, Calendar, List, Users, Zap, Fuel, Settings2
} from 'lucide-react';
import AvailabilityCalendar from './AvailabilityCalendar';

interface VehicleCardProps {
  vehicle: Vehicle;
  exchangeRate: number;
  reservations: Reservation[];
  onSelect: () => void;
  isAdmin?: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, exchangeRate, reservations, onSelect, isAdmin }) => {
  const [shared, setShared] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  const isAvailable = vehicle.estado === 'Disponible';
  const pricePYG = Math.round(vehicle.precio * exchangeRate);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `JM Alquiler - ${vehicle.nombre}`,
      text: `Excelente unidad ${vehicle.nombre} disponible en JM Alquiler de Vehículos Premium.`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable && !isAdmin) return;
    
    setIsClicking(true);
    setTimeout(() => {
      setIsClicking(false);
      onSelect();
    }, 200);
  };

  return (
    <div 
      className={`group relative bg-white rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border transition-all duration-700 transform cursor-pointer ${
        isClicking 
          ? 'scale-[1.05] bg-white border-gold/60 shadow-[0_60px_120px_-30px_rgba(128,0,0,0.25)] z-30' 
          : 'border-bordeaux-100/30 hover:border-gold/40 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_50px_100px_-20px_rgba(128,0,0,0.15)] hover:-translate-y-4'
      }`}
      onClick={handleBooking}
    >
      {/* Contenedor de Imagen Uniforme y Cuadrado */}
      <div className="relative aspect-square bg-white overflow-hidden flex items-center justify-center p-6">
        <div className="absolute inset-0 bordeaux-gradient opacity-0 group-hover:opacity-[0.02] transition-opacity duration-1000 ease-in-out"></div>
        <div className="relative w-full h-full flex items-center justify-center">
           {/* Sombra de suelo */}
           <div className="absolute bottom-[10%] w-[85%] h-[8%] bg-black/5 blur-[20px] rounded-full scale-x-110 group-hover:scale-x-125 transition-transform duration-1000 ease-out"></div>
           <img 
            src={vehicle.img} 
            alt={vehicle.nombre} 
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-1000 ease-out relative z-10 drop-shadow-xl"
          />
        </div>
        
        <div className="absolute top-4 md:top-8 left-4 md:left-8 flex flex-col gap-2 md:gap-3 z-20">
          <span className={`px-4 md:px-5 py-1.5 md:py-2 rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.25em] shadow-xl border backdrop-blur-md transition-all duration-500 ${
            isAvailable 
            ? 'bg-green-600 text-white border-green-400' 
            : vehicle.estado === 'En Taller' ? 'bg-orange-600 text-white border-orange-400' : 'bg-red-600 text-white border-red-400'
          }`}>
            {vehicle.estado}
          </span>
          <span className="bg-white/95 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-[8px] md:text-[9px] font-black text-bordeaux-950 border border-bordeaux-50 shadow-md tracking-[0.3em] uppercase transition-all duration-500 group-hover:bg-gold group-hover:text-white group-hover:border-gold">
            {vehicle.placa}
          </span>
        </div>

        <button 
          onClick={handleShare}
          className="absolute top-4 md:top-8 right-4 md:right-8 p-3 md:p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-bordeaux-50 shadow-lg hover:bg-bordeaux-800 hover:text-white transition-all duration-500 z-20 active:scale-90"
        >
          {shared ? <Check size={16} className="text-green-500" /> : <Share2 size={16} className="text-bordeaux-800 group-hover:text-white" />}
        </button>
      </div>

      <div className="p-6 md:p-10 space-y-6 md:space-y-8 bg-white border-t border-gray-50">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <h3 className="text-xl md:text-3xl font-serif font-bold text-bordeaux-950 leading-tight group-hover:text-bordeaux-800 transition-colors duration-500">
              {vehicle.nombre}
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                <Settings2 size={12} className="text-gold" />
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">{vehicle.transmision || 'Automático'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                <Fuel size={12} className="text-gold" />
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">{vehicle.combustible || 'Nafta'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 mt-1">
              <span className="text-[9px] md:text-[10px] font-black text-gold uppercase tracking-[0.3em] md:tracking-[0.5em]">{vehicle.tipo || 'Executive'}</span>
              <div className="flex gap-0.5 md:gap-1 text-gold">
                {[1,2,3,4,5].map(i => <Star key={i} size={8} className="md:w-[10px] md:h-[10px] fill-current" />)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] md:text-[9px] font-black text-gray-300 uppercase tracking-widest block mb-0.5 md:mb-1">Fee Diario</span>
            <p className="text-lg md:text-2xl font-black text-bordeaux-800">R$ {vehicle.precio}</p>
            <p className="text-[10px] md:text-xs font-bold text-gold">Gs. {pricePYG.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); }}
            className={`w-full flex items-center justify-between py-4 md:py-5 px-6 md:px-8 rounded-2xl md:rounded-3xl transition-all duration-500 border ${showDetails ? 'bg-bordeaux-50 border-bordeaux-100 shadow-sm' : 'bg-gray-50/50 border-gray-100/30 hover:bg-white hover:border-gold/20'}`}
          >
            <span className="text-[9px] md:text-[10px] font-black text-bordeaux-950 uppercase tracking-[0.3em] flex items-center gap-3 md:gap-4">
              <List size={16} className="md:w-[18px] md:h-[18px] text-gold" /> Ficha Técnica Detallada
            </span>
            {showDetails ? <ChevronUp size={16} className="text-bordeaux-800" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showDetails && (
            <div className="space-y-4 md:space-y-6 animate-slideDown p-5 md:p-8 bg-gray-50/20 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100/50">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-3 md:p-4 bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm space-y-1 md:space-y-2">
                  <div className="flex items-center gap-2 md:gap-3 text-gray-300 mb-0.5 md:mb-1">
                    <Users size={14} className="md:w-4 md:h-4"/> <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Plazas</span>
                  </div>
                  <p className="text-[11px] md:text-sm font-bold text-gray-700">{vehicle.asientos || 5} Personas</p>
                </div>
                <div className="p-3 md:p-4 bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm space-y-1 md:space-y-2">
                  <div className="flex items-center gap-2 md:gap-3 text-gray-300 mb-0.5 md:mb-1">
                    <Zap size={14} className="md:w-4 md:h-4"/> <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Consumo</span>
                  </div>
                  <p className="text-[11px] md:text-sm font-bold text-gray-700">{vehicle.consumo || 'Eco Optimized'}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {vehicle.specs.map((spec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-gold shrink-0"></div>
                    <p className="text-[10px] md:text-[11px] text-gray-500 font-medium leading-relaxed uppercase tracking-wider">{spec}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
           <button 
            onClick={(e) => { e.stopPropagation(); setShowAvailability(!showAvailability); }}
            className={`w-full flex items-center justify-center gap-3 md:gap-4 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-500 border ${
              showAvailability ? 'bg-bordeaux-950 text-white border-bordeaux-900 shadow-xl' : 'bg-white border-bordeaux-100/50 text-gray-400 hover:text-bordeaux-800 shadow-sm'
            }`}
          >
            <Calendar size={18} className="md:w-5 md:h-5" /> Disponibilidad Real
          </button>

          {showAvailability && (
            <div className="animate-slideDown mt-1 md:mt-2 w-full">
              <AvailabilityCalendar vehicleName={vehicle.nombre} reservations={reservations} />
            </div>
          )}

          <button 
            onClick={handleBooking}
            disabled={!isAvailable && !isAdmin}
            className={`w-full flex items-center justify-center gap-4 md:gap-5 py-5 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-[11px] md:text-[12px] uppercase tracking-[0.5em] shadow-[0_20px_50px_-15px_rgba(128,0,0,0.25)] transition-all duration-500 ${
              isAvailable 
              ? 'bordeaux-gradient text-white hover:shadow-bordeaux-900/50 hover:scale-[1.03] active:scale-95' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-100 shadow-none'
            }`}
          >
            {isAvailable ? 'Confirmar Alquiler VIP' : 'Unidad Reservada'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
