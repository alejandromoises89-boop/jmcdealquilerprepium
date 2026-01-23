
import React, { useState, useMemo } from 'react';
import { Reservation } from '../types';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface AvailabilityCalendarProps {
  vehicleName: string;
  reservations: Reservation[];
  onDateSelect?: (date: Date) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ vehicleName, reservations, onDateSelect }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [viewDate, setViewDate] = useState(new Date(currentYear, currentMonth, 1));

  // Límites de navegación: Mes actual hasta Febrero 2026
  const minDate = new Date(currentYear, currentMonth, 1);
  const maxDate = new Date(2026, 1, 1); // 1 = Febrero

  const occupiedDates = useMemo(() => {
    const occupied = new Set<string>();
    
    const keyTerm = vehicleName.toLowerCase().replace(/toyota|hyundai|blanco|negro|gris|suv|familiar|compacto/g, '').trim();

    reservations.forEach((r) => {
      const resAuto = (r.auto || "").toLowerCase();
      const isMatch = resAuto.includes(keyTerm) || keyTerm.includes(resAuto);
      const isCancelled = r.status === 'Cancelled';
      const isCalendarVisible = r.includeInCalendar !== false;
      
      if (isMatch && !isCancelled && isCalendarVisible) {
        const parseD = (s: string) => {
          if (!s) return null;
          const datePart = s.split(' ')[0];
          const parts = datePart.split(/[/-]/);
          if (parts.length !== 3) return null;
          
          let d, m, y;
          if (parts[0].length === 4) { // YYYY-MM-DD
            y = parseInt(parts[0]); m = parseInt(parts[1]) - 1; d = parseInt(parts[2]);
          } else { // DD-MM-YYYY
            d = parseInt(parts[0]); m = parseInt(parts[1]) - 1; y = parseInt(parts[2]);
            if (y < 100) y += 2000;
          }
          return new Date(y, m, d);
        };

        const start = parseD(r.inicio);
        const end = parseD(r.fin);

        if (start && end) {
          const curr = new Date(start);
          curr.setHours(0, 0, 0, 0);
          const last = new Date(end);
          last.setHours(0, 0, 0, 0);
          
          const tempDate = new Date(curr);
          let safety = 0;
          while (tempDate <= last && safety < 100) {
            occupied.add(tempDate.toISOString().split('T')[0]);
            tempDate.setDate(tempDate.getDate() + 1);
            safety++;
          }
        }
      }
    });
    return occupied;
  }, [vehicleName, reservations]);

  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(viewDate);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7;

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handlePrev = () => {
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    if (prevMonth >= minDate) setViewDate(prevMonth);
  };
  
  const handleNext = () => {
    const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    if (nextMonth <= maxDate) setViewDate(nextMonth);
  };

  const handleDayClick = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dStr = date.toISOString().split('T')[0];
    if (occupiedDates.has(dStr)) return;
    if (onDateSelect) onDateSelect(date);
  };

  const canGoPrev = viewDate > minDate;
  const canGoNext = viewDate < maxDate;

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-5 md:p-8 space-y-5 md:space-y-8 animate-fadeIn w-full mx-auto overflow-hidden">
      <div className="flex justify-between items-center bg-gray-50/80 p-2 md:p-3 rounded-2xl md:rounded-[2.5rem] border border-gray-100">
        <button 
          onClick={handlePrev} 
          disabled={!canGoPrev}
          className={`p-2 md:p-3.5 rounded-xl md:rounded-2xl transition-all ${!canGoPrev ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-bordeaux-800 bg-white shadow-sm hover:scale-110 active:scale-90 border border-gray-50'}`}
        >
          <ChevronLeft size={16} className="md:w-6 md:h-6"/>
        </button>
        <div className="text-center">
          <p className="text-[8px] md:text-[10px] font-black text-gold uppercase tracking-[0.2em] md:tracking-[0.4em] mb-1 md:mb-1.5">Agenda VIP</p>
          <h4 className="text-[11px] md:text-sm font-black text-bordeaux-950 uppercase tracking-widest italic truncate max-w-[150px]">
             {monthName}
          </h4>
        </div>
        <button 
          onClick={handleNext} 
          disabled={!canGoNext}
          className={`p-2 md:p-3.5 rounded-xl md:rounded-2xl transition-all ${!canGoNext ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-bordeaux-800 bg-white shadow-sm hover:scale-110 active:scale-90 border border-gray-50'}`}
        >
          <ChevronRight size={16} className="md:w-6 md:h-6"/>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-[9px] md:text-xs font-black text-gray-300 text-center py-2 md:py-3 uppercase tracking-tighter">{d}</div>
        ))}
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
          
          const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const dStr = dateObj.toISOString().split('T')[0];
          const isOccupied = occupiedDates.has(dStr);
          const isJan2026Plus = dateObj >= new Date(2026, 0, 1);

          return (
            <button 
              key={day} 
              disabled={isOccupied}
              onClick={() => handleDayClick(day)}
              className={`relative aspect-square flex items-center justify-center text-[10px] md:text-xs font-black rounded-xl md:rounded-2xl transition-all border ${
                isOccupied 
                ? 'bg-gray-100 text-gray-300 border-transparent cursor-not-allowed opacity-50' 
                : 'bg-white text-bordeaux-950 border-gray-50 hover:bg-bordeaux-50 hover:border-gold/30 hover:scale-110 active:scale-95 shadow-sm'
              }`}
            >
              <span>{day}</span>
              {isOccupied && isJan2026Plus && (
                <div className="absolute top-1 right-1 md:top-2 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 bg-gold rounded-full shadow-[0_0_5px_rgba(212,175,55,1)]" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="pt-4 md:pt-6 border-t border-gray-50">
        <div className="bg-bordeaux-50/50 p-3 md:p-5 rounded-2xl md:rounded-3xl flex items-start gap-3 md:gap-4 border border-bordeaux-100/30">
          <Info size={16} className="text-bordeaux-800 shrink-0 mt-0.5 md:w-[20px] md:h-[20px]" />
          <p className="text-[8px] md:text-[10px] font-bold text-bordeaux-900 leading-relaxed uppercase tracking-wider">
            Protocolo de <span className="text-gold font-black">bloqueo áureo</span> activo para la flota Platinum durante el ejercicio 2026.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
