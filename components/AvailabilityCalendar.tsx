import React, { useState, useMemo, useEffect } from 'react';
import { Reservation } from '../types';
import { TRANSLATIONS, Language } from '../constants';
import { ChevronLeft, ChevronRight, Lock, Check } from 'lucide-react';

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

  // LOGICA PRINCIPAL DE BLOQUEO DE FECHAS
  const occupiedDates = useMemo(() => {
    const occupied = new Set<string>();
    
    // Normalizar nombre del vehículo actual para comparar
    // Ejemplo: "Toyota Vitz Blanco" -> "toyota vitz blanco"
    const targetName = vehicleName.toLowerCase();
    
    reservations.forEach((r) => {
      if (!r.inicio || (r.status !== 'Confirmed' && r.status !== 'Completed')) return;
      
      const resAuto = (r.auto || "").toLowerCase();
      
      // Coincidencia estricta primero
      let isMatch = resAuto === targetName;

      // Si no hay coincidencia exacta, intentar coincidencia parcial inteligente
      if (!isMatch) {
         // Si la reserva contiene el nombre completo del vehículo (ej: Reserva="Toyota Vitz Blanco (Juan)" vs Auto="Toyota Vitz Blanco")
         if (resAuto.includes(targetName)) isMatch = true;
         // Si el vehículo contiene el nombre de la reserva (ej: Auto="Toyota Vitz Blanco" vs Reserva="Vitz Blanco")
         else if (targetName.includes(resAuto)) isMatch = true;
      }
      
      if (isMatch) {
        // Función para parsear fechas YYYY-MM-DD (Formato ISO estandarizado por googleSheetService)
        const parseD = (s: string) => {
          if (!s) return null;
          // googleSheetService ya normaliza a YYYY-MM-DD
          const parts = s.split('-');
          if (parts.length === 3) {
             const y = parseInt(parts[0]);
             const m = parseInt(parts[1]) - 1;
             const d = parseInt(parts[2]);
             const dt = new Date(y, m, d);
             dt.setHours(0,0,0,0);
             return dt;
          }
          return null;
        };

        const start = parseD(r.inicio);
        // Si no hay fecha fin, asumimos 1 día
        const end = r.fin ? parseD(r.fin) : start; 
        
        if (start && end) {
          const tempDate = new Date(start);
          const endDateObj = new Date(end);
          
          // Loop para bloquear CADA DÍA entre inicio y fin
          while (tempDate <= endDateObj) {
            occupied.add(tempDate.toISOString().split('T')[0]);
            tempDate.setDate(tempDate.getDate() + 1);
          }
        }
      }
    });
    return occupied;
  }, [vehicleName, reservations]);

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    clickedDate.setHours(0,0,0,0);

    const dStr = clickedDate.toISOString().split('T')[0];
    if (occupiedDates.has(dStr)) return; // No permitir click en ocupados

    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(clickedDate);
      setSelectionEnd(null);
    } else if (selectionStart && !selectionEnd) {
      if (clickedDate < selectionStart) {
        setSelectionStart(clickedDate);
      } else {
        // Verificar si hay días bloqueados en medio del rango seleccionado
        let temp = new Date(selectionStart);
        let blocked = false;
        while(temp <= clickedDate) {
           if(occupiedDates.has(temp.toISOString().split('T')[0])) {
             blocked = true;
             break;
           }
           temp.setDate(temp.getDate() + 1);
        }
        
        if(!blocked) {
           setSelectionEnd(clickedDate);
        } else {
          // Si hay bloqueo en medio, reiniciar selección
          setSelectionStart(clickedDate);
          setSelectionEnd(null);
        }
      }
    }
  };

  useEffect(() => {
    if (selectionStart && selectionEnd && onDateRangeSelected) {
      const timer = setTimeout(() => {
        onDateRangeSelected(selectionStart, selectionEnd);
        setSelectionStart(null);
        setSelectionEnd(null);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [selectionStart, selectionEnd, onDateRangeSelected]);

  const monthName = new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' }).format(viewDate);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() + 6) % 7;

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDayStatus = (day: number) => {
    if (!day) return null;
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    d.setHours(0,0,0,0);
    const dStr = d.toISOString().split('T')[0];
    
    const isOccupied = occupiedDates.has(dStr);
    const isSelectionPoint = (selectionStart && d.getTime() === selectionStart.getTime()) || (selectionEnd && d.getTime() === selectionEnd.getTime());
    const isSelectionRange = selectionStart && selectionEnd && d > selectionStart && d < selectionEnd;
    
    return { isOccupied, isSelectionPoint, isSelectionRange };
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-[2rem] border border-gray-100 dark:border-gold/10 p-6 space-y-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center bg-gray-50 dark:bg-dark-base p-3 rounded-2xl">
        <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }} className="p-2 hover:bg-white dark:hover:bg-dark-elevated rounded-xl text-bordeaux-800 dark:text-gold transition-all"><ChevronLeft size={20}/></button>
        <div className="text-center"><p className="text-[7px] font-black text-gold uppercase tracking-[0.3em] leading-none mb-1">Disponibilidad Platinum</p><h4 className="text-[10px] font-robust text-bordeaux-950 dark:text-white uppercase italic">{monthName}</h4></div>
        <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }} className="p-2 hover:bg-white dark:hover:bg-dark-elevated rounded-xl text-bordeaux-800 dark:text-gold transition-all"><ChevronRight size={20}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-[8px] font-black text-gray-300 text-center py-1">{d}</div>)}
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const status = getDayStatus(day);
          if (!status) return null;

          return (
            <div 
              key={day} 
              onClick={() => handleDateClick(day)} 
              className={`aspect-square flex flex-col items-center justify-center text-[9px] font-robust rounded-xl border transition-all relative cursor-pointer ${
                status.isOccupied 
                  ? 'bg-bordeaux-800 text-white border-bordeaux-900 font-black cursor-not-allowed shadow-inner opacity-90' 
                  : status.isSelectionPoint 
                    ? 'bg-gold text-white border-gold font-black scale-105 shadow-lg z-10' 
                    : status.isSelectionRange 
                      ? 'bg-gold/40 text-bordeaux-950 border-gold/50 font-bold' 
                      : 'bg-white dark:bg-dark-elevated text-gray-700 dark:text-white border-gray-50 dark:border-white/5 hover:border-gold/30 hover:bg-gray-50'
              }`}
            >
              {day}
              {status.isOccupied && <Lock size={8} className="absolute bottom-1 right-1 opacity-70 text-white" />}
              {status.isSelectionPoint && <Check size={8} className="absolute bottom-1 right-1 opacity-90" />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-6 pt-2 border-t dark:border-white/5">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-bordeaux-800 rounded-sm"></div><span className="text-[7px] font-black text-gray-400 uppercase">Ocupado</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gold rounded-sm"></div><span className="text-[7px] font-black text-gray-400 uppercase">Selección</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white dark:bg-dark-elevated border border-gray-100 dark:border-white/5 rounded-sm"></div><span className="text-[7px] font-black text-gray-400 uppercase">Libre</span></div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;