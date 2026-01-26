
import React, { useState, useRef } from 'react';
import { Vehicle, Reservation } from '../types';
import { TRANSLATIONS, Language } from '../constants';
import { 
  ArrowRight, Star, Calendar, Settings2, 
  Shield, Music, Thermometer, Sparkles, Lock, Zap, Fuel, Users, Eye, Gauge, Share2, Copy, X
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
  const [showShare, setShowShare] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  const isAvailable = vehicle.estado === 'Disponible';
  const pricePYG = Math.round(vehicle.precio * exchangeRate);
  
  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable && !isAdmin) return;
    onSelect();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const getSpecIcon = (spec: string) => {
    const s = spec.toLowerCase();
    if (s.includes('motor') || s.includes('turbo') || s.includes('cv')) return <Zap size={12} />;
    if (s.includes('seguridad') || s.includes('airbag') || s.includes('abs')) return <Shield size={12} />;
    if (s.includes('radio') || s.includes('bluetooth') || s.includes('carplay') || s.includes('multimedia')) return <Music size={12} />;
    if (s.includes('aire') || s.includes('ac') || s.includes('climatizador')) return <Thermometer size={12} />;
    if (s.includes('cámara') || s.includes('sensores')) return <Eye size={12} />;
    if (s.includes('consumo') || s.includes('nafta') || s.includes('diesel') || s.includes('fuel')) return <Fuel size={12} />;
    if (s.includes('pasajeros') || s.includes('asientos') || s.includes('butacas')) return <Users size={12} />;
    if (s.includes('transmisión') || s.includes('automática') || s.includes('cvt')) return <Gauge size={12} />;
    return <Settings2 size={12} />;
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShare(true);
  };

  return (
    <>
      <div 
        ref={cardRef}
        className={`group relative bg-white dark:bg-dark-card rounded-[2rem] overflow-hidden transition-all duration-500 cursor-pointer border ${
          isHovered 
            ? 'border-gold shadow-2xl scale-[1.01]' 
            : 'border-transparent shadow-md'
        } ${!isAvailable ? 'opacity-90 grayscale-[0.3]' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
        onMouseMove={handleMouseMove}
        onClick={handleBooking}
      >
        {!isAvailable && (
          <div className="absolute inset-0 z-[40] bg-dark-base/70 backdrop-blur-[4px] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-bordeaux-800/90 border-2 border-gold/60 px-5 py-2 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] transform -rotate-2">
              <p className="text-white font-robust font-speed text-xs flex items-center gap-2 uppercase tracking-widest">
                <Lock size={14} className="text-gold" /> {t.booked}
              </p>
            </div>
          </div>
        )}

        <div className="relative aspect-[16/9] overflow-hidden bg-gray-50 dark:bg-dark-base flex items-center justify-center p-4">
          <img 
            src={vehicle.img} 
            alt={vehicle.nombre} 
            className="w-[85%] h-[85%] object-contain drop-shadow-2xl transition-transform duration-700" 
            style={{ transform: isHovered ? `scale(1.1) translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)` : 'scale(1)' }}
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-30">
            <div className={`px-3 py-1 rounded-full text-[8px] font-robust backdrop-blur-md border shadow-sm ${
              isAvailable ? 'bg-white/90 dark:bg-dark-card/90 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/40' : 'bg-red-950/90 text-white border-red-500/40'
            }`}>
              <span className="flex items-center gap-1.5 uppercase tracking-widest">
                <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {isAvailable ? t.available : t.booked}
              </span>
            </div>
          </div>
          <button onClick={handleShare} className="absolute top-3 right-3 z-30 p-2 bg-white/90 dark:bg-dark-elevated rounded-xl text-bordeaux-800 dark:text-gold shadow-md hover:scale-110 active:scale-95 transition-all">
            <Share2 size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-gold">
                {[1,2,3,4,5].map(i => <Star key={i} size={8} className="fill-current" />)}
                <span className="text-[7px] font-robust ml-2 text-bordeaux-800 dark:text-gold/60 uppercase">Platinum Selection</span>
              </div>
              <h3 className="text-lg font-robust font-speed text-bordeaux-950 dark:text-white leading-tight">{vehicle.nombre}</h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-base text-bordeaux-950 dark:text-gray-400 rounded-md text-[8px] font-robust border dark:border-gold/10">{vehicle.placa}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{vehicle.color}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-robust text-bordeaux-950 dark:text-white">R$ {vehicle.precio}</p>
              <p className="text-[8px] font-robust text-gold mt-0.5">Gs. {pricePYG.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails); setShowAvailability(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[8px] font-robust transition-all border uppercase tracking-widest ${
                  showDetails ? 'bg-bordeaux-950 dark:bg-gold text-white dark:text-dark-base border-bordeaux-950 dark:border-gold shadow-lg' : 'bg-white dark:bg-dark-elevated text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5'
                }`}>
                <Sparkles size={12} /> {t.details}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowAvailability(!showAvailability); setShowDetails(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[8px] font-robust transition-all border uppercase tracking-widest ${
                  showAvailability ? 'bg-bordeaux-950 dark:bg-gold text-white dark:text-dark-base border-bordeaux-950 dark:border-gold shadow-lg' : 'bg-white dark:bg-dark-elevated text-gray-400 dark:text-gray-400 border-gray-100 dark:border-white/5'
                }`}>
                <Calendar size={12} /> {t.agenda}
              </button>
            </div>

            {(showDetails || showAvailability) && (
              <div className="animate-slideUp p-3 bg-gray-50 dark:bg-dark-base rounded-2xl border dark:border-gold/10" onClick={(e) => e.stopPropagation()}>
                {showDetails && (
                  <div className="grid grid-cols-2 gap-2">
                    {vehicle.specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 overflow-hidden">
                        <div className="w-6 h-6 bg-white dark:bg-dark-elevated rounded-lg flex items-center justify-center text-bordeaux-800 dark:text-gold shadow-sm shrink-0">{getSpecIcon(spec)}</div>
                        <span className="text-[7px] font-bold text-gray-700 dark:text-gray-400 leading-tight uppercase truncate">{spec}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showAvailability && (
                  <AvailabilityCalendar 
                    vehicleName={vehicle.nombre} 
                    reservations={reservations} 
                    language={language} 
                    onDateRangeSelected={(start, end) => onSelect(start, end)}
                  />
                )}
              </div>
            )}

            <button onClick={handleBooking} disabled={!isAvailable && !isAdmin}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-robust text-[9px] uppercase tracking-[0.4em] shadow-lg transition-all active:scale-95 ${
                isAvailable ? 'bordeaux-gradient text-white hover:brightness-110 shadow-bordeaux-800/30' : 'bg-gray-100 dark:bg-dark-elevated text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}>
              {isAvailable ? <>{t.rent} <ArrowRight size={14} /></> : <><Lock size={12} /> {t.booked}</>}
            </button>
          </div>
        </div>
      </div>

      {showShare && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-dark-base/80 backdrop-blur-sm" onClick={() => setShowShare(false)}>
          <div className="bg-white dark:bg-dark-card w-full max-w-xs rounded-3xl p-6 space-y-6 animate-slideUp border-2 border-gold/20 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h4 className="text-base font-robust font-speed dark:text-white uppercase italic">Difundir Unidad</h4><button onClick={() => setShowShare(false)} className="text-gray-400 hover:text-bordeaux-800 transition-colors"><X size={18}/></button></div>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-100 dark:border-green-800/30 transition-transform hover:scale-105" onClick={() => window.open(`https://wa.me/?text=Echa%20un%20vistazo%20a%20este%20${vehicle.nombre}%20en%20JM%20Asociados.`)}><ArrowRight size={22} className="text-green-600" /><span className="text-[8px] font-robust uppercase tracking-widest">WhatsApp</span></button>
              <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-dark-elevated rounded-2xl border border-gray-100 dark:border-white/5 transition-transform hover:scale-105" onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Copiado."); }}><Copy size={22} className="text-gold" /><span className="text-[8px] font-robust uppercase tracking-widest">Copiar Link</span></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleCard;
