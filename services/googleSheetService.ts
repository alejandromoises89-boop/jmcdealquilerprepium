
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

const parseSheetAmount = (val: string): number => {
  if (!val) return 0;
  // Limpiar símbolos de moneda R$, Gs, etc
  let clean = val.replace(/[R$Gs\s]/g, '');
  
  // Manejo de decimales (Brasil/Paraguay usa coma)
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  
  const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

// Convierte fechas DD/MM/AAAA o DD-MM-AAAA a YYYY-MM-DD para compatibilidad
const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Si ya es ISO (contiene guiones y empieza por año 20xx)
    if (dateStr.match(/^20\d{2}-\d{2}-\d{2}/)) return dateStr.split(' ')[0];

    const clean = dateStr.split(' ')[0]; // quitar hora si existe
    if (clean.includes('/')) {
        const parts = clean.split('/');
        if (parts.length === 3) {
            // Asumimos DD/MM/YYYY
            const d = parts[0].padStart(2, '0');
            const m = parts[1].padStart(2, '0');
            const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            return `${y}-${m}-${d}`;
        }
    }
    return clean;
};

export const fetchReservationsFromSheet = async (): Promise<Reservation[] | null> => {
  const controller = new AbortController();
  // Increased timeout to 30s and added reason
  const timeoutId = setTimeout(() => controller.abort(new Error('Connection timeout')), 30000); 
  try {
    const response = await fetch(`${GOOGLE_SHEET_RESERVATIONS_URL}&cache_bust=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const csvText = await response.text();
    
    // Validar que no sea un error de Google Login
    if (csvText.includes('<!DOCTYPE html>')) {
        console.error("Error: Google Sheet no es público o requiere login.");
        return null;
    }

    const rows = parseCSV(csvText);
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
    const dataRows = rows.slice(1);

    return dataRows.map((row, index): Reservation => {
      const getVal = (possibleHeaders: string[]) => {
        for (const h of possibleHeaders) {
          const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          const idx = headers.indexOf(cleanH);
          if (idx !== -1 && row[idx]) return row[idx].replace(/^"(.*)"$/, '$1').trim();
        }
        return '';
      };

      const cliente = getVal(['cliente', 'nombre', 'socio', 'arrendatario', 'nombre completo']);
      
      // Columnas críticas para calendario
      // Importante: Normalizar la fecha a YYYY-MM-DD para que el calendario la entienda
      const salidaRaw = getVal(['inicio', 'salida', 'fecha salida', 'start', 'f. salida']);
      const entregaRaw = getVal(['fin', 'entrega', 'fecha entrega', 'end', 'f. entrega', 'retorno']);
      
      const inicio = normalizeDate(salidaRaw);
      const fin = normalizeDate(entregaRaw) || inicio;

      const auto = getVal(['auto', 'vehiculo', 'unidad', 'modelo', 'coche']);
      
      // Actualizado para reconocer 'tr', 't.r', 'totalbrl'
      const totalStr = getVal(['tr', 't.r', 'total', 'monto', 'precio', 'totalbrl', 'reales', 'total r$']);
      
      const totalNum = parseSheetAmount(totalStr);
      
      return {
        id: `CLOUD-${index}-${cliente.substring(0,3)}`,
        cliente: cliente || 'Reserva Externa',
        email: 'cloud@jmasociados.com', 
        ci: 'SINCRO-NUBE', 
        documentType: 'CI', 
        celular: '---',
        auto: auto || 'Unidad No Definida', 
        inicio: inicio, 
        fin: fin,
        total: totalNum, 
        status: 'Confirmed', // Asumimos confirmado si está en la hoja
        includeInCalendar: true
      };
    }).filter(r => r.inicio && r.auto && r.auto !== 'Unidad No Definida');
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn("Fetch aborted due to timeout");
    } else {
      console.error("Error fetching sheet:", error);
    }
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
