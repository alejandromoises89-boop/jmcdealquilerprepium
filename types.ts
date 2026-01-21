
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
  tipo?: 'SUV' | 'Compacto' | 'Familiar';
  consumo?: string;
  mantenimientoVence?: string;
  seguroVence?: string;
}

export interface InspectionChecklist {
  neumaticos: boolean;
  fluidos: boolean;
  limpieza: boolean;
  combustible: number; // 0-100
  danos: string;
}

export interface Reservation {
  id: string;
  cliente: string;
  email?: string;
  ci: string;
  celular: string;
  auto: string;
  inicio: string;
  fin: string;
  total: number; // in BRL
  paymentType?: 'Full' | 'OneDay';
  comprobante?: string; // base64
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  inspection?: InspectionChecklist;
}

export interface Gasto {
  id: string;
  concepto: string;
  monto: number; // in BRL
  fecha: string;
  categoria: 'Mantenimiento' | 'Seguros' | 'Operativo' | 'Otros';
}

export interface User {
  name: string;
  email: string;
  picture: string;
  isAdmin: boolean;
}

export interface Breakdown {
  id: string;
  vehicleId: string;
  vehicleName: string;
  descripcion: string;
  fecha: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  resuelta: boolean;
}
