
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

export const fetchReservationsFromSheet = async (): Promise<Reservation[] | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); 

  try {
    const response = await fetch(`${GOOGLE_SHEET_RESERVATIONS_URL}&cache_bust=${Date.now()}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const csvText = await response.text();
    if (csvText.includes('<!DOCTYPE html>')) {
      console.warn("Google Sheets returned HTML instead of CSV. Ensure the sheet is public or the URL is correct.");
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

      const includeInCalStr = getVal(['includeInCalendar', 'calendar', 'visible', 'calendario']).toLowerCase();
      // Default to true unless explicitly false or no
      const includeInCalendar = includeInCalStr === '' || includeInCalStr === 'true' || includeInCalStr === '1' || includeInCalStr === 'si' || includeInCalStr === 'yes';

      return {
        id: getVal(['id', 'reserva', 'uuid']) || `SHEET-${index}-${Date.now()}`,
        cliente: getVal(['cliente', 'nombre', 'name']) || 'Cliente VIP',
        ci: getVal(['ci', 'documento', 'id']) || 'N/A',
        celular: getVal(['celular', 'whatsapp', 'phone']) || 'N/A',
        auto: getVal(['auto', 'vehculo', 'vehicle']).toLowerCase() || 'unidad',
        inicio: getVal(['inicio', 'desde', 'start', 'fecha']),
        fin: getVal(['fin', 'hasta', 'end']) || getVal(['inicio', 'desde', 'fecha']),
        total: parseFloat(getVal(['total', 'monto', 'price']).replace(/[^0-9.]/g, '')) || 0,
        status: (getVal(['status', 'estado']) as any) || 'Confirmed',
        admissionStatus: 'Approved',
        includeInCalendar: includeInCalendar
      };
    }).filter(r => r.inicio);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error al leer Google Sheet:", error);
    return null;
  }
};

export const saveReservationToSheet = async (res: Reservation): Promise<boolean> => {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('XXXXX')) {
    console.warn("URL de WebApp no configurada para guardado persistente.");
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(res),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error al guardar en Google Sheet:", error);
    return false;
  }
};
