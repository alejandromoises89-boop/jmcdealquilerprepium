
import React, { useState } from 'react';
import { Vehicle, Reservation } from '../types';
import { 
  ArrowRight, Share2, Star, 
  Calendar, Users, Fuel, Settings2, 
  Shield, Music, Cpu, Thermometer, Camera, 
  Sparkles, Navigation, CheckCircle2,
  Lock, Info
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
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  const isAvailable = vehicle.estado === 'Disponible';
  const pricePYG = Math.round(vehicle.precio * exchangeRate);
  
  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable && !isAdmin) return;
    onSelect();
  };

  const getSpecIcon = (spec: string) => {
    const s = spec.toLowerCase();
    if (s.includes('motor')) return <Cpu size={14} />;
    if (s.includes('seguridad')) return <Shield size={14} />;
    if (s.includes('radio') || s.includes('bluetooth')) return <Music size={14} />;
    if (s.includes('aire') || s.includes('ac')) return <Thermometer size={14} />;
    if (s.includes('cámara')) return <Camera size={14} />;
    return <Settings2 size={14} />;
  };

  return (
    <div 
      className={`group relative bg-white rounded-[3rem] md:rounded-[4rem] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer border-2 ${
        isHovered 
          ? 'border-bordeaux-100 shadow-[0_40px_100px_-20px_rgba(128,0,0,0.1)] -translate-y-3' 
          : 'border-gray-50 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBooking}
    >
      {/* 3D-like Visual Section */}
      <div className="relative aspect-[16/10] md:aspect-[16/9] overflow-hidden bg-gray-50 flex items-center justify-center">
        <div className={`absolute inset-0 bordeaux-gradient opacity-0 transition-opacity duration-1000 ${isHovered ? 'opacity-[0.03]' : ''}`}></div>
        
        <div className={`relative z-10 w-full h-full flex items-center justify-center transition-all duration-1000 ${isHovered ? 'scale-110 rotate-1' : 'scale-100'}`}>
          <img 
            src={vehicle.img} 
            alt={vehicle.nombre} 
            className="w-[85%] h-[85%] object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.15)]"
          />
        </div>

        {/* Tags */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
          <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-xl border shadow-lg ${
            isAvailable ? 'bg-white/90 text-green-600 border-green-50' : 'bg-white/90 text-red-500 border-red-50'
          }`}>
            <span className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {vehicle.estado}
            </span>
          </div>
          <div className="px-4 py-1.5 bg-bordeaux-950/80 backdrop-blur-xl text-gold border border-gold/20 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
            {vehicle.tipo}
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-8 md:p-12 space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-gold mb-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={10} className="fill-current" />)}
              <span className="text-[8px] font-black uppercase tracking-widest ml-2 text-gray-300">Grade A Platinum</span>
            </div>
            <h3 className="text-2xl md:text-4xl font-serif font-bold text-bordeaux-950 tracking-tight leading-tight">
              {vehicle.nombre}
            </h3>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-bordeaux-800 bg-bordeaux-50 px-3 py-1 rounded-lg border border-bordeaux-100 uppercase tracking-widest">{vehicle.placa}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl md:text-4xl font-black text-bordeaux-950 tracking-tighter">R$ {vehicle.precio}</p>
            <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mt-1">Gs. {pricePYG.toLocaleString()}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); setShowAvailability(false); }}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                showDetails ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gold/30 hover:text-bordeaux-800'
              }`}
            >
              <Sparkles size={16} /> Detalles
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowAvailability(!showAvailability); setShowDetails(false); }}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                showAvailability ? 'bg-bordeaux-950 text-white border-bordeaux-950 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-gold/30 hover:text-bordeaux-800'
              }`}
            >
              <Calendar size={16} /> Agenda
            </button>
          </div>

          {/* Detailed Content Drops */}
          {(showDetails || showAvailability) && (
            <div className="animate-slideUp p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicle.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-bordeaux-800 shadow-sm border border-gray-50">
                        {getSpecIcon(spec)}
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 leading-tight">{spec}</span>
                    </div>
                  ))}
                </div>
              )}
              {showAvailability && (
                <AvailabilityCalendar vehicleName={vehicle.nombre} reservations={reservations} />
              )}
            </div>
          )}

          <button 
            onClick={handleBooking}
            disabled={!isAvailable && !isAdmin}
            className={`w-full group/btn flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-xl transition-all active:scale-95 ${
              isAvailable 
              ? 'bordeaux-gradient text-white hover:shadow-[0_20px_40px_-10px_rgba(128,0,0,0.4)]' 
              : 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-50'
            }`}
          >
            {isAvailable ? (
              <>Reservar Protocolo <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" /></>
            ) : (
              <span className="flex items-center gap-3"><Lock size={18} /> Unidad Bloqueada</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
