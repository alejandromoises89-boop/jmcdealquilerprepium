
import React, { useState, useMemo } from 'react';
import { Reservation } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface AvailabilityCalendarProps {
  vehicleName: string;
  reservations: Reservation[];
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ vehicleName, reservations }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const occupiedDates = useMemo(() => {
    const occupied = new Set<string>();
    
    const keyTerm = vehicleName.toLowerCase().split(' ').find(word => 
      !['toyota', 'hyundai', 'blanco', 'negro', 'gris'].includes(word)
    ) || vehicleName.toLowerCase();

    reservations.forEach((r) => {
      const resAuto = (r.auto || "").toLowerCase();
      const isMatch = resAuto.includes(keyTerm) || keyTerm.includes(resAuto);
      const shouldInclude = r.includeInCalendar !== false && r.status !== 'Cancelled';
      
      if (isMatch && shouldInclude) {
        const parseD = (s: string) => {
          if (!s) return null;
          const datePart = s.split(' ')[0];
          const parts = datePart.split(/[/-]/);
          if (parts.length !== 3) return null;
          
          let d, m, y;
          if (parts[0].length === 4) {
            y = parseInt(parts[0]);
            m = parseInt(parts[1]) - 1;
            d = parseInt(parts[2]);
          } else {
            d = parseInt(parts[0]);
            m = parseInt(parts[1]) - 1;
            y = parseInt(parts[2]);
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
          let iterations = 0;
          while (tempDate <= last && iterations < 90) {
            occupied.add(tempDate.toISOString().split('T')[0]);
            tempDate.setDate(tempDate.getDate() + 1);
            iterations++;
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

  const handlePrev = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNext = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  return (
    <div className="bg-white rounded-[2rem] border border-bordeaux-100 shadow-xl p-6 space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <button onClick={handlePrev} className="p-2 hover:bg-bordeaux-50 rounded-full text-bordeaux-800 transition-all"><ChevronLeft size={20}/></button>
        <h4 className="text-[11px] font-black text-bordeaux-950 uppercase tracking-[0.3em] flex items-center gap-3">
          <CalendarIcon size={16} className="text-gold" /> {monthName}
        </h4>
        <button onClick={handleNext} className="p-2 hover:bg-bordeaux-50 rounded-full text-bordeaux-800 transition-all"><ChevronRight size={20}/></button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].map(d => (
          <div key={d} className="text-[9px] font-black text-gray-300 text-center py-2">{d}</div>
        ))}
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-14" />;
          const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const dStr = dateObj.toISOString().split('T')[0];
          const isOccupied = occupiedDates.has(dStr);

          return (
            <div key={day} className={`relative h-14 flex flex-col items-center justify-center text-[10px] font-bold rounded-xl transition-all ${isOccupied ? 'bg-red-50 text-red-700 font-black border border-red-100' : 'bg-white text-gray-700 hover:bg-bordeaux-50 border border-transparent'}`}>
              <span className="relative z-10 leading-none">{day}</span>
              {isOccupied && (
                <span className="text-[7px] font-black uppercase tracking-tighter mt-1 opacity-80">Alquilado</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
         <div className="flex items-center gap-2">
            <div className="w-5 h-2 rounded-full bg-red-600"></div>
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Alquilado</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-5 h-2 rounded-full bg-gray-200"></div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Disponible</span>
         </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
