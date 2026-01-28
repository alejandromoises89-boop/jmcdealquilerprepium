
import { Reservation } from '../types';
import { GOOGLE_SHEET_RESERVATIONS_URL, GOOGLE_SHEET_WEBAPP_URL } from '../constants';

const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"'; i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        row.push(currentField.trim());
        if (row.length > 0) result.push(row);
        row = []; currentField = '';
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
  }
  if (currentField || row.length > 0) {
    row.push(currentField.trim());
    result.push(row);
  }
  return result;
};

// Función específica para moneda Real Brasileño (BRL)
// Formatos comunes en Sheets: "R$ 1.500,00", "1500,00", "1.500"
const parseSheetAmount = (val: string): number => {
  if (!val) return 0;
  
  let clean = val.toUpperCase().replace(/[R$\s]/g, ''); // Quitar R$ y espacios
  
  // Si tiene formato latino/europeo (1.200,50)
  if (clean.includes(',') && clean.includes('.')) {
     // Eliminar puntos de miles
     clean = clean.replace(/\./g, '');
     // Reemplazar coma decimal por punto
     clean = clean.replace(',', '.');
  } 
  // Si solo tiene comas (1200,50)
  else if (clean.includes(',')) {
     clean = clean.replace(',', '.');
  }
  // Si solo tiene puntos pero parece miles (1.200 -> 1200)
  // Regla simple: Si hay un punto y son 3 digitos despues, es mil.
  else if (clean.includes('.') && clean.split('.')[1].length === 3) {
     clean = clean.replace(/\./g, '');
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

// Normalizar fechas de Planilla (DD/MM/YYYY) a App (YYYY-MM-DD)
const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    const clean = dateStr.trim().split(' ')[0]; // Quitar hora
    
    // Caso DD/MM/YYYY o DD-MM-YYYY
    if (clean.includes('/') || clean.includes('-')) {
        const separator = clean.includes('/') ? '/' : '-';
        const parts = clean.split(separator);
        
        // Asumimos formato Paraguay/Brasil: Dia Mes Año
        if (parts.length === 3) {
            let d = parts[0];
            let m = parts[1];
            let y = parts[2];

            // Si el año es corto (26), convertir a 2026
            if (y.length === 2) y = `20${y}`;
            
            // Si por error viene YYYY-MM-DD, devolver directo
            if (d.length === 4) return `${d}-${m}-${y}`; 

            return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        }
    }
    return clean;
};

export const fetchReservationsFromSheet = async (): Promise<Reservation[] | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error('Connection timeout')), 30000); 
  try {
    const response = await fetch(`${GOOGLE_SHEET_RESERVATIONS_URL}&cache_bust=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const csvText = await response.text();
    
    if (csvText.includes('<!DOCTYPE html>')) {
        console.error("Error: Google Sheet no es público o requiere login.");
        return null;
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) return [];

    // Normalizar headers para búsqueda flexible
    const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[^a-z0-9áéíóúñ]/g, ''));
    const dataRows = rows.slice(1);

    return dataRows.map((row, index): Reservation => {
      const getVal = (possibleHeaders: string[]) => {
        for (const h of possibleHeaders) {
          const cleanH = h.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, '');
          // Buscar match exacto o parcial
          const idx = headers.findIndex(header => header === cleanH || header.includes(cleanH));
          if (idx !== -1 && row[idx]) return row[idx].replace(/^"(.*)"$/, '$1').trim();
        }
        return '';
      };

      // Mapeo específico para Hoja 2026 General
      const cliente = getVal(['cliente', 'nombre', 'socio', 'titular']);
      
      const salidaRaw = getVal(['salida', 'inicio', 'fecha salida', 'retiro']);
      const entregaRaw = getVal(['retorno', 'llegada', 'fin', 'devolucion', 'entrega']);
      
      const inicio = normalizeDate(salidaRaw);
      const fin = normalizeDate(entregaRaw) || inicio;

      const auto = getVal(['vehiculo', 'auto', 'unidad', 'modelo']);
      
      // CAMBIO SOLICITADO: Prioridad a Columna "T.R" o "Total Reales"
      // Se busca específicamente encabezados que contengan 't.r' o 'tr' o 'total reales'
      const totalStr = getVal(['t.r', 'tr', 'total reales', 'total r$']);
      
      const totalNum = parseSheetAmount(totalStr);
      
      // Filtrar filas vacías o totales generales de la hoja
      if (!cliente || !auto || !inicio) return null as any;

      return {
        id: `CLOUD-${index}-${cliente.substring(0,3).toUpperCase()}`,
        cliente: cliente.toUpperCase(),
        email: 'cloud@jmasociados.com', 
        ci: 'SINCRO-NUBE', 
        documentType: 'CI', 
        celular: '---',
        auto: auto.toUpperCase(), 
        inicio: inicio, 
        fin: fin,
        total: totalNum, 
        status: 'Confirmed', 
        includeInCalendar: true
      };
    }).filter(r => r && r.inicio && r.auto); // Eliminar nulos
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Error fetching sheet:", error);
    return null;
  }
};

export const saveReservationToSheet = async (res: Reservation): Promise<boolean> => {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('YOUR_SCRIPT_ID')) return false;
  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(res)
    });
    return true;
  } catch (error) {
    console.error("Error saving to sheet:", error);
    return false;
  }
};
