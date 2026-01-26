
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

// Función robusta para parsear montos de la planilla (maneja 1.750,00 -> 1750.00)
const parseSheetAmount = (val: string): number => {
  if (!val) return 0;
  // Si contiene coma y punto, asumimos formato 1.234,56
  // Eliminamos puntos de miles y cambiamos coma por punto decimal
  let clean = val.replace(/\s/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    // Si solo tiene coma, es el decimal
    clean = clean.replace(',', '.');
  }
  const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

export const fetchReservationsFromSheet = async (): Promise<Reservation[] | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); 

  try {
    const response = await fetch(`${GOOGLE_SHEET_RESERVATIONS_URL}&cache_bust=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const csvText = await response.text();
    if (csvText.includes('<!DOCTYPE html>')) return null;

    const rows = parseCSV(csvText);
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
    
    // Sincronización desde la fila 98 (índice 97) para registros 2026 en adelante
    const dataRows = rows.slice(97);

    return dataRows.map((row, index): Reservation => {
      const getVal = (possibleHeaders: string[]) => {
        for (const h of possibleHeaders) {
          const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          const idx = headers.indexOf(cleanH);
          if (idx !== -1 && row[idx]) return row[idx].replace(/^"(.*)"$/, '$1').trim();
        }
        return '';
      };

      const cliente = getVal(['cliente', 'nombrecompleto', 'nombre', 'socio', 'arrendatario']);
      const email = getVal(['email', 'correo', 'mail']) || 'cliente@jmasociados.com';
      const docTypeRaw = getVal(['documenttype', 'tipodocumento', 'tipo']).toUpperCase();
      const documentType: 'CI' | 'RG' | 'Pasaporte' = (docTypeRaw === 'RG' || docTypeRaw === 'PASAPORTE') ? (docTypeRaw as any) : 'CI';
      
      const salida = getVal(['inicio', 'salida', 'desde', 'start', 'fecha', 'fechadesalida']);
      const entrega = getVal(['fin', 'entrega', 'hasta', 'end', 'fechadeentrega']);
      const auto = getVal(['auto', 'vehiculo', 'alquilado', 'unidad', 'modelo']);
      const totalStr = getVal(['total', 'monto', 'precio', 'valor', 'totalbrl']);
      
      const totalNum = parseSheetAmount(totalStr);

      return {
        id: `CLOUD-R98-${index}-${Date.now()}`,
        cliente: cliente || 'Socio Externo',
        email: email,
        ci: 'SINCRO-NUBE',
        documentType: documentType,
        celular: '---',
        auto: auto || 'Unidad No Definida',
        inicio: salida,
        fin: entrega || salida,
        total: totalNum,
        status: 'Confirmed',
        includeInCalendar: true
      };
    }).filter(r => r.inicio && r.auto && r.auto !== 'Unidad No Definida');
  } catch (error) {
    clearTimeout(timeoutId);
    return null;
  }
};

export const saveReservationToSheet = async (res: Reservation): Promise<boolean> => {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('XXXXX')) return false;
  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(res)
    });
    return true;
  } catch (error) {
    return false;
  }
};
