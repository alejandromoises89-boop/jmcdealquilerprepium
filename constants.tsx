
import { Vehicle } from './types';

export const INITIAL_FLOTA: Vehicle[] = [
  {
    id: '1',
    nombre: "Hyundai Tucson Blanco",
    precio: 260.0,
    img: "https://i.ibb.co/rGJHxvbm/Tucson-sin-fondo.png",
    estado: "Disponible",
    placa: "AAVI502",
    color: "Blanco",
    specs: [
      "Motor: 2.0 Turbo Diesel CRDi - Eficiencia y Potencia",
      "Transmisión: Automática Secuencial H-Matic de 6 Velocidades",
      "Seguridad: 6 Airbags, Frenos ABS + EBD, Control de Estabilidad VSC",
      "Interior: Asientos de Cuero Premium con Ajuste Eléctrico",
      "Tecnología: Pantalla Táctil 10.25' con Apple CarPlay & Android Auto",
      "Confort: Techo Solar Panorámico, Climatizador Bi-zona",
      "Extras: Sensores 360°, Cámara de Reversa Dinámica",
      "Capacidad: Amplio Maletero de 513 litros"
    ],
    transmision: "Automático",
    combustible: "Diesel",
    asientos: 5,
    tipo: 'SUV',
    consumo: "7.8L/100km",
    mantenimientoVence: "15/05/2026",
    seguroVence: "12/12/2026"
  },
  {
    id: '2',
    nombre: "Toyota Vitz Blanco",
    precio: 195.0,
    img: "https://i.ibb.co/Y7ZHY8kX/pngegg.png",
    estado: "Disponible",
    placa: "AAVP719",
    color: "Blanco",
    specs: [
      "Motor: 1.3L VVTi - Ultra Bajo Consumo",
      "Transmisión: Automática CVT Inteligente",
      "Seguridad: Airbags Frontales y Cortina, Frenos ABS",
      "Consumo: 18km/L en ciclo mixto - Ideal Ciudad",
      "Tecnología: Radio Smart con Bluetooth y Mandos al Volante",
      "Confort: Aire Acondicionado de Alta Capacidad",
      "Extras: Sistema de Entrada Sin Llave (Smart Entry)",
      "Maniobrabilidad: Radio de giro reducido para estacionamiento fácil"
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
      "Motor: 1.3L VVTi - Tecnología ECO de Toyota",
      "Transmisión: Automática Automática Secuencial",
      "Estética: Interior Dark-Series Premium",
      "Seguridad: Frenos con Asistencia de Frenado (BA)",
      "Tecnología: Cámara de Retroceso con Guías Activas",
      "Confort: Climatizador Digital Silencioso",
      "Extras: Llantas de Aleación Deportivas Originales",
      "Mantenimiento: Service recién realizado - Listo para Viajes"
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
    id: '4',
    nombre: "Toyota Voxy Gris",
    precio: 240.0,
    img: "https://i.ibb.co/VpSpSJ9Q/voxy.png",
    estado: "Disponible",
    placa: "AAUG465",
    color: "Gris",
    specs: [
      "Motor: 2.0L Dual VVTi - Potencia para 7 Personas",
      "Configuración: 3 Filas de Asientos Reales",
      "Puertas: Doble Puerta Lateral Eléctrica Corrediza",
      "Seguridad: Sensores de Estacionamiento Delanteros y Traseros",
      "Confort: Aire Acondicionado con Control Trasero Independiente",
      "Interior: Asientos Ajustables con Modo Cama",
      "Extras: Pantalla Multimedia para Pasajeros Traseros",
      "Ideal para: Traslados de Ejecutivos o Grupos Familiares"
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
    id: '5',
    nombre: "Toyota Wish 2010 Gris",
    precio: 220.0,
    img: "https://i.ibb.co/XrbktMmw/image.jpg", 
    estado: "Disponible",
    placa: "AAXH123",
    color: "Gris Plata",
    specs: [
      "Motor: 1.8L Valvematic - Equilibrio entre Potencia y Ahorro",
      "Transmisión: Super CVT-i de 7 Velocidades",
      "Capacidad: 7 Pasajeros con Versatilidad de Asientos",
      "Seguridad: 8 Airbags (Frontales, Laterales y Rodilla)",
      "Confort: Control de Velocidad Crucero, Smart Key",
      "Tecnología: Panel de Instrumentos Optitron High-Definition",
      "Extras: Maletero Modular de Gran Capacidad",
      "Conducción: Suspensión Confort Plus - Ideal para Rutas"
    ],
    transmision: "Automático",
    combustible: "Nafta",
    asientos: 7,
    tipo: 'Familiar',
    consumo: "8.2L/100km",
    mantenimientoVence: "01/01/2026",
    seguroVence: "01/01/2027"
  }
];

export const GOOGLE_SHEET_ID = "1cGvNGAtCh84Gvs3-x7n0I2W-rqbG3W2z";
export const GOOGLE_SHEET_RESERVATIONS_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Reservas`;
export const GOOGLE_SHEET_EMBED_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit?usp=sharing`;

export const FILTER_DATE_START = new Date('2026-01-01');
