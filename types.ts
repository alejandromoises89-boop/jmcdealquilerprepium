
export interface User {
  name: string;
  email: string;
  picture?: string;
  isAdmin: boolean;
}

export interface InspectionItem {
  label: string;
  status: 'ok' | 'bad' | 'na';
  obs?: string;
}

export interface ChecklistLog {
  id: string;
  tipo: 'Check-In' | 'Check-Out';
  fecha: string;
  responsable: string;
  kilometraje: number;
  combustible: '1/8' | '1/4' | '1/2' | '3/4' | 'Full';
  // Categorías profesionales
  exterior: InspectionItem[];
  interior: InspectionItem[];
  mecanica: InspectionItem[];
  documentacion: InspectionItem[];
  observacionesGlobales: string;
  firmado: boolean;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  fecha: string;
  kilometraje: number;
  descripcion: string;
  monto: number;
  tipo: 'Preventivo' | 'Correctivo' | 'Lavado' | 'Otro';
  // Campos para alertas
  vencimientoFecha?: string;
  vencimientoKM?: number;
  realizado: boolean;
  images?: string[]; // Added for photos
}

export interface ExpirationRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  tipo: 'Seguro' | 'Patente' | 'Cuota' | 'Inspección' | 'Otros';
  vencimiento: string;
  monto: number;
  pagado: boolean;
  referencia?: string;
}

export interface Vehicle {
  id: string;
  nombre: string;
  precio: number;
  img: string;
  estado: 'Disponible' | 'En Taller' | 'En Alquiler';
  placa: string;
  color: string;
  specs: string[];
  kilometrajeActual: number; // Obligatorio ahora para cálculos
  mantenimientoKM?: number;
  checklists?: ChecklistLog[];
  transmision?: string;
  combustible?: string;
  asientos?: number;
  tipo?: string;
  lastLat?: number;
  lastLng?: number;
  // Propiedad calculada para alertas de UI
  maintenanceStatus?: 'ok' | 'warning' | 'critical'; 
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
  total: number;
  status: 'Review' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  comprobante?: string;
  driverLicense?: string;
  signature?: string;
  includeInCalendar?: boolean;
  contractAccepted?: boolean;
  obs?: string; // Nuevo campo para notas de cambios
}

export interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  categoria: 'Mantenimiento' | 'Seguros' | 'Operativo' | 'Cuotas' | 'Otros';
  vehicleId?: string; 
}

export interface Breakdown {
  id: string;
  vehicleId: string;
  vehicleName: string;
  descripcion: string;
  fecha: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  resuelta: boolean;
  evidencia: string[];
}
