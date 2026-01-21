import React, { useState, useMemo } from 'react';
import { Vehicle, Reservation } from '../types';
import VehicleCard from './VehicleCard';
import BookingModal from './BookingModal';
import { Search, Filter, ArrowUpDown, LayoutGrid, CheckCircle, Car, X, Calendar } from 'lucide-react';

interface VehicleGridProps {
  flota: Vehicle[];
  exchangeRate: number;
  reservations: Reservation[];
  onAddReservation: (res: Reservation) => void;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({ flota, exchangeRate, reservations, onAddReservation }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAvailability, setFilterAvailability] = useState<string>('all');
  const [onlyAvailableThisMonth, setOnlyAvailableThisMonth] = useState(false);

  const filteredFlota = useMemo(() => {
    let result = [...flota];

    if (searchTerm) {
      result = result.filter(v => 
        v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.placa.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      result = result.filter(v => v.tipo === filterType);
    }

    if (filterAvailability !== 'all') {
      result = result.filter(v => v.estado === filterAvailability);
    }

    if (onlyAvailableThisMonth) {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      result = result.filter(v => {
        // Simple logic: if there's any reservation covering the entire month, it's not available
        // Better: check if there is at least 1 day available this month.
        const resForThisVehicle = reservations.filter(r => r.auto === v.nombre && r.status !== 'Completed' && r.status !== 'Cancelled');
        
        // Find if there's any gap in reservations this month
        // For simplicity, we check if total booked days < days in month
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

    if (sortOrder === 'asc') {
      result.sort((a, b) => a.precio - b.precio);
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.precio - a.precio);
    }

    return result;
  }, [flota, searchTerm, sortOrder, filterType, filterAvailability, onlyAvailableThisMonth, reservations]);

  return (
    <div className="space-y-16">
      <div className="sticky top-24 z-40 bg-white/90 backdrop-blur-2xl p-6 md:p-8 rounded-[3rem] border border-gray-100 shadow-2xl shadow-bordeaux-900/5 space-y-6 animate-slideUp">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:max-w-xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-bordeaux-800 transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Buscar por modelo o placa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[2rem] focus:ring-2 focus:ring-bordeaux-800 transition-all outline-none font-bold text-base shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-gray-50 px-6 py-4 rounded-[1.5rem] shadow-inner border border-gray-100/50">
              <Filter size={18} className="text-gold" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer text-gray-700"
              >
                <option value="all">Categorías</option>
                <option value="SUV">SUV</option>
                <option value="Compacto">Compacto</option>
                <option value="Familiar">Familiar</option>
              </select>
            </div>

            <button 
              onClick={() => setOnlyAvailableThisMonth(!onlyAvailableThisMonth)}
              className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
                onlyAvailableThisMonth ? 'bg-bordeaux-800 text-white shadow-xl' : 'bg-white border border-gray-100 text-gray-400'
              }`}
            >
              <Calendar size={18} /> Disponibles este mes
            </button>

            <button 
              onClick={() => setFilterAvailability(filterAvailability === 'all' ? 'Disponible' : 'all')}
              className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
                filterAvailability === 'Disponible' 
                ? 'bg-bordeaux-800 text-white shadow-xl' 
                : 'bg-white border border-gray-100 text-gray-400'
              }`}
            >
              <CheckCircle size={18} /> Disponibles ahora
            </button>
          </div>
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
              <h3 className="text-3xl font-serif font-bold text-gray-400">Sin Unidades Disponibles</h3>
              <p className="text-gray-300 font-medium">No hay vehículos que coincidan con los filtros seleccionados.</p>
            </div>
            <button 
              onClick={() => {setSearchTerm(''); setFilterType('all'); setFilterAvailability('all'); setSortOrder('none'); setOnlyAvailableThisMonth(false);}} 
              className="px-10 py-4 bg-bordeaux-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-bordeaux-950 transition-all"
            >
              Restablecer Filtros
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
