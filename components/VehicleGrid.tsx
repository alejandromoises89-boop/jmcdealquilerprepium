
import React, { useState } from 'react';
import { Vehicle, Reservation } from '../types';
import { TRANSLATIONS, Language } from '../constants';
import VehicleCard from './VehicleCard';
import BookingModal from './BookingModal';
import { Car } from 'lucide-react';

interface VehicleGridProps {
  flota: Vehicle[];
  exchangeRate: number;
  reservations: Reservation[];
  onAddReservation: (res: Reservation) => void;
  language?: Language;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({ flota, exchangeRate, reservations, onAddReservation, language = 'es' }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [initialDates, setInitialDates] = useState<{start: Date, end: Date} | undefined>(undefined);

  const t = TRANSLATIONS[language];

  const handleVehicleSelect = (vehicle: Vehicle, start?: Date, end?: Date) => {
    setSelectedVehicle(vehicle);
    if (start && end) {
      setInitialDates({ start, end });
    } else {
      setInitialDates(undefined);
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 animate-slideUp">
        {flota.map((vehicle) => (
          <VehicleCard 
            key={vehicle.id} 
            vehicle={vehicle} 
            exchangeRate={exchangeRate}
            reservations={reservations}
            onSelect={(start, end) => handleVehicleSelect(vehicle, start, end)}
            language={language}
          />
        ))}

        {flota.length === 0 && (
          <div className="col-span-full py-32 text-center space-y-8 animate-fadeIn">
            <div className="w-32 h-32 bg-gray-50 dark:bg-dark-elevated rounded-[3rem] flex items-center justify-center mx-auto text-gray-200 dark:text-white/10 shadow-inner">
              <Car size={60} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-serif font-bold text-gray-400 uppercase tracking-tighter">Sin Unidades</h3>
              <p className="text-gray-300 font-medium">No se han cargado vehículos en el sistema.</p>
            </div>
          </div>
        )}
      </div>

      {selectedVehicle && (
        <BookingModal 
          vehicle={selectedVehicle}
          exchangeRate={exchangeRate}
          reservations={reservations}
          initialDates={initialDates}
          onClose={() => setSelectedVehicle(null)}
          language={language}
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
