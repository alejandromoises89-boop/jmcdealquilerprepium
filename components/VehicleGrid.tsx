
import React, { useState, useMemo } from 'react';
import { Vehicle, Reservation } from '../types';
import VehicleCard from './VehicleCard';
import BookingModal from './BookingModal';
import { LayoutGrid, CheckCircle, Car, Calendar } from 'lucide-react';

interface VehicleGridProps {
  flota: Vehicle[];
  exchangeRate: number;
  reservations: Reservation[];
  onAddReservation: (res: Reservation) => void;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({ flota, exchangeRate, reservations, onAddReservation }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [onlyAvailableThisMonth, setOnlyAvailableThisMonth] = useState(false);

  const filteredFlota = useMemo(() => {
    let result = [...flota];

    if (filterAvailability !== 'all') {
      result = result.filter(v => v.estado === filterAvailability);
    }

    if (onlyAvailableThisMonth) {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      result = result.filter(v => {
        const resForThisVehicle = reservations.filter(r => r.auto === v.nombre && r.status !== 'Completed' && r.status !== 'Cancelled');
        
        let bookedDaysCount = 0;
        resForThisVehicle.forEach(r => {
          const start = new Date(r.inicio);
          const end = new Date(r.fin);
          if (start <= endOfMonth && end >= now) {
            const effectiveStart = start < now ? now : start;
            const effectiveEnd = end > endOfMonth ? endOfMonth : end;
            bookedDaysCount += Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
          }
        });

        const totalDaysInMonth = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return bookedDaysCount < totalDaysInMonth;
      });
    }

    return result;
  }, [flota, filterAvailability, onlyAvailableThisMonth, reservations]);

  return (
    <div className="space-y-16">
      {/* Barra de filtros simplificada */}
      <div className="relative z-10 bg-white/90 backdrop-blur-2xl p-6 md:p-8 rounded-[3rem] border border-gray-100 shadow-2xl shadow-bordeaux-900/5 animate-slideUp">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-bordeaux-50 rounded-2xl text-bordeaux-800">
            <LayoutGrid size={18} className="text-gold" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtros de Disponibilidad</span>
          </div>

          <div className="h-8 w-px bg-gray-100 hidden md:block"></div>

          <button 
            onClick={() => setOnlyAvailableThisMonth(!onlyAvailableThisMonth)}
            className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
              onlyAvailableThisMonth ? 'bg-bordeaux-800 text-white shadow-xl scale-105' : 'bg-white border border-gray-100 text-gray-400 hover:border-bordeaux-200'
            }`}
          >
            <Calendar size={18} /> Disponibilidad del Mes
          </button>

          <button 
            onClick={() => setFilterAvailability(filterAvailability === 'all' ? 'Disponible' : 'all')}
            className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
              filterAvailability === 'Disponible' 
              ? 'bg-bordeaux-800 text-white shadow-xl scale-105' 
              : 'bg-white border border-gray-100 text-gray-400 hover:border-bordeaux-200'
            }`}
          >
            <CheckCircle size={18} /> Ver Solo Disponibles
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
        {filteredFlota.map((vehicle) => (
          <VehicleCard 
            key={vehicle.id} 
            vehicle={vehicle} 
            exchangeRate={exchangeRate}
            reservations={reservations}
            onSelect={() => setSelectedVehicle(vehicle)}
          />
        ))}

        {filteredFlota.length === 0 && (
          <div className="col-span-full py-32 text-center space-y-8 animate-fadeIn">
            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto text-gray-200 shadow-inner">
              <Car size={60} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-serif font-bold text-gray-400">Sin Unidades</h3>
              <p className="text-gray-300 font-medium">No hay vehículos disponibles con estos criterios de tiempo.</p>
            </div>
            <button 
              onClick={() => {setFilterAvailability('all'); setOnlyAvailableThisMonth(false);}} 
              className="px-10 py-4 bg-bordeaux-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-bordeaux-950 transition-all"
            >
              Restablecer Vista
            </button>
          </div>
        )}
      </div>

      {selectedVehicle && (
        <BookingModal 
          vehicle={selectedVehicle}
          exchangeRate={exchangeRate}
          reservations={reservations}
          onClose={() => setSelectedVehicle(null)}
          onSubmit={(res) => {
            onAddReservation(res);
            setSelectedVehicle(null);
          }}
        />
      )}
    </div>
  );
};

export default VehicleGrid;
