
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
    
    // Término clave para matching (ej: "vitz", "tucson")
    const keyTerm = vehicleName.toLowerCase().split(' ').find(word => 
      !['toyota', 'hyundai', 'blanco', 'negro', 'gris'].includes(word)
    ) || vehicleName.toLowerCase();

    reservations.forEach((r) => {
      const resAuto = (r.auto || "").toLowerCase();
      // Verificamos si la reserva pertenece a este vehículo (flexibilidad de términos)
      const isMatch = resAuto.includes(keyTerm) || keyTerm.includes(resAuto);
      const shouldInclude = r.includeInCalendar !== false && r.status !== 'Cancelled';
      
      if (isMatch && shouldInclude) {
        const parseD = (s: string) => {
          if (!s) return null;
          // Limpiar la cadena de hora si existe
          const datePart = s.split(' ')[0];
          const parts = datePart.split(/[/-]/);
          if (parts.length !== 3) return null;
          
          let d, m, y;
          if (parts[0].length === 4) { // Formato YYYY-MM-DD
            y = parseInt(parts[0]);
            m = parseInt(parts[1]) - 1;
            d = parseInt(parts[2]);
          } else { // Formato DD/MM/YYYY o DD-MM-YYYY
            d = parseInt(parts[0]);
            m = parseInt(parts[1]) - 1;
            y = parseInt(parts[2]);
            // Ajuste para años de 2 dígitos si existieran
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
          while (tempDate <= last && iterations < 90) { // Ampliado a 90 días para contratos largos
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
          if (!day) return <div key={`empty-${idx}`} className="h-10" />;
          const dateObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const dStr = dateObj.toISOString().split('T')[0];
          const isOccupied = occupiedDates.has(dStr);

          return (
            <div key={day} className={`relative h-12 flex flex-col items-center justify-center text-[10px] font-bold rounded-xl transition-all ${isOccupied ? 'bg-red-50 text-red-700 font-black' : 'bg-white text-gray-700 hover:bg-bordeaux-50'}`}>
              <span className="relative z-10">{day}</span>
              {isOccupied && (
                <div className="w-4/5 h-1.5 bg-red-600 rounded-full mt-0.5 shadow-[0_2px_4px_rgba(220,38,38,0.3)]" />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
         <div className="flex items-center gap-2">
            <div className="w-5 h-1.5 rounded-full bg-red-600"></div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ocupado / Raya Roja Horizontal</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-5 h-1.5 rounded-full bg-gray-100"></div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Disponibilidad VIP</span>
         </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
