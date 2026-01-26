
import React, { useState, useMemo, useEffect } from 'react';
import { Reservation } from '../types';
import { TRANSLATIONS, Language } from '../constants';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface AvailabilityCalendarProps {
  vehicleName: string;
  reservations: Reservation[];
  onDateRangeSelected?: (start: Date, end: Date) => void;
  language?: Language;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ vehicleName, reservations, onDateRangeSelected, language = 'es' }) => {
  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  
  const t = TRANSLATIONS[language];

  // Unificamos todas las fechas ocupadas en un solo mapa de estado
  const occupiedDates = useMemo(() => {
    const occupied = new Set<string>();
    const keyTerm = vehicleName.toLowerCase()
      .replace(/toyota|hyundai|blanco|negro|gris|suv|familiar|compacto/g, '')
      .trim();

    reservations.forEach((r) => {
      if (!r.inicio || r.status === 'Cancelled' || r.status === 'Completed') return;
      const resAuto = (r.auto || "").toLowerCase();
      const isMatch = resAuto.includes(keyTerm) || keyTerm.includes(resAuto) || resAuto === vehicleName.toLowerCase();
      
      if (isMatch) {
        const parseD = (s: string) => {
          if (!s) return null;
          const datePart = s.split(' ')[0];
          const parts = datePart.split(/[/-]/);
          if (parts.length !== 3) return null;
          let d, m, y;
          if (parts[0].length === 4) { y = parseInt(parts[0]); m = parseInt(parts[1]) - 1; d = parseInt(parts[2]); }
          else { d = parseInt(parts[0]); m = parseInt(parts[1]) - 1; y = parseInt(parts[2]); if (y < 100) y += 2000; }
          const dt = new Date(y, m, d);
          dt.setHours(0,0,0,0);
          return dt;
        };

        const start = parseD(r.inicio);
        const end = parseD(r.fin);
        if (start && end) {
          const tempDate = new Date(start);
          while (tempDate <= end) {
            occupied.add(tempDate.toISOString().split('T')[0]);
            tempDate.setDate(tempDate.getDate() + 1);
          }
        }
      }
    });
    return occupied;
  }, [vehicleName, reservations]);

  // Manejo de la selección de fechas con delay de 2 segundos
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    clickedDate.setHours(0,0,0,0);

    const dStr = clickedDate.toISOString().split('T')[0];
    if (occupiedDates.has(dStr)) return; // No permitir seleccionar días alquilados

    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(clickedDate);
      setSelectionEnd(null);
    } else if (selectionStart && !selectionEnd) {
      if (clickedDate < selectionStart) {
        setSelectionStart(clickedDate);
      } else {
        setSelectionEnd(clickedDate);
      }
    }
  };

  useEffect(() => {
    if (selectionStart && selectionEnd && onDateRangeSelected) {
      const timer = setTimeout(() => {
        onDateRangeSelected(selectionStart, selectionEnd);
        // Opcional: limpiar selección después de enviar
        setSelectionStart(null);
        setSelectionEnd(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectionStart, selectionEnd, onDateRangeSelected]);

  const monthName = new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' }).format(viewDate);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7;

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isInRange = (day: number) => {
    if (!selectionStart || !selectionEnd) return false;
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    d.setHours(0,0,0,0);
    return d >= selectionStart && d <= selectionEnd;
  };

  const isSelected = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    d.setHours(0,0,0,0);
    return (selectionStart && d.getTime() === selectionStart.getTime()) || 
           (selectionEnd && d.getTime() === selectionEnd.getTime());
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gold/10 p-4 space-y-4 shadow-sm" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center bg-gray-50 dark:bg-dark-base p-2 rounded-xl">
        <button 
          onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }} 
          className="p-1.5 hover:bg-white dark:hover:bg-dark-elevated rounded-lg text-bordeaux-800 dark:text-gold transition-all"
        >
          <ChevronLeft size={18}/>
        </button>
        <div className="text-center">
            <p className="text-[7px] font-black text-gold uppercase tracking-[0.3em] leading-none mb-1">Disponibilidad Real</p>
            <h4 className="text-[10px] font-robust text-bordeaux-950 dark:text-white uppercase italic">{monthName}</h4>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }} 
          className="p-1.5 hover:bg-white dark:hover:bg-dark-elevated rounded-lg text-bordeaux-800 dark:text-gold transition-all"
        >
          <ChevronRight size={18}/></button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-[8px] font-black text-gray-300 text-center py-1">{d}</div>)}
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const dObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          dObj.setHours(0,0,0,0);
          const dStr = dObj.toISOString().split('T')[0];
          const isOccupied = occupiedDates.has(dStr);
          const selected = isSelected(day);
          const inRange = isInRange(day);

          return (
            <div 
              key={day} 
              onClick={() => handleDateClick(day)}
              className={`aspect-square flex flex-col items-center justify-center text-[9px] font-robust rounded-lg border transition-all relative cursor-pointer ${
                isOccupied 
                  ? 'bg-bordeaux-800 text-white border-bordeaux-900 font-black cursor-not-allowed'
                  : selected || inRange
                    ? 'bg-gold text-dark-base border-gold font-black z-10 scale-105 shadow-lg'
                    : 'bg-white dark:bg-dark-elevated text-gray-700 dark:text-white border-gray-50 dark:border-white/5 hover:border-gold/30'
              }`}
            >
              {day}
              {isOccupied && <Lock size={7} className="mt-0.5 opacity-60" />}
            </div>
          );
        })}
      </div>
      
      <div className="pt-2 border-t dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-bordeaux-800 rounded-full"></div>
          <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest">ALQUILADO / BLOQUEADO</p>
        </div>
        {selectionStart && !selectionEnd && (
          <p className="text-[7px] font-black text-gold animate-pulse uppercase tracking-widest">Seleccione fecha de entrega...</p>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
