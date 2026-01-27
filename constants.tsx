import { Vehicle } from './types';

// APP VERSIONING
export const APP_VERSION = 'MASTER v3.5 GOLD';

export const FILTER_DATE_START = '2026-01-01';
export const GOOGLE_SHEET_RESERVATIONS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vXXXXX/pub?output=csv';
export const GOOGLE_SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/XXXXX/exec';

export const INITIAL_FLOTA: Vehicle[] = [
  {
    id: '2',
    nombre: "Toyota Vitz Blanco",
    precio: 195.0,
    img: "https://i.ibb.co/Y7ZHY8kX/pngegg.png",
    estado: "Disponible",
    placa: "AAVP719",
    color: "Blanco",
    specs: ["1.3L VVTi", "Automático CVT", "Nafta", "ABS + Airbags"],
    transmision: "Automático",
    combustible: "Nafta",
    asientos: 5,
    tipo: 'Compacto',
    kilometrajeActual: 85000,
    mantenimientoKM: 90000
  },
  {
    id: '3',
    nombre: "Toyota Vitz Negro",
    precio: 195.0,
    img: "https://i.ibb.co/rKFwJNZg/2014-toyota-yaris-hatchback-2014-toyota-yaris-2018-toyota-yaris-toyota-yaris-yaris-toyota-vitz-fuel.png",
    estado: "Disponible",
    placa: "AAOR725",
    color: "Negro",
    specs: ["1.3L Dark Edition", "Nafta", "Eco Mode", "Llantas Deportivas"],
    transmision: "Automático",
    combustible: "Nafta",
    asientos: 5,
    tipo: 'Compacto',
    kilometrajeActual: 78000
  },
  {
    id: '5',
    nombre: "Toyota Wish Gris",
    precio: 230.0,
    img: "https://i.ibb.co/d0bCm8Nj/WISH-2009.png", 
    estado: "Disponible",
    placa: "AAVP924",
    color: "Gris Plata",
    specs: ["1.8L Valvematic", "7 Pasajeros", "Nafta"],
    transmision: "Automático",
    combustible: "Nafta",
    asientos: 7,
    tipo: 'Familiar',
    kilometrajeActual: 92000
  },
  {
    id: '4',
    nombre: "Toyota Voxy Gris",
    precio: 240.0,
    img: "https://i.ibb.co/VpSpSJ9Q/voxy.png",
    estado: "Disponible",
    placa: "AAUG465",
    color: "Gris",
    specs: ["2.0L Dual VVTi", "Puertas Eléctricas", "Nafta", "8 Pasajeros"],
    transmision: "Automático",
    combustible: "Nafta",
    asientos: 7,
    tipo: 'Familiar',
    kilometrajeActual: 105000
  },
  {
    id: '1',
    nombre: "Hyundai Tucson Blanco",
    precio: 260.0,
    img: "https://i.ibb.co/rGJHxvbm/Tucson-sin-fondo.png",
    estado: "Disponible",
    placa: "AAVI502",
    color: "Blanco",
    specs: ["2.0 Turbo Diesel", "Transmisión Secuencial", "Diesel", "Apple CarPlay"],
    transmision: "Automático",
    combustible: "Diesel",
    asientos: 5,
    tipo: 'SUV',
    kilometrajeActual: 65000
  }
];

export const CONTRACT_CLAUSES = [
  "OBJETO: El Arrendador otorga en alquiler el vehículo descrito al Arrendatario en perfectas condiciones.",
  "AUTORIZACIÓN: Se autoriza la conducción en Paraguay y todo el MERCOSUR exclusivamente al titular.",
  "HORARIOS: El retiro y entrega debe realizarse estrictamente entre las 08:00 y las 17:00 hs.",
  "MULTAS POR RETRASO: El retraso mayor a 1 hora sin aviso previo conlleva multas de media diaria. Si supera las 4 horas, se cobrará una diaria completa adicional automáticamente.",
  "TOLERANCIA: Máxima de 1 hora para la devolución. Pasado el tiempo, se cobrará recargo operativo por hora extra.",
  "ESTADO DE ENTREGA: El vehículo se entrega limpio, con tanque lleno y fluidos verificados. Cualquier daño estético no reportado al inicio será responsabilidad del socio.",
  "USO PROHIBIDO: Queda prohibido el transporte de materiales ilícitos, carreras, subarrendamiento o uso comercial de carga pesada.",
  "KILOMETRAJE: Límite de 200 km por día. El excedente tiene un costo de Gs. 100.000 por cada tramo de 50km adicionales.",
  "SEGURO Y SINIESTROS: En caso de accidente, el socio debe contactar inmediatamente a MAPFRE y no mover el vehículo. La franquicia/garantía es de Gs. 5.000.000.",
  "DOCUMENTACIÓN: El socio es responsable civil y penal de lo ocurrido dentro de la unidad durante el periodo de arrendamiento.",
  "VALIDACIÓN: Toda reserva está sujeta a la validación del pago y documentos por parte del equipo JM Asociados.",
  "JURISDICCIÓN: Para cualquier disputa legal, las partes se someten a los tribunales de Ciudad del Este, Alto Paraná."
];

export type Language = 'es' | 'pt' | 'en';

export const TRANSLATIONS: Record<Language, any> = {
  es: {
    rent: "Alquilar",
    next: "Siguiente Paso",
    confirm: "Finalizar Reserva",
    copy: "Copiar",
    copied: "Copiado!",
    fleet: "Flota Platinum",
    office: "Sede Central",
    security: "Asistencia",
    management: "Gestión",
    available: "Disponible",
    booked: "Confirmado",
    details: "Ficha Técnica",
    agenda: "Disponibilidad",
    price: "Tarifa",
    perDay: "por día",
    status: {
      review: "En Revisión",
      pending: "Pendiente Pago",
      confirmed: "Confirmado",
      completed: "Finalizado",
      cancelled: "Cancelado"
    }
  },
  pt: {
    rent: "Alugar",
    next: "Próximo Passo",
    confirm: "Finalizar Reserva",
    copy: "Copiar",
    copied: "Copiado!",
    fleet: "Frota Platinum",
    office: "Sede Central",
    security: "Assistência",
    management: "Gestão",
    available: "Disponível",
    booked: "Confirmado",
    details: "Ficha Técnica",
    agenda: "Disponibilidade",
    price: "Tarifa",
    perDay: "por dia",
    status: {
      review: "Em Revisión",
      pending: "Pendente Pagto",
      confirmed: "Confirmado",
      completed: "Finalizado",
      cancelled: "Cancelado"
    }
  },
  en: {
    rent: "Rent",
    next: "Next Step",
    confirm: "Complete Booking",
    copy: "Copy",
    copied: "Copied!",
    fleet: "Platinum Fleet",
    office: "HQ Office",
    security: "Support",
    management: "Management",
    available: "Available",
    booked: "Confirmed",
    details: "Technical Specs",
    agenda: "Availability",
    price: "Rate",
    perDay: "per day",
    status: {
      review: "Under Review",
      pending: "Pending Payment",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled"
    }
  }
};