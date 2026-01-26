
// Fix: Added missing User interface to support authentication components
export interface User {
  name: string;
  email: string;
  picture?: string;
  isAdmin: boolean;
}

export interface ChecklistLog {
  fecha: string;
  responsable: string;
  combustible: '1/8' | '1/4' | '1/2' | '3/4' | 'Full';
  limpiezaInterior: boolean;
  limpiezaExterior: boolean;
  auxilio: {
    gato: boolean;
    llaveRueda: boolean;
    triangulo: boolean;
    extintor: boolean;
    auxiliar: boolean;
  };
  observaciones: string;
  firma?: string;
}

export interface Vehicle {
  id: string;
  nombre: string;
  precio: number; // in BRL
  img: string;
  estado: 'Disponible' | 'En Taller' | 'En Alquiler';
  placa: string;
  color: string;
  specs: string[];
  transmision?: string;
  combustible?: string;
  asientos?: number;
  tipo?: 'SUV' | 'Compacto' | 'Familiar' | 'PickUp';
  consumo?: string;
  mantenimientoVence?: string; 
  mantenimientoKM?: number; 
  seguroVence?: string;
  cuotaSeguro?: number;
  cuotaMantenimiento?: number;
  vencimientoCuota?: string; 
  kilometrajeActual?: number;
  serviceChecklist?: {
    aceite: boolean;
    filtroAceite: boolean;
    filtroAire: boolean;
    frenos: boolean;
    alineacion: boolean;
    limpieza: boolean;
  };
}

export interface Reservation {
  id: string;
  cliente: string;
  email: string;
  ci: string;
  documentType: 'CI' | 'RG' | 'Pasaporte';
  celular: string;
  auto: string;
  inicio: string;
  fin: string;
  total: number; // in BRL
  status: 'Requested' | 'Confirmed' | 'Completed' | 'Cancelled';
  comprobante?: string;
  driverLicense?: string;
  signature?: string;
  includeInCalendar?: boolean;
  deliveryLog?: ChecklistLog;
  receptionLog?: ChecklistLog;
}

export interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  categoria: 'Mantenimiento' | 'Seguros' | 'Operativo' | 'Otros';
}

export interface Breakdown {
  id: string;
  vehicleId: string;
  vehicleName: string;
  descripcion: string;
  fecha: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  resuelta: boolean;
  evidencia?: string[];
}