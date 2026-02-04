
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
  vehicleId: string;
  tipo: 'Check-In' | 'Check-Out';
  fecha: string;
  responsable: string;
  kilometraje: number;
  combustible: '1/8' | '1/4' | '1/2' | '3/4' | 'Full';
  exterior: InspectionItem[];
  interior: InspectionItem[];
  mecanica: InspectionItem[];
  observacionesGlobales: string;
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
  vencimientoKM?: number;
  vencimientoFecha?: string; // Añadido para seguimiento por fecha
  realizado: boolean;
}

export interface MaintenanceThresholds {
  kmThreshold: number;
  daysThreshold: number;
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
  kilometrajeActual: number;
  mantenimientoKM?: number;
  transmision?: string;
  combustible?: string;
  asientos?: number;
  tipo?: string;
  maintenanceStatus?: 'ok' | 'warning' | 'critical';
  maintenanceKMLeft?: number;
  maintenanceDaysLeft?: number;
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
