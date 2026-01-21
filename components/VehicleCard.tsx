
import React, { useState } from 'react';
import { Vehicle, Reservation } from '../types';
import { 
  ArrowRight, Share2, Check, Star, 
  ChevronDown, ChevronUp, Calendar, Settings, Fuel, Users, Zap, List
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
    }, 150);
  };

  return (
    <div 
      className={`group relative bg-white rounded-[3rem] overflow-hidden border transition-all duration-500 transform ${
        isClicking 
          ? 'scale-[0.98] bg-bordeaux-50 border-gold/40 shadow-inner' 
          : 'border-bordeaux-100/30 hover:border-gold/30 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(128,0,0,0.1)] hover:-translate-y-1'
      }`}
    >
      {/* Premium Header */}
      <div className="relative aspect-[16/10] bg-gray-50/20 overflow-hidden">
        <div className="absolute inset-0 bordeaux-gradient opacity-0 group-hover:opacity-[0.02] transition-opacity duration-1000"></div>
        
        <div className="absolute inset-0 flex items-center justify-center p-8">
           <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute bottom-[10%] w-[80%] h-[10%] bg-black/10 blur-[20px] rounded-full"></div>
              <img 
                src={vehicle.img} 
                alt={vehicle.nombre} 
                className={`max-w-[90%] max-h-[90%] object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-1000 ease-out relative z-10 ${vehicle.nombre.includes('Wish') ? 'scale-120' : ''}`}
              />
           </div>
        </div>
        
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
          <span className={`px-4 py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg border backdrop-blur-md transition-all ${
            isAvailable 
            ? 'bg-green-600 text-white border-green-400' 
            : vehicle.estado === 'En Taller' ? 'bg-orange-600 text-white border-orange-400' : 'bg-red-600 text-white border-red-400'
          }`}>
            {vehicle.estado}
          </span>
          <span className="bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[8px] font-black text-bordeaux-950 border border-bordeaux-50 shadow-sm tracking-[0.2em] uppercase">
            {vehicle.placa}
          </span>
        </div>

        <button 
          onClick={handleShare}
          className="absolute top-6 right-6 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-bordeaux-50 shadow-sm hover:bg-bordeaux-800 hover:text-white transition-all duration-500 z-20"
        >
          {shared ? <Check size={16} className="text-green-500" /> : <Share2 size={16} className="text-bordeaux-800 group-hover:text-white" />}
        </button>
      </div>

      <div className="p-8 space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold text-bordeaux-950 leading-tight">
              {vehicle.nombre}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-gold uppercase tracking-[0.4em]">{vehicle.tipo || 'Executive'}</span>
              <div className="flex gap-0.5 text-gold">
                {[1,2,3,4,5].map(i => <Star key={i} size={8} className="fill-current" />)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest block mb-1">Fee Diario</span>
            <p className="text-xl font-black text-bordeaux-800">R$ {vehicle.precio}</p>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className={`w-full flex items-center justify-between py-4 px-6 rounded-2xl transition-all border ${showDetails ? 'bg-bordeaux-50 border-bordeaux-100 shadow-sm' : 'bg-gray-50/50 border-gray-100/50 hover:bg-gray-100'}`}
          >
            <span className="text-[10px] font-black text-bordeaux-950 uppercase tracking-[0.4em] flex items-center gap-3">
              <Settings size={16} className="text-gold" /> Características
            </span>
            {showDetails ? <ChevronUp size={16} className="text-bordeaux-800" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showDetails && (
            <div className="space-y-6 animate-slideDown p-4 bg-gray-50/30 rounded-3xl border border-gray-100/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-gray-300 mb-1">
                    <Users size={12}/> <span className="text-[8px] font-black uppercase tracking-widest">Plazas</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-700">{vehicle.asientos || 5} Asientos</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-gray-300 mb-1">
                    <Zap size={12}/> <span className="text-[8px] font-black uppercase tracking-widest">Motor</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-700">{vehicle.combustible || 'Nafta'}</p>
                </div>
              </div>
              
              <div className="space-y-2 px-2">
                <h4 className="text-[9px] font-black text-bordeaux-800 uppercase tracking-[0.3em]">Especificaciones</h4>
                <ul className="space-y-2">
                  {vehicle.specs.slice(0, 4).map((spec, i) => (
                    <li key={i} className="flex items-start gap-3 text-[11px] font-medium text-gray-600 leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
           <button 
            onClick={() => setShowAvailability(!showAvailability)}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${
              showAvailability ? 'bg-bordeaux-950 text-white border-bordeaux-900 shadow-xl' : 'bg-white border-bordeaux-50 text-gray-400 hover:text-bordeaux-800'
            }`}
          >
            <Calendar size={18} /> {showAvailability ? 'Ocultar Calendario' : 'Disponibilidad'}
          </button>

          {showAvailability && (
            <div className="animate-slideDown mt-2 w-full">
              <AvailabilityCalendar vehicleName={vehicle.nombre} reservations={reservations} />
            </div>
          )}

          <button 
            onClick={handleBooking}
            disabled={!isAvailable && !isAdmin}
            className={`w-full flex items-center justify-center gap-4 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl transition-all duration-500 ${
              isAvailable 
              ? 'bordeaux-gradient text-white hover:shadow-bordeaux-900/40 active:scale-95' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isAvailable ? (
              <>
                Confirmar Reserva <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              'No Disponible'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
