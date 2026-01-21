
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
      .replace(/toyota|hyundai|2010|blanco|negro|gris|silver/g, '')
      .trim();

    reservations.forEach((r) => {
      const resAuto = (r.auto || "").toLowerCase();
      // Improved model matching logic
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

  const renderMonth = (monthIndex: number) => {
    const year = 2026;
    const date = new Date(year, monthIndex, 1);
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
    const firstDay = (date.getDay() + 6) % 7; 
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="flex-1 w-full space-y-4">
        <h4 className="text-[11px] font-black text-bordeaux-950 uppercase tracking-[0.4em] text-center capitalize py-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
          {monthName} {year}
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => (
            <div key={d} className="text-[9px] font-black text-gray-300 text-center py-2">{d}</div>
          ))}
          {days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
            const currentDay = new Date(year, monthIndex, day);
            const dStr = currentDay.toISOString().split('T')[0];
            const isOccupied = occupiedDates.has(dStr);

            return (
              <div 
                key={day} 
                className={`relative h-10 sm:h-12 flex items-center justify-center text-xs font-bold rounded-xl transition-all ${
                  isOccupied ? 'text-gray-300 bg-gray-50/10' : 'text-gray-700 bg-gray-50/20'
                }`}
              >
                {day}
                {isOccupied && (
                  <div className="absolute top-1.5 right-1.5">
                    {/* Subtle Golden Dot Marking */}
                    <div className="w-1.5 h-1.5 bg-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)] animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 lg:p-10 border border-bordeaux-50 shadow-xl space-y-8 animate-fadeIn w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Only current month (Jan) and Feb 2026 as requested */}
        {renderMonth(0)}
        {renderMonth(1)}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Unidad Reservada</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-lg bg-gray-50 border border-gray-100" />
          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Disponible</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
