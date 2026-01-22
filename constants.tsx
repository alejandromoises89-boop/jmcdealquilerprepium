
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
    specs: [
      "Motor: 1.3L VVTi - Eficiencia Japonesa",
      "Transmisión: Automática CVT Inteligente",
      "Consumo: 5.5L/100km (Eco Mode)",
      "Seguridad: Doble Airbag + ABS",
      "Confort: Aire Acondicionado High-Power",
      "Multimedia: Radio Bluetooth + Hands-free"
    ],
    transmision: "Automático",
    combustible: "Nafta",
    asientos: 5,
    tipo: 'Compacto',
    consumo: "5.5L/100km",
    mantenimientoVence: "20/06/2026",
    seguroVence: "10/11/2026"
  },
  {
    id: '3',
    nombre: "Toyota Vitz Negro",
    precio: 195.0,
    img: "https://i.ibb.co/rKFwJNZg/2014-toyota-yaris-hatchback-2014-toyota-yaris-2018-toyota-yaris-toyota-yaris-yaris-toyota-vitz-fuel.png",
    estado: "Disponible",
    placa: "AAOR725",
    color: "Negro",
    specs: [
      "Motor: 1.3L VVTi - Edición Dark",
      "Transmisión: Automática Secuencial",
      "Consumo: 5.5L/100km",
      "Interior: Tapizado Premium Oscuro",
      "Tecnología: Cámara de Retroceso Activa",
      "Extras: Llantas Deportivas Originales"
    ],
    transmision: "Automático",
    combustible: "Nafta",
    asientos: 5,
    tipo: 'Compacto',
    consumo: "5.5L/100km",
    mantenimientoVence: "05/04/2026",
    seguroVence: "01/10/2026"
  },
  {
    id: '5',
    nombre: "Toyota Wish Gris",
    precio: 230.0,
    img: "https://i.ibb.co/KYcHVmZ/Toyota-Wish-2009.jpg",
    estado: "Disponible",
    placa: "AAVP924",
    color: "Gris Plata",
    specs: [
      "Motor: 1.8L Valvematic - Potencia Familiar",
      "Transmisión: Automática Inteligente",
      "Capacidad: 7 Pasajeros Reales",
      "Combustible: Nafta Super",
      "Seguridad: 8 Airbags + Control de Estabilidad",
      "Confort: Climatizador Bi-zona para 3 filas"
    ],
    transmision: "Automático",
    combustible: "Nafta",
    asientos: 7,
    tipo: 'Familiar',
    consumo: "8.5L/100km",
    mantenimientoVence: "01/01/2026",
    seguroVence: "01/01/2027"
  },
  {
    id: '4',
    nombre: "Toyota Voxy Gris",
    precio: 240.0,
    img: "https://i.ibb.co/VpSpSJ9Q/voxy.png",
    estado: "Disponible",
    placa: "AAUG465",
    color: "Gris",
    specs: [
      "Motor: 2.0L Dual VVTi - Alto Torque",
      "Puertas: Doble Lateral Eléctrica",
      "Capacidad: 7-8 Pasajeros Premium",
      "Interior: Butacas Capitán Modular",
      "Tecnología: Pantalla Multimedia Trasera",
      "Ideal: Viajes Largos y Grupos VIP"
    ],
    transmision: "Automático",
    combustible: "Nafta",
    asientos: 7,
    tipo: 'Familiar',
    consumo: "10.5L/100km",
    mantenimientoVence: "10/08/2026",
    seguroVence: "22/09/2026"
  },
  {
    id: '1',
    nombre: "Hyundai Tucson Blanco",
    precio: 260.0,
    img: "https://i.ibb.co/rGJHxvbm/Tucson-sin-fondo.png",
    estado: "Disponible",
    placa: "AAVI502",
    color: "Blanco",
    specs: [
      "Motor: 2.0 Turbo Diesel CRDi",
      "Transmisión: Automática H-Matic",
      "Interior: Cuero Premium Microperforado",
      "Techo: Panorámico Solar de Apertura Total",
      "Seguridad: Sensores 360° + Frenado Autónomo",
      "Tecnología: Apple CarPlay & Android Auto Wireless"
    ],
    transmision: "Automático",
    combustible: "Diesel",
    asientos: 5,
    tipo: 'SUV',
    consumo: "7.8L/100km",
    mantenimientoVence: "15/05/2026",
    seguroVence: "12/12/2026"
  }
];

export const GOOGLE_SHEET_ID = "1cGvNGAtCh84Gvs3-x7n0I2W-rqbG3W2z";
export const GOOGLE_SHEET_WEBAPP_URL = "https://docs.google.com/spreadsheets/d/1cGvNGAtCh84Gvs3-x7n0I2W-rqbG3W2z/edit?usp=drivesdk&ouid=105620396881392132951&rtpof=true&sd=true"; 
export const GOOGLE_SHEET_RESERVATIONS_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Reservas`;
export const GOOGLE_SHEET_EMBED_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?usp=sharing`;

// Cambiado a 2025 para permitir sincronización de datos actuales
export const FILTER_DATE_START = new Date('2025-01-01');
