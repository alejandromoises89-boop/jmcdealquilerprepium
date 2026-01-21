
import React, { useMemo } from 'react';
import { Reservation } from '../types';
import { FILTER_DATE_START } from '../constants';

interface AvailabilityCalendarProps {
  vehicleName: string;
  reservations: Reservation[];
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ vehicleName, reservations }) => {
  const occupiedDates = useMemo(() => {
    const occupied = new Set<string>();
    const targetModel = vehicleName.toLowerCase()
      .replace(/toyota|hyundai|2010|blanco|negro|gris|silver|2009/g, '')
      .trim();

    reservations.forEach((r) => {
      const resAuto = (r.auto || "").toLowerCase();
      const isMatch = resAuto.includes(targetModel) || targetModel.includes(resAuto);
      
      if (isMatch && r.status !== 'Cancelled') {
        const parseD = (s: string) => {
          if (!s) return null;
          const p = s.split(' ')[0].split(/[/-]/);
          if (p.length !== 3) return null;
          let d, m, y;
          if (p[0].length === 4) { y = parseInt(p[0]); m = parseInt(p[1]) - 1; d = parseInt(p[2]); }
          else { d = parseInt(p[0]); m = parseInt(p[1]) - 1; y = parseInt(p[2]); }
          const date = new Date(y, m, d);
          return isNaN(date.getTime()) ? null : date;
        };

        const start = parseD(r.inicio);
        const end = parseD(r.fin);

        if (start && end) {
          const current = new Date(start);
          current.setHours(0,0,0,0);
          const last = new Date(end);
          last.setHours(0,0,0,0);
          
          let safety = 0;
          while (current <= last && safety < 365) {
            // Solo marcar como reservado si es a partir de enero 2026 según el requerimiento
            if (current >= FILTER_DATE_START) {
              occupied.add(current.toISOString().split('T')[0]);
            }
            current.setDate(current.getDate() + 1);
            safety++;
          }
        }
      }
    });
    return occupied;
  }, [vehicleName, reservations]);

  const renderMonth = (monthIndex: number, year: number) => {
    const date = new Date(year, monthIndex, 1);
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
    const firstDay = (date.getDay() + 6) % 7; 
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="flex-1 min-w-[280px] w-full space-y-4">
        <h4 className="text-[11px] font-black text-bordeaux-950 uppercase tracking-[0.3em] text-center capitalize py-3 bg-bordeaux-50/50 rounded-2xl border border-bordeaux-100/30">
          {monthName} {year}
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => (
            <div key={d} className="text-[9px] font-black text-gray-300 text-center py-2">{d}</div>
          ))}
          {days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="h-9" />;
            const currentDay = new Date(year, monthIndex, day);
            const dStr = currentDay.toISOString().split('T')[0];
            const isOccupied = occupiedDates.has(dStr);

            return (
              <div 
                key={day} 
                className={`relative h-9 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all duration-300 ${
                  isOccupied ? 'text-gray-300 bg-gray-50/50 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-50'
                }`}
                title={isOccupied ? "Reservado" : "Disponible"}
              >
                {day}
                {isOccupied && (
                  <div className="absolute inset-x-1.5 bottom-1.5 h-[3px] bg-red-600/60 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-4 md:p-8 border border-bordeaux-50 shadow-inner space-y-8 animate-fadeIn w-full">
      <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
        {renderMonth(currentMonth, currentYear)} 
        {renderMonth(1, 2026)} {/* Febrero 2026 */}
      </div>
      
      <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-[3px] bg-red-600/60 rounded-full" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reservado (2026+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-white border border-gray-100" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Disponible</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
