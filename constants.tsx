
import { Vehicle } from './types';

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
    tipo: 'Compacto'
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
    tipo: 'Familiar'
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
    tipo: 'Familiar'
  },
  {
    id: '1',
    nombre: "Hyundai Tucson Blanco",
    precio: 260.0,
    img: "https://i.ibb.co/rGJHxvbm/Tucson-sin-fondo.png",
    estado: "Disponible",
    placa: "AAVI502",
    color: "Blanco",
    specs: ["2.0 Turbo Diesel", "Techo Panorámico", "Diesel", "Apple CarPlay"],
    transmision: "Automático",
    combustible: "Diesel",
    asientos: 5,
    tipo: 'SUV'
  }
];

export const GOOGLE_SHEET_ID = "1cGvNGAtCh84Gvs3-x7n0I2W-rqbG3W2z";
export const GOOGLE_SHEET_WEBAPP_URL = "https://docs.google.com/spreadsheets/d/1cGvNGAtCh84Gvs3-x7n0I2W-rqbG3W2z/edit?usp=drivesdk"; 
export const GOOGLE_SHEET_RESERVATIONS_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Reservas`;
export const FILTER_DATE_START = new Date('2026-01-01');

export type Language = 'es' | 'pt' | 'en';

export const CONTRACT_CLAUSES = [
  "OBJETO: El Arrendador otorga en alquiler el vehículo descrito al Arrendatario.",
  "AUTORIZACIÓN: Se autoriza la conducción en Paraguay y todo el MERCOSUR.",
  "HORARIOS: El retiro y entrega debe realizarse entre las 08:00 y las 17:00 hs.",
  "MULTAS: El retraso mayor a 1 hora sin aviso previo conlleva multas de media diaria.",
  "TOLERANCIA: Máxima de 1 hora. Pasado el tiempo, se cobrará recargo por hora extra.",
  "ESTADO: El vehículo se entrega limpio y con fluidos verificados mediante video.",
  "USO: El vehículo será utilizado exclusivamente para fines lícitos y personales.",
  "KM: Límite de 200 km por día. Excedente a Gs. 100.000 por cada tramo.",
  "SEGURO: Cobertura de Responsabilidad Civil y Accidentes por Mapfre S.A.",
  "DEPÓSITO: Gs. 5.000.000 de garantía en caso de siniestro por negligencia.",
  "RESPONSABILIDAD: El Arrendatario es responsable civil y penal de lo ocurrido dentro del vehículo.",
  "JURISDICCIÓN: Para cualquier disputa, se someten a los tribunales de Alto Paraná."
];

export const TRANSLATIONS: Record<Language, any> = {
  es: {
    rent: "Alquilar",
    next: "Siguiente",
    confirm: "Finalizar Reserva",
    copy: "Copiar",
    copied: "Copiado!",
    fleet: "Flota VIP",
    office: "Sede CDE",
    security: "Seguridad",
    management: "Gestión",
    available: "Disponible",
    booked: "Bloqueado",
    details: "Detalles",
    agenda: "Agenda",
    price: "Precio",
    perDay: "por día",
    steps: ["Disponibilidad", "Socio & Documentos", "Contrato Digital", "Pago & Activación", "Ticket JM", "Validación"],
    payData: {
      pix: "24510861818",
      bank: "ueno Bank / Santander",
      acc: "1008110",
      holder: "Marina Baez"
    }
  },
  pt: {
    rent: "Alugar",
    next: "Próximo",
    confirm: "Finalizar Reserva",
    copy: "Copiar",
    copied: "Copiado!",
    fleet: "Frota VIP",
    office: "Sede CDE",
    security: "Segurança",
    management: "Gestão",
    available: "Disponível",
    booked: "Bloqueado",
    details: "Detalhes",
    agenda: "Agenda",
    price: "Preço",
    perDay: "por día",
    steps: ["Disponibilidade", "Sócio & Docs", "Contrato Digital", "Pagamento", "Ticket JM", "Validação"],
    payData: {
      pix: "24510861818",
      bank: "ueno Bank / Santander",
      acc: "1008110",
      holder: "Marina Baez"
    }
  },
  en: {
    rent: "Rent",
    next: "Next",
    confirm: "Complete Booking",
    copy: "Copy",
    copied: "Copied!",
    fleet: "VIP Fleet",
    office: "CDE Office",
    security: "Security",
    management: "Management",
    available: "Available",
    booked: "Booked",
    details: "Details",
    agenda: "Calendar",
    price: "Price",
    perDay: "per day",
    steps: ["Availability", "Partner & Docs", "Digital Contract", "Payment", "JM Ticket", "Validation"],
    payData: {
      pix: "24510861818",
      bank: "ueno Bank / Santander",
      acc: "1008110",
      holder: "Marina Baez"
    }
  }
};
